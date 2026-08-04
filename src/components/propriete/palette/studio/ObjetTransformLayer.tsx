import React from 'react';
import { CircleMarker, Polygon, Polyline, useMap } from 'react-leaflet';
import {
  ringBounds,
  rotateRing,
  scaleRing,
  translateRing,
  type Ring,
} from '@/lib/geomTransform';
import ObjetDimensionsLayer from './ObjetDimensionsLayer';

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

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

/** Position [lat, lng] d'une poignée sur la boîte englobante. */
const handlePos = (b: NonNullable<ReturnType<typeof ringBounds>>, h: HandleId): [number, number] => {
  const { minLng, minLat, maxLng, maxLat } = b;
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

/** Ancre = point diamétralement opposé (repère de l'homothétie), en [lng, lat]. */
const anchorFor = (b: NonNullable<ReturnType<typeof ringBounds>>, h: HandleId): [number, number] => {
  const { minLng, minLat, maxLng, maxLat } = b;
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

interface Props {
  /** Sommets courants [lng, lat][] (1 seul pour un objet ponctuel). */
  coords: Ring;
  kind: 'Point' | 'LineString' | 'Polygon' | null;
  color: string;
  /** Début de geste : empiler l'état courant pour l'annulation. */
  onGestureStart: () => void;
  /** Aperçu temps réel. */
  onPreview: (coords: Ring) => void;
  /** Affiche le calque de cotes (« le mètre du jardinier »). */
  showDims?: boolean;
}

/**
 * Couche d'édition géométrique d'un ouvrage de l'Atelier :
 *  · glisser la forme    = déplacer
 *  · poignée de coin     = homothétie · poignée de milieu = étirement d'un axe
 *  · poignée circulaire  = rotation (Maj = aimantation tous les 15°)
 */
export const ObjetTransformLayer: React.FC<Props> = ({
  coords,
  kind,
  color,
  onGestureStart,
  onPreview,
  showDims = false,
}) => {
  const [hoveredSeg, setHoveredSeg] = React.useState<number | null>(null);
  const map = useMap();
  const liveRef = React.useRef<Ring>(coords);
  liveRef.current = coords;

  const positions = React.useMemo(
    () => coords.map(([lng, lat]) => [lat, lng] as [number, number]),
    [coords],
  );
  const b = React.useMemo(() => ringBounds(coords), [coords]);

  const beginGesture = React.useCallback(
    (mode: 'move' | 'rotate' | HandleId, ev: MouseEvent) => {
      const start = liveRef.current.slice();
      onGestureStart();
      map.dragging.disable();
      const startLatLng = map.mouseEventToLatLng(ev);
      const bounds = ringBounds(start);

      const center: [number, number] | null = bounds
        ? [(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2]
        : null;
      const anchor = mode === 'move' || mode === 'rotate' || !bounds ? null : anchorFor(bounds, mode);
      const grab = mode === 'move' || mode === 'rotate' || !bounds ? null : handlePos(bounds, mode);
      const kxLat = center ? Math.cos((center[1] * Math.PI) / 180) || 1 : 1;
      const startAngle =
        center && mode === 'rotate'
          ? Math.atan2(startLatLng.lat - center[1], (startLatLng.lng - center[0]) * kxLat)
          : 0;

      const onMove = (e: MouseEvent) => {
        const ll = map.mouseEventToLatLng(e);

        if (mode === 'move') {
          onPreview(translateRing(start, ll.lng - startLatLng.lng, ll.lat - startLatLng.lat));
          return;
        }

        if (mode === 'rotate') {
          if (!center) return;
          const a = Math.atan2(ll.lat - center[1], (ll.lng - center[0]) * kxLat);
          let delta = a - startAngle;
          if (e.shiftKey) {
            const step = Math.PI / 12; // 15°
            delta = Math.round(delta / step) * step;
          }
          onPreview(rotateRing(start, center, -delta));
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
          const k = corner
            ? Math.max(Math.abs(kx), Math.abs(ky))
            : Math.abs(Math.abs(dx0) > 1e-12 ? kx : ky);
          kx = Math.sign(kx || 1) * k;
          ky = Math.sign(ky || 1) * k;
        }
        const clamp = (v: number) => (Math.abs(v) < 0.05 ? Math.sign(v || 1) * 0.05 : v);
        onPreview(scaleRing(start, anchor!, clamp(kx), clamp(ky)));
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        map.dragging.enable();
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [map, onPreview, onGestureStart],
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

  const grab = (mode: 'move' | 'rotate' | HandleId) => ({
    mousedown: (e: any) => {
      e.originalEvent?.preventDefault?.();
      e.originalEvent?.stopPropagation?.();
      beginGesture(mode, e.originalEvent as MouseEvent);
    },
  });

  if (!positions.length) return null;

  /* ── Objet ponctuel : halo de saisie déplaçable ─────────────────────────── */
  if (kind === 'Point') {
    const p = positions[0];
    return (
      <>
        <CircleMarker
          center={p as any}
          radius={22}
          pathOptions={{ color, weight: 1.5, opacity: 0.5, fillColor: color, fillOpacity: 0.12, dashArray: '4 5', className: 'cursor-move' }}
          eventHandlers={grab('move')}
        />
        <CircleMarker
          center={p as any}
          radius={7}
          pathOptions={{ color, weight: 3, fillColor: '#FAF8F3', fillOpacity: 1, className: 'cursor-move' }}
          eventHandlers={grab('move')}
        />
      </>
    );
  }

  if (!b) return null;

  const boxRect: Array<[number, number]> = [
    [b.maxLat, b.minLng],
    [b.maxLat, b.maxLng],
    [b.minLat, b.maxLng],
    [b.minLat, b.minLng],
    [b.maxLat, b.minLng],
  ];

  const latSpan = Math.max(b.maxLat - b.minLat, 1e-6);
  const rotatePos: [number, number] = [b.maxLat + latSpan * 0.18, (b.minLng + b.maxLng) / 2];
  const rotateStem: Array<[number, number]> = [[b.maxLat, (b.minLng + b.maxLng) / 2], rotatePos];

  return (
    <>
      {/* Boîte englobante */}
      <Polyline
        positions={boxRect as any}
        pathOptions={{ color, weight: 1, opacity: 0.55, dashArray: '4 5' }}
        interactive={false}
      />

      {showDims && (
        <ObjetDimensionsLayer
          coords={coords}
          kind={kind}
          color={color}
          hoveredIndex={hoveredSeg}
        />
      )}

      {/* Segments sensibles : survol = cote mise en avant */}
      {showDims &&
        positions.slice(0, -1).map((p, i) => (
          <Polyline
            key={`hit-${i}`}
            positions={[p, positions[i + 1]] as any}
            pathOptions={{ color, weight: 12, opacity: 0 }}
            eventHandlers={{
              mouseover: () => setHoveredSeg(i),
              mouseout: () => setHoveredSeg((v) => (v === i ? null : v)),
              ...grab('move'),
            }}
          />
        ))}

      {/* Forme en cours d'édition (glisser = déplacer) */}
      {kind === 'Polygon' ? (
        <Polygon
          positions={positions as any}
          pathOptions={{
            color,
            weight: 3,
            fillColor: color,
            fillOpacity: 0.34,
            className: 'cursor-move',
          }}
          eventHandlers={grab('move')}
        />
      ) : (
        <Polyline
          positions={positions as any}
          pathOptions={{ color, weight: 6, opacity: 0.95, lineCap: 'round', className: 'cursor-move' }}
          eventHandlers={grab('move')}
        />
      )}

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
          pathOptions={{ color, weight: 2.5, fillColor: '#FAF8F3', fillOpacity: 1 }}
          eventHandlers={{
            ...grab(h),
            mouseover: (e: any) => {
              const el = e.target?.getElement?.();
              if (el) el.style.cursor = CURSORS[h];
            },
          }}
        />
      ))}

      {/* Poignée de rotation */}
      <Polyline
        positions={rotateStem as any}
        pathOptions={{ color, weight: 1.2, opacity: 0.6, dashArray: '3 4' }}
        interactive={false}
      />
      <CircleMarker
        center={rotatePos as any}
        radius={7}
        pathOptions={{ color: '#C9A227', weight: 3, fillColor: '#FAF8F3', fillOpacity: 1 }}
        eventHandlers={{
          ...grab('rotate'),
          mouseover: (e: any) => {
            const el = e.target?.getElement?.();
            if (el) el.style.cursor = 'grab';
          },
        }}
      />
    </>
  );
};

export default ObjetTransformLayer;
