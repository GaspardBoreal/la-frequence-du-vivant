import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
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
      map.setView([valid[0].latitude!, valid[0].longitude!], 12);
      return;
    }
    
    const bounds = L.latLngBounds(valid.map(p => [p.latitude!, p.longitude!] as [number, number]));
    map.fitBounds(bounds, {
      paddingTopLeft: [24, 24],
      paddingBottomRight: [24, 72],
      maxZoom: 13,
    });
  }, [points, map]);
  
  return null;
};

const ZoomControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-[500]">
      <button
        onClick={() => map.zoomIn()}
        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/90 border border-white/10 text-white/80 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <Plus size={14} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/90 border border-white/10 text-white/80 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <Minus size={14} />
      </button>
    </div>
  );
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

  // Apply micro-offset for markers sharing identical coordinates
  const adjustedPoints = useMemo(() => {
    const coordGroups = new Map<string, number[]>();
    allPoints.forEach((m, i) => {
      const key = `${m.latitude},${m.longitude}`;
      if (!coordGroups.has(key)) coordGroups.set(key, []);
      coordGroups.get(key)!.push(i);
    });

    return allPoints.map((m, i) => {
      const key = `${m.latitude},${m.longitude}`;
      const group = coordGroups.get(key)!;
      if (group.length <= 1) return m;
      const idx = group.indexOf(i);
      const angle = (2 * Math.PI * idx) / group.length;
      const offset = 0.003;
      return {
        ...m,
        latitude: m.latitude! + Math.sin(angle) * offset,
        longitude: m.longitude! + Math.cos(angle) * offset,
      };
    });
  }, [allPoints]);

  const mapCenter = useMemo(() => {
    if (adjustedPoints.length === 0) return { lat: 46.5, lng: 2.5 };
    const avgLat = adjustedPoints.reduce((sum, m) => sum + (m.latitude || 0), 0) / adjustedPoints.length;
    const avgLng = adjustedPoints.reduce((sum, m) => sum + (m.longitude || 0), 0) / adjustedPoints.length;
    return { lat: avgLat, lng: avgLng };
  }, [adjustedPoints]);

  if (isLoading) {
    return (
      <div className="h-56 bg-white/5 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-white/30 text-sm">Chargement de la carte...</span>
      </div>
    );
  }

  if (adjustedPoints.length === 0) {
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
      className="h-56 rounded-lg overflow-hidden border border-white/10 species-minimap relative"
    >
      <style>{`
        .species-minimap .leaflet-tooltip-pane {
          overflow: visible !important;
          z-index: 800 !important;
        }
        .species-minimap .leaflet-tooltip {
          white-space: nowrap;
          z-index: 800 !important;
        }
      `}</style>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={7}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={true}
        className="h-full w-full"
        style={{ background: '#1e293b' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <FitBounds points={allPoints} />
        <ZoomControls />
        
        {adjustedPoints.map((marche) => {
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
