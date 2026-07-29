import React from 'react';
import { GeoJSON, Polygon, Polyline, Tooltip, useMap } from 'react-leaflet';
import {
  Pencil,
  Trash2,
  Check,
  X,
  Maximize2,
  Minimize2,
  MapPin,
  Undo2,
  Wand2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import RichMap from '@/components/maps/RichMap';
import { ZONE_COLORS, type ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
import PaletteStudio from './studio/PaletteStudio';
import ZoneChipMenu, { ZoneChipCaret } from './ZoneChipMenu';


/* ── Couche de dessin à main levée ────────────────────────────────────────── */

const FreehandLayer: React.FC<{
  active: boolean;
  color: string;
  onFinish: (latlngs: Array<[number, number]>) => void;
}> = ({ active, color, onFinish }) => {
  const map = useMap();
  const [points, setPoints] = React.useState<Array<[number, number]>>([]);
  const drawingRef = React.useRef(false);
  const bufferRef = React.useRef<Array<[number, number]>>([]);

  React.useEffect(() => {
    if (!active) {
      setPoints([]);
      bufferRef.current = [];
      return;
    }
    const container = map.getContainer();
    container.style.cursor = 'crosshair';
    map.dragging.disable();
    map.doubleClickZoom.disable();

    const toLatLng = (e: PointerEvent): [number, number] => {
      const rect = container.getBoundingClientRect();
      const p = map.containerPointToLatLng([e.clientX - rect.left, e.clientY - rect.top] as any);
      return [p.lat, p.lng];
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drawingRef.current = true;
      bufferRef.current = [toLatLng(e)];
      setPoints(bufferRef.current.slice());
      container.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const next = toLatLng(e);
      const last = bufferRef.current[bufferRef.current.length - 1];
      if (last) {
        const a = map.latLngToContainerPoint(last as any);
        const b = map.latLngToContainerPoint(next as any);
        if (Math.hypot(a.x - b.x, a.y - b.y) < 4) return;
      }
      bufferRef.current = [...bufferRef.current, next];
      setPoints(bufferRef.current.slice());
    };
    const onUp = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      container.releasePointerCapture?.(e.pointerId);
      const pts = bufferRef.current;
      bufferRef.current = [];
      setPoints([]);
      if (pts.length >= 3) onFinish(pts);
    };

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', onUp);
    container.addEventListener('pointercancel', onUp);

    return () => {
      container.style.cursor = '';
      map.dragging.enable();
      map.doubleClickZoom.enable();
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onUp);
    };
  }, [active, map, onFinish]);

  if (!active || points.length < 2) return null;
  return (
    <Polyline
      positions={points as any}
      pathOptions={{ color, weight: 3, dashArray: '6 6', opacity: 0.95 }}
    />
  );
};

/* ── Bloc carte ───────────────────────────────────────────────────────────── */

interface Props {
  center: [number, number] | null;
  parcelles: ProprieteParcelle[];
  zones: ProprieteZone[];
  activeZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onCreateZone: (geometry: any) => void;
  onDeleteZone: (id: string) => void;
  /** Requis pour ouvrir l'Atelier (calques, ouvrages, bilan). */
  proprieteId?: string;
  onPatchZone?: (z: ProprieteZone, patch: Partial<ProprieteZone>) => void;
  maxZones?: number;
  readOnly?: boolean;
  /** Nombre d'espèces retenues par emplacement (pour la confirmation de suppression). */
  zoneSpeciesCount?: Record<string, number>;
}



const zoneLabel = (i: number) =>
  i < 26
    ? String.fromCharCode(65 + i)
    : `${String.fromCharCode(65 + Math.floor(i / 26) - 1)}${String.fromCharCode(65 + (i % 26))}`;

