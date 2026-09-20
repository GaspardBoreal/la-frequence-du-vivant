import React from 'react';
import { Circle, CircleMarker, Polygon, Polyline, useMap, useMapEvents } from 'react-leaflet';
import type { ToolGeom } from '@/lib/paysageTools';

export type ZoneDrawMode = 'freehand' | 'polygon' | 'rectangle' | 'orthogonal' | 'hexagon';

export interface DrawLayerHandle {
  undo: () => void;
  reset: () => void;
  finish: () => void;
}

export interface DrawDraftState {
  pointCount: number;
  canUndo: boolean;
  canFinish: boolean;
  lengthM: number | null;
  angleDeg: number | null;
}

interface DrawLayerProps {
  /** null = pas de dessin en cours */
  geom: ToolGeom | null;
  color: string;
  /** freehand : tracé au doigt (polygone d'emplacement), sinon clic à clic */
  freehand?: boolean;
  zoneMode?: ZoneDrawMode;
  onDraftChange?: (state: DrawDraftState) => void;
  onFinish: (geometry: any) => void;
}

/**
 * Couche de dessin unifiée de l'atelier.
 *  - point     : un clic
 *  - line      : clics successifs, double-clic / Entrée pour terminer
 *  - polygon   : idem, refermé automatiquement
 *  - freehand  : pointer maintenu (utilisé pour les emplacements)
 */
const close = (ring: Array<[number, number]>) => {
  if (ring.length === 0) return ring;
  return [...ring, ring[0]];
};

const polygonGeometry = (points: Array<[number, number]>) => ({
  type: 'Polygon',
  coordinates: [close(points).map(([lat, lng]) => [lng, lat])],
});

