import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationBiodiversitySummary } from '@/hooks/useExplorationBiodiversitySummary';
import { Camera, Mic, BookOpen, Leaf, Navigation, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MarcheStep {
  id: string;
  nom_marche: string | null;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  ordre: number;
}

interface MarcheContribStats {
  photos: number;
  sons: number;
  textes: number;
  heroPhotoUrl?: string;
}

interface ExplorationCarteTabProps {
  explorationId?: string;
  marches: MarcheStep[];
  onSelectStep?: (index: number) => void;
}

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Custom numbered marker icon
function createNumberedIcon(num: number, isActive: boolean, contribCount: number): L.DivIcon {
  const size = Math.min(40, 28 + Math.floor(contribCount / 3) * 2);
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
      ">
        ${num}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

// Arrow decorator for polyline direction
function ArrowDecorators({ positions }: { positions: [number, number][] }) {
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
          color: #10b981;
          font-size: 16px;
          opacity: 0.7;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">▲</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      
      const marker = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false });
      marker.addTo(map);
      arrows.push(marker);
    }
    
    return () => {
      arrows.forEach(a => map.removeLayer(a));
    };
  }, [positions, map]);
  
  return null;
}

// Auto-fit map to bounds
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [positions, map]);
  return null;
}

const ExplorationCarteTab: React.FC<ExplorationCarteTabProps> = ({
  explorationId,
  marches,
  onSelectStep,
}) => {
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [visibleMarkers, setVisibleMarkers] = useState<number>(0);

  // Progressive marker appearance
  useEffect(() => {
    if (marches.length === 0) return;
    setVisibleMarkers(0);
    const interval = setInterval(() => {
      setVisibleMarkers(prev => {
        if (prev >= marches.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [marches.length]);

  // Biodiversity summary
  const { data: bioSummary } = useExplorationBiodiversitySummary(explorationId);

  // Contribution stats per marche
  const marcheIds = useMemo(() => marches.map(m => m.id), [marches]);
  
  const { data: contribStats } = useQuery({
    queryKey: ['carte-contrib-stats', marcheIds],
    queryFn: async (): Promise<Record<string, MarcheContribStats>> => {
      if (marcheIds.length === 0) return {};

      const [photosRes, audioRes, textesRes, heroPhotosRes] = await Promise.all([
        supabase
          .from('marcheur_medias')
          .select('marche_id, type_media')
          .in('marche_id', marcheIds)
          .eq('is_public', true),
        supabase
          .from('marcheur_audio')
          .select('marche_id')
          .in('marche_id', marcheIds)
          .eq('is_public', true),
        supabase
          .from('marcheur_textes')
          .select('marche_id')
          .in('marche_id', marcheIds)
          .eq('is_public', true),
        supabase
          .from('marcheur_medias')
          .select('marche_id, url_fichier')
          .in('marche_id', marcheIds)
          .eq('is_public', true)
          .eq('type_media', 'photo')
          .order('created_at', { ascending: true }),
      ]);

      const stats: Record<string, MarcheContribStats> = {};
      marcheIds.forEach(id => { stats[id] = { photos: 0, sons: 0, textes: 0 }; });

      (photosRes.data || []).forEach(r => {
        if (stats[r.marche_id]) {
          if (r.type_media === 'photo') stats[r.marche_id].photos++;
        }
      });
      (audioRes.data || []).forEach(r => {
        if (stats[r.marche_id]) stats[r.marche_id].sons++;
      });
      (textesRes.data || []).forEach(r => {
        if (stats[r.marche_id]) stats[r.marche_id].textes++;
      });
      // First photo per marche as hero
      const heroSet = new Set<string>();
      (heroPhotosRes.data || []).forEach(r => {
        if (r.marche_id && !heroSet.has(r.marche_id) && stats[r.marche_id]) {
          stats[r.marche_id].heroPhotoUrl = r.url_fichier || undefined;
          heroSet.add(r.marche_id);
        }
      });

      return stats;
    },
    enabled: marcheIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  // Filter marches with valid coordinates
  console.log('[CarteTab] marches reçues:', marches.map(m => ({ id: m.id, lat: m.latitude, lng: m.longitude })));
  const geoMarches = useMemo(
    () => marches.filter(m => m.latitude != null && m.longitude != null),
    [marches]
  );

  const positions: [number, number][] = useMemo(
    () => geoMarches.map(m => [m.latitude!, m.longitude!]),
    [geoMarches]
  );

  // Total distance
  const totalDistance = useMemo(() => {
    let d = 0;
    for (let i = 1; i < positions.length; i++) {
      d += haversineKm(positions[i - 1][0], positions[i - 1][1], positions[i][0], positions[i][1]);
    }
    return d;
  }, [positions]);

  const bioByMarche = useMemo(() => {
    const map = new Map<string, number>();
    bioSummary?.speciesByMarche?.forEach(s => map.set(s.marcheId, s.speciesCount));
    return map;
  }, [bioSummary]);

  if (geoMarches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/15 flex items-center justify-center mb-4">
          <MapPin className="w-7 h-7 text-emerald-400/60" />
        </div>
        <h3 className="text-foreground text-sm font-semibold mb-1">Aucune coordonnée GPS</h3>
        <p className="text-muted-foreground text-xs max-w-xs">
          Les marches de cette exploration n'ont pas encore de coordonnées géographiques.
        </p>
      </motion.div>
    );
  }

  const center: [number, number] = [
    positions.reduce((s, p) => s + p[0], 0) / positions.length,
    positions.reduce((s, p) => s + p[1], 0) / positions.length,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative rounded-2xl overflow-hidden border border-border"
      style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}
    >
      <MapContainer
        center={center}
        zoom={10}
        className="w-full h-full z-0"
        style={{ background: '#1a1a2e' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds positions={positions} />

        {/* Route polyline */}
        {positions.length > 1 && (
          <>
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                opacity: 0.6,
                dashArray: '8, 12',
                lineCap: 'round',
              }}
            />
            <ArrowDecorators positions={positions} />
          </>
        )}

        {/* Numbered markers with progressive reveal */}
        {geoMarches.map((marche, index) => {
          if (index >= visibleMarkers) return null;
          const stats = contribStats?.[marche.id];
          const speciesCount = bioByMarche.get(marche.id) || 0;
          const totalContrib = (stats?.photos || 0) + (stats?.sons || 0) + (stats?.textes || 0) + speciesCount;

          return (
            <Marker
              key={marche.id}
              position={[marche.latitude!, marche.longitude!]}
              icon={createNumberedIcon(index + 1, activeMarker === index, totalContrib)}
              eventHandlers={{
                click: () => setActiveMarker(index),
              }}
            >
              <Popup className="exploration-carte-popup" maxWidth={260} minWidth={220}>
                <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 -m-3 text-white">
                  {/* Hero photo */}
                  {stats?.heroPhotoUrl && (
                    <div className="w-full h-28 rounded-lg overflow-hidden mb-2.5">
                      <img
                        src={stats.heroPhotoUrl}
                        alt={marche.nom_marche || marche.ville}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div className="mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold mr-1.5">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold">
                      {marche.nom_marche || marche.ville}
                    </span>
                  </div>

                  {/* Contribution badges */}
                  <div className="flex items-center gap-3 text-[11px] text-white/70 mb-2.5">
                    {(stats?.photos || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3 text-amber-400" />
                        {stats!.photos}
                      </span>
                    )}
                    {(stats?.sons || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Mic className="w-3 h-3 text-blue-400" />
                        {stats!.sons}
                      </span>
                    )}
                    {(stats?.textes || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-purple-400" />
                        {stats!.textes}
                      </span>
                    )}
                    {speciesCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-400" />
                        {speciesCount}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  {onSelectStep && (
                    <button
                      onClick={() => onSelectStep(index)}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium hover:bg-emerald-500/30 transition-colors"
                    >
                      Explorer cette étape →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating legend */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-black/70 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-3">
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{geoMarches.length} étapes</span>
            </div>
            {totalDistance > 0 && (
              <span className="text-white/60">
                ~{totalDistance < 1 ? `${Math.round(totalDistance * 1000)} m` : `${Math.round(totalDistance)} km`}
              </span>
            )}
            {bioSummary && bioSummary.totalSpecies > 0 && (
              <div className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 font-medium">{bioSummary.totalSpecies} espèces</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom popup style overrides */}
      <style>{`
        .exploration-carte-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .exploration-carte-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .exploration-carte-popup .leaflet-popup-tip {
          background: rgba(0,0,0,0.8) !important;
        }
        .custom-numbered-marker {
          background: none !important;
          border: none !important;
        }
        .arrow-decorator {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </motion.div>
  );
};

export default ExplorationCarteTab;
