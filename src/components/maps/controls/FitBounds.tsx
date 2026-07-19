import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface FitBoundsProps {
  /** Positions to fit. If a single point or all points coincident, zooms in instead. */
  positions: Array<[number, number]>;
  /** Padding in pixels (default [40, 40]) */
  padding?: [number, number];
  /** Override max zoom; otherwise auto-derived from bounds diagonal */
  maxZoom?: number;
  /** Animate the camera move (default true) */
  animate?: boolean;
}

/**
 * Auto-fits the map to a set of positions, robustly:
 *  - Triggers only when the CONTENT of positions changes (signature based on lat/lng rounded to 6 decimals),
 *    not when the array reference changes on re-render.
 *  - Once the user has interacted manually (zoom/drag), suspends auto-fit until the
 *    positions content actually changes again (new step added/removed/moved).
 */
export const FitBounds: React.FC<FitBoundsProps> = ({
  positions,
  padding = [40, 40],
  maxZoom,
  animate = true,
}) => {
  const map = useMap();

  // Content signature: stable across re-renders if coordinates are unchanged.
  const sig = useMemo(
    () => positions.map(([a, b]) => `${a.toFixed(6)},${b.toFixed(6)}`).join('|'),
    [positions],
  );

  const hasUserInteractedRef = useRef(false);
  const isProgrammaticRef = useRef(false);
  const lastSigRef = useRef<string | null>(null);

  // Attach interaction listeners once. Distinguish programmatic moves from user moves.
  useEffect(() => {
    const onUserMove = () => {
      if (isProgrammaticRef.current) return;
      hasUserInteractedRef.current = true;
    };
    const onMoveEnd = () => {
      // Reset the programmatic flag at the end of any move.
      isProgrammaticRef.current = false;
    };
    map.on('zoomstart', onUserMove);
    map.on('dragstart', onUserMove);
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('zoomstart', onUserMove);
      map.off('dragstart', onUserMove);
      map.off('moveend', onMoveEnd);
    };
  }, [map]);

  useEffect(() => {
    if (!sig) return; // no positions
    const sigChanged = lastSigRef.current !== sig;
    const isFirstFit = lastSigRef.current === null;

    // Skip if user has taken control AND content hasn't really changed.
    if (!isFirstFit && !sigChanged) return;
    if (!isFirstFit && hasUserInteractedRef.current && !sigChanged) return;

    lastSigRef.current = sig;
    // New content → reset user-interaction guard so a single fit can run.
    hasUserInteractedRef.current = false;

    const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])));
    const diag = bounds.getNorthWest().distanceTo(bounds.getSouthEast());

    isProgrammaticRef.current = true;

    if (positions.length === 1 || diag < 1) {
      map.setView(positions[0], maxZoom ?? 17, { animate });
      return;
    }

    let computedMax = maxZoom ?? 13;
    if (maxZoom === undefined) {
      if (diag < 150) computedMax = 20;
      else if (diag < 500) computedMax = 19;
      else if (diag < 2000) computedMax = 16;
      else if (diag < 10000) computedMax = 14;
    }

    map.fitBounds(bounds, { padding, maxZoom: computedMax, animate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, map]);

  return null;
};

export default FitBounds;