export const DrawLayer = React.forwardRef<DrawLayerHandle, DrawLayerProps>(function DrawLayer(
  { geom, color, freehand, zoneMode, onDraftChange, onFinish },
  ref,
) {
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
  }, [geom, freehand, zoneMode]);

  const pointDistanceM = React.useCallback(
    (a: [number, number], b: [number, number]) => map.distance(a as any, b as any),
    [map],
  );

  const rectangleRing = React.useCallback(
    (list: Array<[number, number]>) => {
      if (list.length < 3) return [];
      const a = map.latLngToContainerPoint(list[0] as any);
      const b = map.latLngToContainerPoint(list[1] as any);
      const c = map.latLngToContainerPoint(list[2] as any);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const norm = Math.hypot(dx, dy);
      if (norm < 2) return [];
      const nx = -dy / norm;
      const ny = dx / norm;
      const width = (c.x - b.x) * nx + (c.y - b.y) * ny;
      const d = { x: a.x + nx * width, y: a.y + ny * width };
      const e = { x: b.x + nx * width, y: b.y + ny * width };
      return [a, b, e, d].map((p) => {
        const ll = map.containerPointToLatLng(p as any);
        return [ll.lat, ll.lng] as [number, number];
      });
    },
    [map],
  );

  const hexagonRing = React.useCallback(
    (list: Array<[number, number]>) => {
      if (list.length < 2) return [];
      const center = map.latLngToContainerPoint(list[0] as any);
      const edge = map.latLngToContainerPoint(list[1] as any);
      const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
      if (radius < 2) return [];
      const start = Math.atan2(edge.y - center.y, edge.x - center.x);
      return Array.from({ length: 6 }, (_, index) => {
        const angle = start + (index * Math.PI) / 3;
        const ll = map.containerPointToLatLng({
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        } as any);
        return [ll.lat, ll.lng] as [number, number];
      });
    },
    [map],
  );

  const snapOrthogonal = React.useCallback(
    (list: Array<[number, number]>, candidate: [number, number]) => {
      if (list.length < 2) return candidate;
      const previous = map.latLngToContainerPoint(list[list.length - 2] as any);
      const last = map.latLngToContainerPoint(list[list.length - 1] as any);
      const target = map.latLngToContainerPoint(candidate as any);
      const dx = last.x - previous.x;
      const dy = last.y - previous.y;
      const norm = Math.hypot(dx, dy);
      if (norm < 2) return candidate;
      const vx = -dy / norm;
      const vy = dx / norm;
      const tx = target.x - last.x;
      const ty = target.y - last.y;
      const alongV = tx * vx + ty * vy;
      const snapped = {
        x: last.x + vx * alongV,
        y: last.y + vy * alongV,
      };
      const ll = map.containerPointToLatLng(snapped as any);
      return [ll.lat, ll.lng] as [number, number];
    },
    [map],
  );

  const preparedPoints = React.useCallback(
    (list: Array<[number, number]>) => {
      if (zoneMode === 'rectangle') return rectangleRing(list);
      if (zoneMode === 'hexagon') return hexagonRing(list);
      return list;
    },
    [hexagonRing, rectangleRing, zoneMode],
  );

  /* Mode freehand : pointer events sur le conteneur */
  React.useEffect(() => {
    if (!geom || zoneMode !== 'freehand') return;
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
       if (buf.length >= 3) setPts(buf);
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
  }, [geom, map, zoneMode]);

  /* Mode clic à clic */
  const clickMode = !!geom && zoneMode !== 'freehand';

  const commit = React.useCallback(
    (list: Array<[number, number]>) => {
      if (!geom) return;
      if (zoneMode) {
        const prepared = preparedPoints(list);
        if (prepared.length >= 3) finishRef.current(polygonGeometry(prepared));
      } else if (geom === 'line' && list.length >= 2) {
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
    [geom, preparedPoints, zoneMode],
  );

  React.useImperativeHandle(ref, () => ({
    undo: () => setPts((current) => current.slice(0, -1)),
    reset: () => {
      setPts([]);
      setHover(null);
      bufRef.current = [];
    },
    finish: () => commit(ptsRef.current),
  }), [commit]);

  useMapEvents({
    click(e) {
      if (!clickMode) return;
       let p: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (geom === 'point') {
        finishRef.current({ type: 'Point', coordinates: [p[1], p[0]] });
        return;
      }
       setPts((prev) => {
         if (zoneMode === 'orthogonal') p = snapOrthogonal(prev, p);
         if ((zoneMode === 'hexagon' && prev.length >= 2) || (zoneMode === 'rectangle' && prev.length >= 3)) return prev;
         return [...prev, p];
       });
    },
    dblclick() {
       if (!clickMode || geom === 'point' || zoneMode) return;
      setPts((prev) => {
        commit(prev);
        return prev;
      });
    },
    mousemove(e) {
      if (!clickMode || geom === 'point') return;
       const candidate: [number, number] = [e.latlng.lat, e.latlng.lng];
       setHover(zoneMode === 'orthogonal' ? snapOrthogonal(ptsRef.current, candidate) : candidate);
    },
  });

  React.useEffect(() => {
    if (!clickMode || geom === 'point') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') commit(bufRef.current.length ? bufRef.current : ptsRef.current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clickMode, geom, commit, zoneMode]);

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

  const draftList = hover && !freehand ? [...pts, hover] : pts;
  const preview = preparedPoints(draftList);
  const fixedPreview = preparedPoints(pts);
  const canFinish = zoneMode === 'rectangle'
    ? fixedPreview.length === 4
    : zoneMode === 'hexagon'
      ? fixedPreview.length === 6
      : pts.length >= 3;
  const lastSegment = preview.length >= 2
    ? pointDistanceM(preview[preview.length - 2], preview[preview.length - 1])
    : null;

  React.useEffect(() => {
    onDraftChange?.({
      pointCount: pts.length,
      canUndo: pts.length > 0,
      canFinish,
      lengthM: lastSegment,
      angleDeg: zoneMode === 'orthogonal' && pts.length >= 2 ? 90 : null,
    });
  }, [canFinish, lastSegment, onDraftChange, pts.length, zoneMode]);

  if (!geom || pts.length === 0) return null;

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
       {preview.map((p, i) => (
        <CircleMarker
          key={i}
          center={p as any}
          radius={4}
          pathOptions={{ color, fillColor: '#fff', fillOpacity: 1, weight: 2 }}
        />
      ))}
    </>
  );
});

DrawLayer.displayName = 'DrawLayer';

export default DrawLayer;
