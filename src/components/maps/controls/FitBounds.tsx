import { useEffect } from 'react';
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
 * Auto-fits the map to a set of positions with intelligent maxZoom selection
 * based on the diagonal distance of the bounds. Shared by RichMap and the
 * exploration map.
 */
export const FitBounds: React.FC<FitBoundsProps> = ({
  positions,
  padding = [40, 40],
  maxZoom,
  animate = true,
}) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])));
    const diag = bounds.getNorthWest().distanceTo(bounds.getSouthEast());

    // Single point or coincident points → zoom in directly
    if (positions.length === 1 || diag < 1) {
      map.setView(positions[0], maxZoom ?? 17, { animate });
      return;
    }

    let computedMax = maxZoom ?? 13;
    if (maxZoom === undefined) {
      if (diag < 150) computedMax = 18;
      else if (diag < 500) computedMax = 17;
      else if (diag < 2000) computedMax = 16;
      else if (diag < 10000) computedMax = 14;
    }

    map.fitBounds(bounds, { padding, maxZoom: computedMax, animate });
  }, [positions, map, padding, maxZoom, animate]);

  return null;
};

export default FitBounds;
