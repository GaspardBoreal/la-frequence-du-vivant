import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';
import 'leaflet/dist/leaflet.css';

interface SpeciesMiniMapProps {
  marches: SpeciesMarcheData[];
  isLoading?: boolean;
  allEventMarches?: SpeciesMarcheData[];
}

const FitBounds: React.FC<{ points: { latitude?: number; longitude?: number }[] }> = ({ points }) => {
  const map = useMap();
  
  React.useEffect(() => {
    const valid = points.filter(p => p.latitude && p.longitude);
    if (valid.length === 0) return;
    
    if (valid.length === 1) {
      map.setView([valid[0].latitude!, valid[0].longitude!], 10);
      return;
    }
    
    const bounds = L.latLngBounds(valid.map(p => [p.latitude!, p.longitude!] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
  }, [points, map]);
  
  return null;
};

const SpeciesMiniMap: React.FC<SpeciesMiniMapProps> = ({ marches, isLoading, allEventMarches }) => {
  const observedMarcheIds = useMemo(() => new Set(marches.map(m => m.marcheId)), [marches]);

  const observedMarcheMap = useMemo(() => {
    const map = new Map<string, number>();
    marches.forEach(m => map.set(m.marcheId, m.observationCount));
    return map;
  }, [marches]);

  const allPoints = useMemo(() => {
    if (!allEventMarches?.length) return marches.filter(m => m.latitude && m.longitude);
    return allEventMarches.filter(m => m.latitude && m.longitude);
  }, [marches, allEventMarches]);

  const validMarches = useMemo(() => allPoints, [allPoints]);

  const mapCenter = useMemo(() => {
    if (validMarches.length === 0) return { lat: 46.5, lng: 2.5 };
    const avgLat = validMarches.reduce((sum, m) => sum + (m.latitude || 0), 0) / validMarches.length;
    const avgLng = validMarches.reduce((sum, m) => sum + (m.longitude || 0), 0) / validMarches.length;
    return { lat: avgLat, lng: avgLng };
  }, [validMarches]);

  if (isLoading) {
    return (
      <div className="h-56 bg-white/5 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-white/30 text-sm">Chargement de la carte...</span>
      </div>
    );
  }

  if (validMarches.length === 0) {
    return (
      <div className="h-56 bg-white/5 rounded-lg flex items-center justify-center">
        <span className="text-white/30 text-sm">Aucune coordonnée disponible</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-56 rounded-lg overflow-hidden border border-white/10 species-minimap"
    >
      <style>{`
        .species-minimap .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
        }
        .species-minimap .leaflet-control-zoom a {
          background: rgba(30, 41, 59, 0.9) !important;
          color: rgba(255,255,255,0.8) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
          font-size: 14px !important;
        }
        .species-minimap .leaflet-control-zoom a:hover {
          background: rgba(30, 41, 59, 1) !important;
          color: white !important;
        }
        .species-minimap .leaflet-tooltip-pane {
          overflow: visible !important;
        }
        .species-minimap .leaflet-tooltip {
          white-space: nowrap;
        }
      `}</style>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={7}
        scrollWheelZoom={false}
        zoomControl={true}
        dragging={true}
        className="h-full w-full"
        style={{ background: '#1e293b' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <FitBounds points={validMarches} />
        
        {validMarches.map((marche) => {
          const isObserved = observedMarcheIds.has(marche.marcheId);
          const obsCount = observedMarcheMap.get(marche.marcheId) || 0;
          return (
            <CircleMarker
              key={marche.marcheId}
              center={[marche.latitude!, marche.longitude!]}
              radius={isObserved ? Math.min(8, 4 + obsCount) : 4}
              pathOptions={{
                color: isObserved ? '#10b981' : '#94a3b8',
                fillColor: isObserved ? '#10b981' : '#94a3b8',
                fillOpacity: isObserved ? 0.8 : 0.25,
                weight: isObserved ? 3 : 1,
              }}
            >
              <Tooltip 
                direction="auto" 
                offset={[0, -10]}
                className="!bg-slate-800 !border-white/20 !text-white !text-xs !px-2 !py-1 !rounded-md"
              >
                <span className="font-medium">#{marche.order}</span> {marche.marcheName}
                <br />
                {isObserved ? (
                  <span className="text-emerald-400">{obsCount} obs.</span>
                ) : (
                  <span className="text-white/40">Non observée ici</span>
                )}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </motion.div>
  );
};

export default SpeciesMiniMap;
