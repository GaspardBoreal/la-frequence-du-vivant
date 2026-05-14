import React, { useEffect } from 'react';
import { Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { MapStyle } from '../mapStyles';
import { POLYLINE_COLORS, ARROW_COLORS } from '../mapStyles';

export interface MarcheRouteStep {
  id: string;
  latitude: number;
  longitude: number;
  label?: string | null;
  ordre?: number;
}

interface MarcheRouteLayerProps {
  steps: MarcheRouteStep[];
  /** Pre-computed polyline (for waypoint-aware routes); falls back to steps */
  polylinePositions?: Array<[number, number]>;
  isLoop?: boolean;
  mapStyle?: MapStyle;
  /** Render numbered step markers (default true). Off for "background only". */
  renderMarkers?: boolean;
  /** Marker size mode (default uniform 32px) */
  uniformMarkerSize?: boolean;
  /** Opacity of polyline + markers (default 1). Use ~0.5 for fond derrière des markers métier. */
  opacity?: number;
}

/** Numbered emerald marker icon for marche steps */
export function createNumberedIcon(
  num: number,
  isActive: boolean,
  contribCount = 0,
  uniformSize = true,
): L.DivIcon {
  const size = uniformSize ? 32 : Math.min(40, 28 + Math.floor(contribCount / 3) * 2);
  const pulseClass = isActive ? 'animate-pulse' : '';
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `
      <div class="${pulseClass}" style="
        width: ${size}px; height: ${size}px;
        background: linear-gradient(135deg, #10b981, #059669);
        border: 2.5px solid ${isActive ? '#fbbf24' : 'rgba(255,255,255,0.85)'};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: ${size > 32 ? 14 : 12}px;
        box-shadow: 0 2px 8px rgba(16,185,129,0.45)${isActive ? ', 0 0 0 4px rgba(251,191,36,0.3)' : ''};
        position: relative;
      ">${num}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

/** Triangular arrow decorators along the polyline indicating direction */
export const ArrowDecorators: React.FC<{ positions: Array<[number, number]>; color?: string }> = ({
  positions,
  color = '#10b981',
}) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    const arrows: L.Marker[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const [lat1, lng1] = positions[i];
      const [lat2, lng2] = positions[i + 1];
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const angle = (Math.atan2(lat2 - lat1, lng2 - lng1) * 180) / Math.PI;
      const arrowIcon = L.divIcon({
        className: 'arrow-decorator',
        html: `<div style="
          transform: rotate(${90 - angle}deg);
          color: ${color};
          font-size: 16px;
          opacity: 0.7;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">▲</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const m = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false });
      m.addTo(map);
      arrows.push(m);
    }
    return () => {
      arrows.forEach((a) => map.removeLayer(a));
    };
  }, [positions, map, color]);
  return null;
};

/**
 * Renders a marche as a dashed polyline with numbered emerald step markers and
 * directional arrows. Reusable: pass in pre-built polylinePositions if you have
 * waypoint logic, else the layer derives them from `steps` + `isLoop`.
 */
export const MarcheRouteLayer: React.FC<MarcheRouteLayerProps> = ({
  steps,
  polylinePositions,
  isLoop = false,
  mapStyle = 'geopoetic',
  renderMarkers = true,
  uniformMarkerSize = true,
  opacity = 1,
}) => {
  const positions: Array<[number, number]> = steps
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => [s.latitude, s.longitude]);

  const polyline =
    polylinePositions ??
    (isLoop && positions.length >= 2 ? [...positions, positions[0]] : positions);

  return (
    <>
      {polyline.length > 1 && (
        <>
          <Polyline
            positions={polyline}
            pathOptions={{
              color: POLYLINE_COLORS[mapStyle],
              weight: 3,
              opacity: (mapStyle === 'satellite' ? 0.9 : 0.6) * opacity,
              dashArray: '8, 12',
              lineCap: 'round',
            }}
          />
          <ArrowDecorators positions={polyline} color={ARROW_COLORS[mapStyle]} />
        </>
      )}
      {renderMarkers &&
        steps.map((step, idx) => {
          if (step.latitude == null || step.longitude == null) return null;
          return (
            <Marker
              key={step.id}
              position={[step.latitude, step.longitude]}
              icon={createNumberedIcon(idx + 1, false, 0, uniformMarkerSize)}
              opacity={opacity}
            >
              {step.label && (
                <Popup>
                  <div className="text-xs font-medium">{step.label}</div>
                </Popup>
              )}
            </Marker>
          );
        })}
    </>
  );
};

export default MarcheRouteLayer;
