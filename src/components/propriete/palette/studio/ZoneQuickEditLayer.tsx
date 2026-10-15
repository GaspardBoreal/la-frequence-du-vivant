import React from 'react';
import { Polygon, Tooltip, useMap } from 'react-leaflet';
import { RotateCcw, RotateCw, Undo2, Move } from 'lucide-react';
import { rotateRing, translateRing, type Ring } from '@/lib/geomTransform';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';

/** Applique une fonction à chaque anneau GeoJSON [lng, lat] d'un Polygon / MultiPolygon. */
const mapRings = (geom: any, fn: (r: Ring) => Ring): any => {
  if (geom?.type === 'Polygon') return { ...geom, coordinates: geom.coordinates.map((r: Ring) => fn(r)) };
  if (geom?.type === 'MultiPolygon')
    return { ...geom, coordinates: geom.coordinates.map((p: Ring[]) => p.map((r) => fn(r))) };
  return geom;
};
const allPts = (geom: any): [number, number][] =>
  geom?.type === 'Polygon' ? geom.coordinates.flat() : geom?.type === 'MultiPolygon' ? geom.coordinates.flat(2) : [];
const centroid = (geom: any): [number, number] => {
  const pts = allPts(geom);
  if (!pts.length) return [0, 0];
  let x = 0, y = 0;
  pts.forEach(([a, b]) => { x += a; y += b; });
  return [x / pts.length, y / pts.length];
};
const leafletRings = (geom: any): [number, number][][] => {
  const polys = geom?.type === 'Polygon' ? [geom.coordinates] : geom?.type === 'MultiPolygon' ? geom.coordinates : [];
  return polys.map((p: Ring[]) => p[0].map(([lng, lat]) => [lat, lng] as [number, number]));
};

interface Props {
  zone: ProprieteZone;
  color: string;
  fillOpacity: number;
  onCommit: (geometry: any) => void;
}

/**
 * Déplacement direct (glisser) et rotation rapide (↺ / ↻) de l'emplacement sélectionné,
 * sans passer par le mode Transformer. Forme et surface inchangées.
 */
