import React from 'react';
import { CircleMarker, Polygon, Polyline, useMap } from 'react-leaflet';
import {
  closeRing,
  openRing,
  ringBounds,
  scaleRing,
  translateRing,
  type Ring,
} from '@/lib/geomTransform';

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const handlePos = (b: ReturnType<typeof ringBounds>, h: HandleId): [number, number] => {
  const { minLng, minLat, maxLng, maxLat } = b!;
  const cx = (minLng + maxLng) / 2;
  const cy = (minLat + maxLat) / 2;
  switch (h) {
    case 'nw': return [maxLat, minLng];
    case 'n': return [maxLat, cx];
    case 'ne': return [maxLat, maxLng];
    case 'e': return [cy, maxLng];
    case 'se': return [minLat, maxLng];
    case 's': return [minLat, cx];
    case 'sw': return [minLat, minLng];
    case 'w': return [cy, minLng];
  }
};

/** Ancre = point diamétralement opposé à la poignée (repère de l'homothétie). */
const anchorFor = (b: ReturnType<typeof ringBounds>, h: HandleId): [number, number] => {
  const { minLng, minLat, maxLng, maxLat } = b!;
  const cx = (minLng + maxLng) / 2;
  const cy = (minLat + maxLat) / 2;
  switch (h) {
    case 'nw': return [maxLng, minLat];
    case 'ne': return [minLng, minLat];
    case 'se': return [minLng, maxLat];
    case 'sw': return [maxLng, maxLat];
    case 'n': return [cx, minLat];
    case 's': return [cx, maxLat];
    case 'e': return [minLng, cy];
    case 'w': return [maxLng, cy];
  }
};

const CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

interface Props {
  /** Anneau GeoJSON fermé [lng, lat][] en cours d'édition. */
  ring: Ring;
  color: string;
  /** Aperçu temps réel pendant le geste. */
  onPreview: (ring: Ring) => void;
  /** Fin de geste : à pousser dans l'historique. */
  onCommit: (ring: Ring) => void;
}

/**
 * Couche d'édition géométrique d'un emplacement :
 *  · glisser l'intérieur = déplacer
 *  · glisser un coin      = homothétie (Maj/coin : proportionnelle)
 *  · glisser un milieu    = étirement sur un axe (Maj = proportionnel)
 */
export const ZoneTransformLayer: React.FC<Props> = ({ ring, color, onPreview, onCommit }) => {
  const map = useMap();
  const stateRef = React.useRef<{ start: Ring; mode: 'move' | HandleId } | null>(null);
  const liveRef = React.useRef<Ring>(ring);
  liveRef.current = ring;

  const positions = React.useMemo(
    () => openRing(ring).map(([lng, lat]) => [lat, lng] as [number, number]),
    [ring],
  );
  const b = React.useMemo(() => ringBounds(openRing(ring)), [ring]);

  const beginGesture = React.useCallback(
    (mode: 'move' | HandleId, ev: MouseEvent) => {
      const start = openRing(liveRef.current);
      stateRef.current = { start, mode };
      map.dragging.disable();
      const startLatLng = map.mouseEventToLatLng(ev);
      const bounds = ringBounds(start)!;
      const anchor = mode === 'move' ? null : anchorFor(bounds, mode);
      const grab = mode === 'move' ? null : handlePos(bounds, mode);

      const onMove = (e: MouseEvent) => {
        const ll = map.mouseEventToLatLng(e);
        if (mode === 'move') {
          onPreview(closeRing(translateRing(start, ll.lng - startLatLng.lng, ll.lat - startLatLng.lat)));
          return;
        }
        const gLat = grab![0];
        const gLng = grab![1];
        const dx0 = gLng - anchor![0];
        const dy0 = gLat - anchor![1];
        let kx = Math.abs(dx0) > 1e-12 ? (ll.lng - anchor![0]) / dx0 : 1;
        let ky = Math.abs(dy0) > 1e-12 ? (ll.lat - anchor![1]) / dy0 : 1;
        const corner = mode.length === 2;
        if (corner || e.shiftKey) {
          const k = corner ? Math.max(Math.abs(kx), Math.abs(ky)) : Math.abs(Math.abs(dx0) > 1e-12 ? kx : ky);
          kx = Math.sign(kx || 1) * k;
          ky = Math.sign(ky || 1) * k;
        }
        const clamp = (v: number) => (Math.abs(v) < 0.05 ? Math.sign(v || 1) * 0.05 : v);
        onPreview(closeRing(scaleRing(start, anchor!, clamp(kx), clamp(ky))));
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        map.dragging.enable();
        stateRef.current = null;
        onCommit(liveRef.current);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [map, onPreview, onCommit],
  );

  React.useEffect(() => {
    return () => {
      try {
        map.dragging.enable();
      } catch {
        /* carte démontée */
      }
    };
  }, [map]);

  if (positions.length < 3 || !b) return null;

  const boxRect: Array<[number, number]> = [
    [b.maxLat, b.minLng],
    [b.maxLat, b.maxLng],
    [b.minLat, b.maxLng],
    [b.minLat, b.minLng],
    [b.maxLat, b.minLng],
  ];

  return (
    <>
      {/* Boîte englobante */}
      <Polyline
        positions={boxRect as any}
        pathOptions={{ color, weight: 1, opacity: 0.55, dashArray: '4 5' }}
        interactive={false}
      />

      {/* Forme en cours d'édition (glisser = déplacer) */}
      <Polygon
        positions={positions as any}
        pathOptions={{
          color,
          weight: 3,
          fillColor: color,
          fillOpacity: 0.34,
          className: 'cursor-move',
        }}
        eventHandlers={{
          mousedown: (e: any) => {
            e.originalEvent?.preventDefault?.();
            e.originalEvent?.stopPropagation?.();
            beginGesture('move', e.originalEvent as MouseEvent);
          },
        }}
      />

      {/* Sommets fantômes */}
      {positions.length <= 40 &&
        positions.map((p, i) => (
          <CircleMarker
            key={`v-${i}`}
            center={p as any}
            radius={2.5}
            interactive={false}
            pathOptions={{ color, weight: 1, fillColor: '#fff', fillOpacity: 0.9 }}
          />
        ))}

      {/* Poignées d'échelle */}
      {HANDLES.map((h) => (
        <CircleMarker
          key={h}
          center={handlePos(b, h) as any}
          radius={6}
          pathOptions={{
            color,
            weight: 2.5,
            fillColor: '#FAF8F3',
            fillOpacity: 1,
            className: `zone-handle-${h}`,
          }}
          eventHandlers={{
            mousedown: (e: any) => {
              e.originalEvent?.preventDefault?.();
              e.originalEvent?.stopPropagation?.();
              beginGesture(h, e.originalEvent as MouseEvent);
            },
            mouseover: (e: any) => {
              const el = e.target?.getElement?.();
              if (el) el.style.cursor = CURSORS[h];
            },
          }}
        />
      ))}
    </>
  );
};

export default ZoneTransformLayer;
