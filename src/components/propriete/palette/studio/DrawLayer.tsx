import React from 'react';
import { Circle, CircleMarker, Polygon, Polyline, useMap, useMapEvents } from 'react-leaflet';
import type { ToolGeom } from '@/lib/paysageTools';

interface DrawLayerProps {
  /** null = pas de dessin en cours */
  geom: ToolGeom | null;
  color: string;
  /** freehand : tracé au doigt (polygone d'emplacement), sinon clic à clic */
  freehand?: boolean;
  onFinish: (geometry: any) => void;
}

/**
 * Couche de dessin unifiée de l'atelier.
 *  - point     : un clic
 *  - line      : clics successifs, double-clic / Entrée pour terminer
 *  - polygon   : idem, refermé automatiquement
 *  - freehand  : pointer maintenu (utilisé pour les emplacements)
 */
export const DrawLayer: React.FC<DrawLayerProps> = ({ geom, color, freehand, onFinish }) => {
  const map = useMap();
  const [pts, setPts] = React.useState<Array<[number, number]>>([]);
  const [hover, setHover] = React.useState<[number, number] | null>(null);
  const drawingRef = React.useRef(false);
  const bufRef = React.useRef<Array<[number, number]>>([]);

  const finishRef = React.useRef(onFinish);
  finishRef.current = onFinish;

  /* Reset quand on change d'outil */
  React.useEffect(() => {
    setPts([]);
    setHover(null);
    bufRef.current = [];
  }, [geom, freehand]);

  /* Mode freehand : pointer events sur le conteneur */
  React.useEffect(() => {
    if (!geom || !freehand) return;
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
      bufRef.current = [toLatLng(e)];
      setPts(bufRef.current.slice());
      container.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const next = toLatLng(e);
      const last = bufRef.current[bufRef.current.length - 1];
      if (last) {
        const a = map.latLngToContainerPoint(last as any);
        const b = map.latLngToContainerPoint(next as any);
        if (Math.hypot(a.x - b.x, a.y - b.y) < 4) return;
      }
      bufRef.current = [...bufRef.current, next];
      setPts(bufRef.current.slice());
    };
    const onUp = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      container.releasePointerCapture?.(e.pointerId);
      const buf = bufRef.current;
      bufRef.current = [];
      setPts([]);
      if (buf.length >= 3) {
        const ring = buf.map(([lat, lng]) => [lng, lat]);
        ring.push(ring[0]);
        finishRef.current({ type: 'Polygon', coordinates: [ring] });
      }
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
  }, [geom, freehand, map]);

  /* Mode clic à clic */
  const clickMode = !!geom && !freehand;

  const commit = React.useCallback(
    (list: Array<[number, number]>) => {
      if (!geom) return;
      if (geom === 'line' && list.length >= 2) {
        finishRef.current({
          type: 'LineString',
          coordinates: list.map(([lat, lng]) => [lng, lat]),
        });
      } else if (geom === 'polygon' && list.length >= 3) {
        const ring = list.map(([lat, lng]) => [lng, lat]);
        ring.push(ring[0]);
        finishRef.current({ type: 'Polygon', coordinates: [ring] });
      }
      setPts([]);
      setHover(null);
    },
    [geom],
  );

  useMapEvents({
    click(e) {
      if (!clickMode) return;
      const p: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (geom === 'point') {
        finishRef.current({ type: 'Point', coordinates: [p[1], p[0]] });
        return;
      }
      setPts((prev) => [...prev, p]);
    },
    dblclick() {
      if (!clickMode || geom === 'point') return;
      setPts((prev) => {
        commit(prev);
        return prev;
      });
    },
    mousemove(e) {
      if (!clickMode || geom === 'point') return;
      setHover([e.latlng.lat, e.latlng.lng]);
    },
  });

  React.useEffect(() => {
    if (!clickMode || geom === 'point') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') commit(bufRef.current.length ? bufRef.current : ptsRef.current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clickMode, geom, commit]);

  const ptsRef = React.useRef(pts);
  ptsRef.current = pts;

  React.useEffect(() => {
    if (!clickMode) return;
    const c = map.getContainer();
    c.style.cursor = 'crosshair';
    map.doubleClickZoom.disable();
    return () => {
      c.style.cursor = '';
      map.doubleClickZoom.enable();
    };
  }, [clickMode, map]);

  if (!geom || pts.length === 0) return null;

  const preview = hover && !freehand ? [...pts, hover] : pts;

  return (
    <>
      {geom === 'polygon' && preview.length >= 3 ? (
        <Polygon
          positions={preview as any}
          pathOptions={{ color, weight: 2.5, dashArray: '6 6', fillColor: color, fillOpacity: 0.15 }}
        />
      ) : (
        <Polyline
          positions={preview as any}
          pathOptions={{ color, weight: 3, dashArray: '6 6', opacity: 0.95 }}
        />
      )}
      {pts.map((p, i) => (
        <CircleMarker
          key={i}
          center={p as any}
          radius={4}
          pathOptions={{ color, fillColor: '#fff', fillOpacity: 1, weight: 2 }}
        />
      ))}
    </>
  );
};

export default DrawLayer;