const ZoneQuickEditLayer: React.FC<Props> = ({ zone, color, fillOpacity, onCommit }) => {
  const map = useMap();
  const [geom, setGeom] = React.useState<any>(zone.geometry);
  const [angle, setAngle] = React.useState(0);
  const historyRef = React.useRef<Array<{ geom: any; angle: number }>>([]);
  const [, force] = React.useReducer((n) => n + 1, 0);
  const geomRef = React.useRef(geom);
  geomRef.current = geom;

  React.useEffect(() => {
    setGeom(zone.geometry);
  }, [zone.geometry]);
  React.useEffect(() => {
    historyRef.current = [];
    setAngle(0);
  }, [zone.id]);

  const push = () => {
    historyRef.current = [...historyRef.current.slice(-24), { geom: geomRef.current, angle }];
    force();
  };
  const commit = (g: any) => {
    setGeom(g);
    onCommit(g);
  };

  const rotate = React.useCallback(
    (deg: number) => {
      push();
      const c = centroid(geomRef.current);
      commit(mapRings(geomRef.current, (r) => rotateRing(r, c, (deg * Math.PI) / 180)));
      setAngle((a) => a + deg);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [angle],
  );
  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setAngle(prev.angle);
    commit(prev.geom);
    force();
  };
  const nudge = (dLng: number, dLat: number) => {
    push();
    commit(mapRings(geomRef.current, (r) => translateRing(r, dLng, dLat)));
  };

  // Raccourcis clavier
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const step = e.shiftKey ? 1 : 15;
      if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); rotate(step); return; }
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); rotate(-step); return; }
      if (!e.key.startsWith('Arrow')) return;
      const b = map.getBounds();
      const f = e.shiftKey ? 0.002 : 0.01;
      const dx = (b.getEast() - b.getWest()) * f;
      const dy = (b.getNorth() - b.getSouth()) * f;
      e.preventDefault();
      if (e.key === 'ArrowLeft') nudge(-dx, 0);
      if (e.key === 'ArrowRight') nudge(dx, 0);
      if (e.key === 'ArrowUp') nudge(0, dy);
      if (e.key === 'ArrowDown') nudge(0, -dy);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotate, map]);

  const beginDrag = (ev: MouseEvent | PointerEvent | TouchEvent) => {
    ev.preventDefault?.();
    ev.stopPropagation?.();
    const pt = 'touches' in ev ? ev.touches[0] : (ev as MouseEvent);
    if (!pt) return;
    const start = map.mouseEventToLatLng(pt as any);
    const base = geomRef.current;
    let moved = false;
    map.dragging.disable();
    const container = map.getContainer();
    container.style.cursor = 'grabbing';
    const onMove = (e: MouseEvent | TouchEvent) => {
      const p = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      if (!p) return;
      const ll = map.mouseEventToLatLng(p as any);
      moved = true;
      setGeom(mapRings(base, (r) => translateRing(r, ll.lng - start.lng, ll.lat - start.lat)));
    };
    const end = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', end);
      map.dragging.enable();
      container.style.cursor = '';
      if (moved) {
        historyRef.current = [...historyRef.current.slice(-24), { geom: base, angle }];
        force();
        onCommit(geomRef.current);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', end);
  };

  // Position de la barre au-dessus de l'emplacement
  const [barPos, setBarPos] = React.useState<{ x: number; y: number } | null>(null);
  React.useEffect(() => {
    const update = () => {
      const pts = allPts(geom);
      if (!pts.length) return setBarPos(null);
      let maxLat = -90, sum = 0;
      pts.forEach(([lng, lat]) => { if (lat > maxLat) maxLat = lat; sum += lng; });
      const p = map.latLngToContainerPoint([maxLat, sum / pts.length]);
      setBarPos({ x: p.x, y: p.y });
    };
    update();
    map.on('move zoom', update);
    return () => { map.off('move zoom', update); };
  }, [geom, map]);

  const rings = leafletRings(geom);
  const btn =
    'inline-flex h-9 w-9 items-center justify-center rounded-full text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10 disabled:opacity-35';
  const fmt = (a: number) => `${a > 0 ? '+' : ''}${Math.round(a)}°`;

  return (
    <>
      {rings.map((ring, i) => (
        <React.Fragment key={i}>
          <Polygon
            positions={ring as any}
            pane="atelier-emplacements"
            interactive={false}
            pathOptions={{ color: 'hsl(var(--ds-cream))', weight: 7, opacity: 0.9, fillOpacity: 0 }}
          />
          <Polygon
            positions={ring as any}
            pane="atelier-emplacements"
            pathOptions={{ color, weight: 4, opacity: 1, fillColor: color, fillOpacity, className: 'cursor-grab' }}
            eventHandlers={{
              mousedown: (e: any) => beginDrag(e.originalEvent),
              touchstart: (e: any) => beginDrag(e.originalEvent),
              click: (e: any) => e.originalEvent?.stopPropagation?.(),
            }}
          >
            <Tooltip sticky>
              <span style={{ fontSize: 11 }}>{zone.nom} · glisser pour déplacer</span>
            </Tooltip>
          </Polygon>
        </React.Fragment>
      ))}
      {barPos && (
        <div
          className="pointer-events-none absolute left-0 top-0 z-[1000]"
          style={{ transform: `translate(${barPos.x}px, ${barPos.y - 14}px) translate(-50%, -100%)` }}
        >
          <div
            className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-1 py-0.5 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="hidden px-1.5 text-[hsl(var(--ds-forest-deep))]/70 sm:inline" title="Glisser l'emplacement pour le déplacer">
              <Move className="h-3.5 w-3.5" />
            </span>
            <button className={btn} title="Pivoter sens trigonométrique (Q · Maj = 1°)" aria-label="Pivoter dans le sens trigonométrique" onClick={(e) => rotate(e.shiftKey ? 1 : 15)}>
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="min-w-[2.6rem] text-center text-[11px] font-medium tabular-nums text-[hsl(var(--ds-forest-deep))]">
              {fmt(angle)}
            </span>
            <button className={btn} title="Pivoter sens horaire (E · Maj = 1°)" aria-label="Pivoter dans le sens horaire" onClick={(e) => rotate(e.shiftKey ? -1 : -15)}>
              <RotateCw className="h-4 w-4" />
            </button>
            <button className={btn} title="Annuler le dernier geste" aria-label="Annuler le dernier geste" disabled={!historyRef.current.length} onClick={undo}>
              <Undo2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ZoneQuickEditLayer;