export const ZonesMapBlock: React.FC<Props> = ({
  center,
  parcelles,
  zones,
  activeZoneId,
  onSelectZone,
  onCreateZone,
  onDeleteZone,
  proprieteId,
  onPatchZone,
  maxZones,
  readOnly,
  zoneSpeciesCount,
}) => {


  const [drawing, setDrawing] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [studioOpen, setStudioOpen] = React.useState(false);
  const [menuZone, setMenuZone] = React.useState<{ id: string; x: number; y: number } | null>(null);


  const full = typeof maxZones === 'number' && zones.length >= maxZones;

  React.useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawing) setDrawing(false);
        else setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [fullscreen, drawing]);

  const bounds = React.useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = [];
    zones.forEach((z) => {
      const rings = z.geometry?.coordinates?.[0] ?? [];
      rings.forEach((c: [number, number]) => pts.push([c[1], c[0]]));
    });
    parcelles.forEach((p: any) => {
      const geom = p.geometry;
      const polys = geom?.type === 'MultiPolygon' ? geom.coordinates.flat() : geom?.coordinates ?? [];
      polys.forEach((ring: any) =>
        (ring || []).forEach((c: [number, number]) => pts.push([c[1], c[0]])),
      );
    });
    return pts;
  }, [zones, parcelles]);

  const handleFinish = React.useCallback(
    (latlngs: Array<[number, number]>) => {
      const ring = latlngs.map(([lat, lng]) => [lng, lat]);
      ring.push(ring[0]);
      onCreateZone({ type: 'Polygon', coordinates: [ring] });
      setDrawing(false);
    },
    [onCreateZone],
  );

  const mapNode = (height: number | string) => (
    <div
      className="relative rounded-2xl overflow-hidden border border-[hsl(var(--ds-line))]"
      style={{ height }}
    >
      <RichMap
        center={center ?? [45.0, 0.5]}
        zoom={17}
        bounds={bounds.length > 1 ? bounds : undefined}
        fitMaxZoom={18}
        fitPadding={[50, 50]}
        controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
        maxZoom={22}
        scrollWheelZoom={!drawing}
        height="100%"
      >
        {parcelles.map((p: any) => (
          <GeoJSON
            key={`parc-${p.id}`}
            data={p.geometry as any}
            style={{ color: '#2f5d3a', weight: 1.6, opacity: 0.7, fillOpacity: 0.04, dashArray: '4 4' }}
          />
        ))}

        {zones.map((z, i) => {
          const color = z.couleur || ZONE_COLORS[i % ZONE_COLORS.length];
          const active = z.id === activeZoneId;
          const ring = (z.geometry?.coordinates?.[0] ?? []).map((c: [number, number]) => [c[1], c[0]]);
          if (ring.length < 3 || z.visible === false) return null;

          return (
            <Polygon
              key={z.id}
              positions={ring as any}
              pathOptions={{
                color,
                weight: active ? 3.5 : 2,
                fillColor: color,
                fillOpacity: active ? 0.28 : 0.14,
              }}
              eventHandlers={{ click: () => onSelectZone(z.id) }}
            >
              <Tooltip sticky>
                <span style={{ fontSize: 11 }}>
                  {String.fromCharCode(65 + i)} · {z.nom}
                </span>
              </Tooltip>
            </Polygon>
          );
        })}

        <FreehandLayer
          active={drawing}
          color={ZONE_COLORS[zones.length % ZONE_COLORS.length]}
          onFinish={handleFinish}
        />
      </RichMap>

      {drawing && (
        <div className="absolute inset-x-0 top-0 z-[500] pointer-events-none flex justify-center p-3">
          <div className="pointer-events-auto rounded-full bg-[hsl(var(--ds-forest-deep))]/95 text-[hsl(var(--ds-cream))] px-4 py-2 text-xs flex items-center gap-3 shadow-lg backdrop-blur">
            <span className="font-semibold tracking-wide">
              Tracez le contour d’un doigt (ou souris maintenue) — relâchez pour fermer.
            </span>
            <button
              onClick={() => setDrawing(false)}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 hover:bg-white/25"
            >
              <X className="w-3 h-3" /> Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {!readOnly && (
        <button
          onClick={() => setDrawing((v) => !v)}
          disabled={full && !drawing}
          className={`text-[11px] px-3 py-1.5 rounded-full border transition-all inline-flex items-center gap-1.5 ${
            drawing
              ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest-deep))]'
              : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/60'
          } ${full && !drawing ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Pencil className="w-3 h-3" />
          {drawing ? 'Dessin en cours…' : full ? `${maxZones} zones maximum` : 'Dessiner une zone'}
        </button>
      )}

      {zones.map((z, i) => {
        const color = z.couleur || ZONE_COLORS[i % ZONE_COLORS.length];
        const active = z.id === activeZoneId;
        return (
          <span
            key={z.id}
            className={`text-[11px] px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              active
                ? 'text-[hsl(var(--ds-cream))] border-transparent'
                : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
            } ${z.visible === false ? 'opacity-50' : ''}`}
            style={active ? { backgroundColor: color } : undefined}
            onClick={() => onSelectZone(active ? null : z.id)}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: active ? 'rgba(255,255,255,.85)' : color }}
            />
            {zoneLabel(i)} · {z.nom}
            {!readOnly && (
              <ZoneChipCaret
                onClick={(e) => {
                  e.stopPropagation();
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  onSelectZone(z.id);
                  setMenuZone({ id: z.id, x: r.left, y: r.bottom });
                }}
              />
            )}
          </span>
        );
      })}

      {activeZoneId && !readOnly && (
        <span className="inline-flex items-center gap-1.5 pl-1.5 border-l border-[hsl(var(--ds-line))]">
          <button
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setMenuZone({ id: activeZoneId, x: r.left, y: r.bottom });
            }}
            className="text-[11px] px-2.5 py-1 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] inline-flex items-center gap-1 hover:border-[hsl(var(--ds-forest))]/60"
          >
            <Pencil className="w-3 h-3" /> Renommer
          </button>
          <button
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setMenuZone({ id: activeZoneId, x: r.left, y: r.bottom });
            }}
            className="text-[11px] px-2.5 py-1 rounded-full border border-red-300 text-red-700 inline-flex items-center gap-1 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" /> Supprimer
          </button>
          <button
            onClick={() => onSelectZone(null)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] inline-flex items-center gap-1"
          >
            <Undo2 className="w-3 h-3" /> Désélectionner
          </button>
        </span>
      )}



      <span className="ml-auto flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[hsl(var(--ds-forest))]">
          {zones.length} {zones.length > 1 ? 'emplacements' : 'emplacement'}
          {typeof maxZones === 'number' ? ` / ${maxZones}` : ''}
        </span>
        {proprieteId && (
          <button
            onClick={() => setStudioOpen(true)}
            className="text-[11px] px-3 py-1 rounded-full border border-transparent bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] inline-flex items-center gap-1.5 hover:opacity-90"
          >
            <Wand2 className="w-3 h-3" /> Ouvrir l’Atelier
          </button>
        )}
        <button
          onClick={() => setFullscreen((v) => !v)}
          className="text-[11px] px-2.5 py-1 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] inline-flex items-center gap-1 hover:border-[hsl(var(--ds-forest))]/60"
        >
          {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          {fullscreen ? 'Réduire' : 'Plein écran'}
        </button>
      </span>
    </div>
  );

  const studio = proprieteId ? (
    <PaletteStudio
      open={studioOpen}
      onClose={() => setStudioOpen(false)}
      proprieteId={proprieteId}
      center={center}
      parcelles={parcelles}
      zones={zones}
      activeZoneId={activeZoneId}
      onSelectZone={onSelectZone}
      onCreateZone={(geometry) => onCreateZone(geometry)}
      onPatchZone={(z, patch) => onPatchZone?.(z, patch)}
      onDeleteZone={onDeleteZone}
      readOnly={readOnly}
    />
  ) : null;

  const menuTarget = menuZone ? zones.find((z) => z.id === menuZone.id) : null;
  const menuIndex = menuTarget ? zones.findIndex((z) => z.id === menuTarget.id) : -1;

  const body = (
    <div className="space-y-3">
      {studio}
      {toolbar}
      {mapNode(fullscreen ? 'calc(100vh - 140px)' : 420)}
      {zones.length === 0 && (
        <p className="text-xs italic text-[hsl(var(--ds-forest-deep))]/60 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> Aucune zone tracée : la palette reste générale. Dessinez
          autant d’emplacements que nécessaire pour obtenir une palette par lieu, et non une pour toute la
          propriété.
        </p>
      )}
      {menuTarget && !readOnly && (
        <ZoneChipMenu
          zone={menuTarget}
          label={zoneLabel(menuIndex)}
          color={menuTarget.couleur || ZONE_COLORS[menuIndex % ZONE_COLORS.length]}
          speciesCount={zoneSpeciesCount?.[menuTarget.id] ?? 0}
          anchor={{ x: menuZone!.x, y: menuZone!.y }}
          onPatch={(patch) => onPatchZone?.(menuTarget, patch)}
          onDelete={() => onDeleteZone(menuTarget.id)}
          onClose={() => setMenuZone(null)}
        />
      )}
    </div>
  );


  if (!fullscreen) return body;

  return createPortal(
    <div className="fixed inset-0 z-[3000] bg-[hsl(var(--ds-cream))] p-3 md:p-5 overflow-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-serif italic text-xl text-[hsl(var(--ds-forest-deep))]">
          Emplacements de la palette
        </div>
        <button
          onClick={() => setFullscreen(false)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-xs text-[hsl(var(--ds-forest-deep))]"
        >
          <Check className="w-3.5 h-3.5" /> Terminer
        </button>
      </div>
      {body}
    </div>,
    document.body,
  );
};

export default ZonesMapBlock;
