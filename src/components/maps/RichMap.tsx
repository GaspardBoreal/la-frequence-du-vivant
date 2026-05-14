import React, { useState, useMemo } from 'react';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DynamicTileLayer from './DynamicTileLayer';
import MapStyleToggle from './MapStyleToggle';
import type { MapStyle } from './mapStyles';
import { FitBounds } from './controls/FitBounds';
import { ZoomControls } from './controls/ZoomControls';
import { GeolocateControl } from './controls/GeolocateControl';
import { MarcheRouteLayer, type MarcheRouteStep } from './layers/MarcheRouteLayer';
import MarcheRouteToggle from './controls/MarcheRouteToggle';
import CadastreLayer from '@/components/cadastre/CadastreLayer';
import WeatherStationsLayer from '@/components/community/exploration/WeatherStationsLayer';

export interface RichMapControls {
  zoom?: boolean;
  style?: boolean;
  geolocate?: boolean;
  cadastre?: boolean;
  weather?: boolean;
  /** When true and `marcheRoute` is set, renders a toggle to show/hide numbered steps */
  marcheRouteVisibility?: boolean;
}

export interface RichMapMarcheRoute {
  steps: MarcheRouteStep[];
  polylinePositions?: Array<[number, number]>;
  isLoop?: boolean;
  /** Render numbered step markers (default true). Off for "background-only" trace. */
  renderMarkers?: boolean;
  /** Background opacity (default 1) */
  opacity?: number;
}

export interface RichMapProps {
  /** Initial center; ignored when `bounds` is provided. */
  center?: [number, number];
  /** Initial zoom (default 13) */
  zoom?: number;
  /** Auto-fit positions on mount/update */
  bounds?: Array<[number, number]>;
  /** Initial map style (default 'geopoetic') */
  initialStyle?: MapStyle;
  /** Which built-in controls to render */
  controls?: RichMapControls;
  /** Optional marche route to draw (polyline + numbered markers) */
  marcheRoute?: RichMapMarcheRoute;
  /** Weather stations radius km (when controls.weather=true) */
  weatherRadiusKm?: number;
  /** Map height (default '100%') */
  height?: string | number;
  className?: string;
  /** Children rendered inside MapContainer (markers, polylines, popups…) */
  children?: React.ReactNode;
  /** scroll wheel zoom (default true) */
  scrollWheelZoom?: boolean;
}

/**
 * High-level reusable map shell. Composes DynamicTileLayer + style toggle +
 * zoom + geolocate + cadastre + weather + optional marche route, and exposes
 * a `children` slot for business markers (species, observations, etc.).
 *
 * Used by SpeciesGpsDrawer and other secondary maps. ExplorationCarteTab keeps
 * its bespoke composition but consumes the same primitives (FitBounds, etc.)
 * so improvements propagate to both.
 */
export const RichMap: React.FC<RichMapProps> = ({
  center = [45.0, 0.5],
  zoom = 13,
  bounds,
  initialStyle = 'geopoetic',
  controls = { zoom: true, style: true, geolocate: true, cadastre: false, weather: false },
  marcheRoute,
  weatherRadiusKm = 60,
  height = '100%',
  className = '',
  children,
  scrollWheelZoom = true,
}) => {
  const [mapStyle, setMapStyle] = useState<MapStyle>(initialStyle);

  const cadastrePoints = useMemo(() => {
    if (!marcheRoute) return [];
    return marcheRoute.steps
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => ({ id: s.id, lat: s.latitude, lng: s.longitude, label: s.label || undefined }));
  }, [marcheRoute]);

  const weatherMarches = useMemo(() => {
    if (!marcheRoute) return [];
    return marcheRoute.steps
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => ({
        id: s.id,
        latitude: s.latitude,
        longitude: s.longitude,
        nom_marche: s.label,
      }));
  }, [marcheRoute]);

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ height }}
    >
      <style>{`
        @keyframes gps-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }
        .custom-numbered-marker, .arrow-decorator, .user-gps-marker, .weather-station-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: '#1a1a2e' }}
      >
        <DynamicTileLayer mapStyle={mapStyle} />

        {bounds && bounds.length > 0 && <FitBounds positions={bounds} />}

        {/* Marche route (background trace) */}
        {marcheRoute && marcheRoute.steps.length > 0 && (
          <MarcheRouteLayer
            steps={marcheRoute.steps}
            polylinePositions={marcheRoute.polylinePositions}
            isLoop={marcheRoute.isLoop}
            mapStyle={mapStyle}
            renderMarkers={marcheRoute.renderMarkers !== false}
            opacity={marcheRoute.opacity ?? 1}
          />
        )}

        {/* Cadastre overlay */}
        {controls.cadastre && mapStyle === 'cadastre' && cadastrePoints.length > 0 && (
          <CadastreLayer points={cadastrePoints} enabled />
        )}

        {/* Weather stations */}
        {controls.weather && weatherMarches.length > 0 && (
          <WeatherStationsLayer marches={weatherMarches} radiusKm={weatherRadiusKm} />
        )}

        {/* Custom controls inside map context */}
        {controls.zoom && <ZoomControls mapStyle={mapStyle} />}
        {controls.geolocate && <GeolocateControl disableTracking />}

        {/* Business markers / overlays */}
        {children}
      </MapContainer>

      {controls.style && <MapStyleToggle mapStyle={mapStyle} onChange={setMapStyle} />}
    </div>
  );
};

export default RichMap;
