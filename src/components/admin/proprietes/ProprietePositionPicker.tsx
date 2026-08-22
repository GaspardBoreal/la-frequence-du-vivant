import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import SafeMapContainer from '@/components/maps/SafeMapContainer';
import { DynamicTileLayer, MapStyleToggle, type MapStyle } from '@/components/maps';

const pickerIcon = L.divIcon({
  className: 'propriete-position-picker',
  html: `<div style="
    width: 22px; height: 22px; border-radius: 50%;
    background: linear-gradient(135deg,#10b981,#059669);
    border: 3px solid rgba(255,255,255,0.95);
    box-shadow: 0 2px 10px rgba(0,0,0,0.4), 0 0 0 6px rgba(16,185,129,0.25);
    cursor: grab;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Recentre la carte quand lat/lng changent de l'extérieur (géocodage). */
const Recenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [lat, lng, map]);
  return null;
};

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

/**
 * Mini-carte de positionnement : clic pour placer, marqueur déplaçable
 * pour ajuster finement les coordonnées de la propriété.
 */
const ProprietePositionPicker: React.FC<Props> = ({ lat, lng, onChange }) => {
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite');
  const hasPos = lat != null && lng != null;

  const ClickHandler: React.FC = () => {
    useMapEvents({
      click: (e) => onChange(e.latlng.lat, e.latlng.lng),
    });
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <SafeMapContainer
        center={hasPos ? [lat as number, lng as number] : [46.6, 2.4]}
        zoom={hasPos ? 16 : 5}
        className="h-[280px] w-full"
        scrollWheelZoom
      >
        <DynamicTileLayer mapStyle={mapStyle} />
        <ClickHandler />
        {hasPos && (
          <>
            <Recenter lat={lat as number} lng={lng as number} />
            <Marker
              position={[lat as number, lng as number]}
              icon={pickerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const p = m.getLatLng();
                  onChange(p.lat, p.lng);
                },
              }}
            />
          </>
        )}
      </SafeMapContainer>
      <MapStyleToggle mapStyle={mapStyle} onChange={setMapStyle} compact position="top-right" />
      {!hasPos && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[1000] flex justify-center">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
            Cliquez sur la carte pour placer la propriété
          </span>
        </div>
      )}
    </div>
  );
};

export default ProprietePositionPicker;
