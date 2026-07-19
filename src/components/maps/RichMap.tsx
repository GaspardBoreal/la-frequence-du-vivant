import React, { useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import SafeMapContainer from './SafeMapContainer';
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
  /** Max map zoom (default 19). Tiles beyond native are upscaled. */
  maxZoom?: number;
  /** Notified when the user toggles marche step markers visibility (only when controls.marcheRouteVisibility is on) */
  onMarcheVisibilityChange?: (visible: boolean) => void;
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
  maxZoom = 19,
  onMarcheVisibilityChange,
}) => {
  const [mapStyle, setMapStyle] = useState<MapStyle>(initialStyle);
  const [markersVisible, setMarkersVisible] = useState<boolean>(
    marcheRoute?.renderMarkers !== false,
  );

  const handleMarkersToggle = (v: boolean) => {
    setMarkersVisible(v);
    onMarcheVisibilityChange?.(v);
  };

  const cadastrePoints = useMemo(() => {
    const fromRoute = marcheRoute
      ? marcheRoute.steps
          .filter((s) => s.latitude != null && s.longitude != null)
          .map((s) => ({ id: s.id, lat: s.latitude, lng: s.longitude, label: s.label || undefined }))
      : [];
    if (fromRoute.length > 0) return fromRoute;
    // Fallback : centre de la carte comme point pivot unique pour que
    // CadastreLayer puisse charger les parcelles alentour même sans marcheRoute.
    if (center && center.length === 2) {
      return [{ id: 'center', lat: center[0], lng: center[1] }];
    }
    return [];
  }, [marcheRoute, center]);

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
      <SafeMapContainer
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
            renderMarkers={markersVisible}
            opacity={markersVisible ? (marcheRoute.opacity ?? 1) : Math.min(marcheRoute.opacity ?? 1, 0.45)}
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
      </SafeMapContainer>

      {controls.style && <MapStyleToggle mapStyle={mapStyle} onChange={setMapStyle} />}
      {controls.marcheRouteVisibility && marcheRoute && marcheRoute.steps.length > 0 && (
        <MarcheRouteToggle visible={markersVisible} onToggle={handleMarkersToggle} />
      )}
    </div>
  );
};

export default RichMap;
