import React from 'react';
import { CircleMarker, Polygon, Polyline, useMap } from 'react-leaflet';
import {
  closeRing,
  openRing,
  ringBounds,
  rotateRing,
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
  /** Début de geste : empiler l'état courant pour l'annulation. */
  onGestureStart: () => void;
  /** Aperçu temps réel pendant le geste. */
  onPreview: (ring: Ring) => void;
}

/**
 * Couche d'édition géométrique d'un emplacement :
 *  · glisser l'intérieur = déplacer
 *  · glisser un coin      = homothétie (Maj/coin : proportionnelle)
 *  · glisser un milieu    = étirement sur un axe (Maj = proportionnel)
 */
export const ZoneTransformLayer: React.FC<Props> = ({ ring, color, onGestureStart, onPreview }) => {
  const map = useMap();
  const stateRef = React.useRef<{ start: Ring; mode: 'move' | 'rotate' | HandleId } | null>(null);
  const liveRef = React.useRef<Ring>(ring);
  liveRef.current = ring;

  const positions = React.useMemo(
    () => openRing(ring).map(([lng, lat]) => [lat, lng] as [number, number]),
    [ring],
  );
  const b = React.useMemo(() => ringBounds(openRing(ring)), [ring]);

  const beginGesture = React.useCallback(
    (mode: 'move' | 'rotate' | HandleId, ev: MouseEvent | PointerEvent) => {
      if (stateRef.current) return;
      const start = openRing(liveRef.current);
      stateRef.current = { start, mode };
      onGestureStart();
      map.dragging.disable();
      const startLatLng = map.mouseEventToLatLng(ev);
      const bounds = ringBounds(start)!;
      const center: [number, number] = [
        (bounds.minLng + bounds.maxLng) / 2,
        (bounds.minLat + bounds.maxLat) / 2,
      ];
      const anchor = mode === 'move' || mode === 'rotate' ? null : anchorFor(bounds, mode);
      const grab = mode === 'move' || mode === 'rotate' ? null : handlePos(bounds, mode);
      const kxLat = Math.cos((center[1] * Math.PI) / 180) || 1;
      const startAngle = Math.atan2(
        startLatLng.lat - center[1],
        (startLatLng.lng - center[0]) * kxLat,
      );

      const onMove = (e: MouseEvent | PointerEvent) => {
        const ll = map.mouseEventToLatLng(e);
        if (mode === 'move') {
          onPreview(closeRing(translateRing(start, ll.lng - startLatLng.lng, ll.lat - startLatLng.lat)));
          return;
        }
        if (mode === 'rotate') {
          const angle = Math.atan2(ll.lat - center[1], (ll.lng - center[0]) * kxLat);
          let delta = angle - startAngle;
          if (e.shiftKey) delta = Math.round(delta / (Math.PI / 12)) * (Math.PI / 12);
          onPreview(closeRing(rotateRing(start, center, -delta)));
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
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        map.dragging.enable();
        stateRef.current = null;
      };

      // Pointer Events : souris, doigt et stylet suivent le même geste.
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
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

  /**
   * Toucher : Leaflet ne relaie pas le doigt aux formes vectorielles. On
   * écoute directement le tracé SVG (souris laissée au relais Leaflet).
   */
  const beginRef = React.useRef(beginGesture);
  beginRef.current = beginGesture;
  const touchHandlers = React.useCallback(
    (mode: 'move' | 'rotate' | HandleId) => ({
      add: (e: any) => {
        const el: HTMLElement | SVGElement | undefined = e.target?.getElement?.();
        if (!el || (el as any).__touchBound) return;
        (el as any).__touchBound = true;
        (el as HTMLElement).style.touchAction = 'none';
        el.addEventListener('pointerdown', (ev: Event) => {
          const pe = ev as PointerEvent;
          if (pe.pointerType === 'mouse') return;
          pe.preventDefault();
          pe.stopPropagation();
          beginRef.current(mode, pe);
        });
      },
    }),
    [],
  );

  if (positions.length < 3 || !b) return null;

  const boxRect: Array<[number, number]> = [
    [b.maxLat, b.minLng],
    [b.maxLat, b.maxLng],
    [b.minLat, b.maxLng],
    [b.minLat, b.minLng],
    [b.maxLat, b.minLng],
  ];
  const latSpan = Math.max(b.maxLat - b.minLat, 1e-6);
  const rotatePos: [number, number] = [b.maxLat + latSpan * 0.18, (b.minLng + b.maxLng) / 2];

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
      <Polyline
        positions={[[b.maxLat, (b.minLng + b.maxLng) / 2], rotatePos] as any}
        pathOptions={{ color, weight: 1.2, opacity: 0.6, dashArray: '3 4' }}
        interactive={false}
      />
      <CircleMarker
        center={rotatePos as any}
        radius={7}
        pathOptions={{ color: 'hsl(var(--ds-gold))', weight: 3, fillColor: 'hsl(var(--ds-cream))', fillOpacity: 1 }}
        eventHandlers={{
          mousedown: (e: any) => {
            e.originalEvent?.preventDefault?.();
            e.originalEvent?.stopPropagation?.();
            beginGesture('rotate', e.originalEvent as MouseEvent);
          },
          mouseover: (e: any) => {
            const el = e.target?.getElement?.();
            if (el) el.style.cursor = 'grab';
          },
        }}
      />
    </>
  );
};

export default ZoneTransformLayer;
