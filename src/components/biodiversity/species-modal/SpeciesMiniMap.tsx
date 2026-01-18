import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { motion } from 'framer-motion';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';
import 'leaflet/dist/leaflet.css';

interface SpeciesMiniMapProps {
  marches: SpeciesMarcheData[];
  isLoading?: boolean;
}

const SpeciesMiniMap: React.FC<SpeciesMiniMapProps> = ({ marches, isLoading }) => {
  // Filter marches with valid coordinates
  const validMarches = useMemo(() => {
    return marches.filter(m => m.latitude && m.longitude);
  }, [marches]);

  // Calculate center and bounds
  const mapCenter = useMemo(() => {
    if (validMarches.length === 0) {
      return { lat: 46.5, lng: 2.5 }; // France center
    }

    const avgLat = validMarches.reduce((sum, m) => sum + (m.latitude || 0), 0) / validMarches.length;
    const avgLng = validMarches.reduce((sum, m) => sum + (m.longitude || 0), 0) / validMarches.length;

    return { lat: avgLat, lng: avgLng };
  }, [validMarches]);

  // Calculate zoom based on spread
  const zoom = useMemo(() => {
    if (validMarches.length <= 1) return 8;
    
    const lats = validMarches.map(m => m.latitude || 0);
    const lngs = validMarches.map(m => m.longitude || 0);
    
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    
    if (maxSpread > 5) return 5;
    if (maxSpread > 2) return 6;
    if (maxSpread > 1) return 7;
    return 8;
  }, [validMarches]);

  if (isLoading) {
    return (
      <div className="h-40 bg-white/5 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-white/30 text-sm">Chargement de la carte...</span>
      </div>
    );
  }

  if (validMarches.length === 0) {
    return (
      <div className="h-40 bg-white/5 rounded-lg flex items-center justify-center">
        <span className="text-white/30 text-sm">Aucune coordonnée disponible</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-40 rounded-lg overflow-hidden border border-white/10"
    >
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        className="h-full w-full"
        style={{ background: '#1e293b' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {validMarches.map((marche) => (
          <CircleMarker
            key={marche.marcheId}
            center={[marche.latitude!, marche.longitude!]}
            radius={Math.min(8, 4 + marche.observationCount)}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -10]}
              className="!bg-slate-800 !border-white/20 !text-white !text-xs !px-2 !py-1 !rounded-md"
            >
              <span className="font-medium">#{marche.order}</span> {marche.marcheName}
              <br />
              <span className="text-white/60">{marche.observationCount} obs.</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </motion.div>
  );
};

export default SpeciesMiniMap;
