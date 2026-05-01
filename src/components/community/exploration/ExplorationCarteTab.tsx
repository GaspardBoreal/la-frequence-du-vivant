import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationBiodiversitySummary } from '@/hooks/useExplorationBiodiversitySummary';
import { Camera, Mic, BookOpen, Leaf, Navigation, MapPin, Plus, Minus, Palette, Globe, Mountain, Crosshair, X, Star, Sparkles } from 'lucide-react';
import { PhotoGpsButton, PhotoGpsMarker, usePhotoGpsDrop } from './PhotoGpsDropTool';
import CreateMarcheDrawer from './CreateMarcheDrawer';
import { canCreateMarche, computeMarcheDefaults } from './createMarcheUtils';
import 'leaflet/dist/leaflet.css';

type MapStyle = 'geopoetic' | 'satellite' | 'terrain';

const TILE_CONFIGS: Record<MapStyle, { url: string; attribution: string; maxZoom?: number }> = {
  geopoetic: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

const POLYLINE_COLORS: Record<MapStyle, string> = {
  geopoetic: '#10b981',
  satellite: '#fbbf24',
  terrain: '#10b981',
};

const ARROW_COLORS: Record<MapStyle, string> = {
  geopoetic: '#10b981',
  satellite: '#fbbf24',
  terrain: '#10b981',
};

// Dynamic tile layer that swaps without remounting the map
function DynamicTileLayer({ mapStyle }: { mapStyle: MapStyle }) {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<L.TileLayer | null>(null);

  useEffect(() => {
    if (currentLayer) {
      map.removeLayer(currentLayer);
    }
    const config = TILE_CONFIGS[mapStyle];
    const layer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 19,
      className: mapStyle === 'geopoetic' ? 'carte-tiles-dark' : '',
    });
    layer.addTo(map);
    setCurrentLayer(layer);

    return () => {
      map.removeLayer(layer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle, map]);

  return null;
}

// Map style toggle component
function MapStyleToggle({ mapStyle, onChange }: { mapStyle: MapStyle; onChange: (s: MapStyle) => void }) {
  const styles: { key: MapStyle; icon: React.ReactNode; label: string }[] = [
    { key: 'geopoetic', icon: <Palette className="w-4 h-4" />, label: 'Géo' },
    { key: 'satellite', icon: <Globe className="w-4 h-4" />, label: 'Sat' },
    { key: 'terrain', icon: <Mountain className="w-4 h-4" />, label: 'Relief' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <div className="flex bg-black/50 backdrop-blur-xl rounded-xl border border-white/15 p-1 gap-0.5 shadow-lg shadow-black/20">
        {styles.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
              ${mapStyle === key
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'text-white/60 hover:text-white/90 hover:bg-white/10 border border-transparent'
              }
            `}
            aria-label={label}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface MarcheStep {
  id: string;
  nom_marche: string | null;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  ordre: number;
  date?: string | null;
}

interface MarcheContribStats {
  photos: number;
  sons: number;
  textes: number;
  heroPhotoUrl?: string;
}

interface ExplorationCarteTabProps {
  explorationId?: string;
  explorationName?: string;
  marches: MarcheStep[];
  marcheEventId?: string;
  marcheEventTitle?: string;
  marcheEventDate?: string | null;
  marcheEventLieu?: string | null;
  userLevel?: string;
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
function ArrowDecorators({ positions, color = '#10b981' }: { positions: [number, number][]; color?: string }) {
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
      
      const marker = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false });
      marker.addTo(map);
      arrows.push(marker);
    }
    
    return () => {
      arrows.forEach(a => map.removeLayer(a));
    };
  }, [positions, map, color]);
  
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

// Custom zoom controls
function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-20 right-4 z-[1000] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200 active:scale-95"
        aria-label="Zoomer"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200 active:scale-95"
        aria-label="Dézoomer"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

// GPS blue dot marker — accepts accuracy for dynamic radius
function UserLocationMarker({ position, accuracy, nearestPosition }: { position: [number, number]; accuracy?: number; nearestPosition?: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 13), { animate: true });
  }, [position, map]);

  const gpsDotIcon = L.divIcon({
    className: 'user-gps-marker',
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(56,189,248,0.15);animation:gps-pulse 2s ease-out infinite;"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#0ea5e9);border:3px solid white;box-shadow:0 2px 8px rgba(56,189,248,0.5);"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const radius = accuracy && accuracy > 10 ? accuracy : 100;

  return (
    <>
      <Circle
        center={position}
        radius={radius}
        pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.08, weight: 1, opacity: 0.3 }}
      />
      <Marker position={position} icon={gpsDotIcon} />
      {nearestPosition && (
        <Polyline
          positions={[position, nearestPosition]}
          pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.5, dashArray: '6, 8' }}
        />
      )}
    </>
  );
}

// Geolocate button with tracking ring
function GeolocateButton({
  active,
  loading,
  isTracking,
  onClick,
  onLongPress,
}: { active: boolean; loading: boolean; isTracking: boolean; onClick: () => void; onLongPress: () => void }) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const lastTapTime = useRef<number>(0);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress();
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (didLongPress.current) return;

    const now = Date.now();
    if (now - lastTapTime.current < 400) {
      // Double tap detected
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
      lastTapTime.current = 0;
      onLongPress();
    } else {
      lastTapTime.current = now;
      doubleTapTimer.current = setTimeout(() => {
        onClick();
        lastTapTime.current = 0;
      }, 400);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div className="absolute bottom-20 right-[4.5rem] z-[1000]">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`
          relative w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all duration-200 active:scale-95
          ${isTracking
            ? 'bg-sky-500/30 border-sky-400/50 text-sky-200 shadow-md shadow-sky-500/30'
            : active
              ? 'bg-sky-500/20 border-sky-400/40 text-sky-300 shadow-sm shadow-sky-500/20'
              : 'bg-white/10 border-white/20 text-white hover:bg-sky-500/15 hover:border-sky-400/30'
          }
        `}
        aria-label={isTracking ? 'Arrêter le suivi' : 'Me localiser'}
      >
        {/* Tracking ring animation */}
        {isTracking && (
          <span className="absolute inset-[-4px] rounded-2xl border-2 border-sky-400/60 animate-ping pointer-events-none" />
        )}
        {loading ? (
          <div className="w-4 h-4 border-2 border-sky-300/30 border-t-sky-300 rounded-full animate-spin" />
        ) : (
          <Crosshair className={`w-4 h-4 ${isTracking ? 'animate-pulse' : ''}`} />
        )}
      </button>
    </div>
  );
}

// Compact proximity banner for tracking mode
function ProximityBanner({
  nearestName,
  distanceKm,
  onTap,
}: { nearestName: string; distanceKm: number; onTap: () => void }) {
  const formatDist = (km: number) => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

  return (
    <motion.button
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 30, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={onTap}
      className="absolute bottom-4 left-4 right-4 z-[1001]"
    >
      <div className="bg-black/70 backdrop-blur-xl rounded-xl border border-sky-400/20 px-4 py-3 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
        <Navigation className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
        <span className="text-white text-xs font-medium truncate flex-1 text-left">
          → {nearestName}
        </span>
        <span className="text-sky-300 text-sm font-mono font-semibold tabular-nums flex-shrink-0 transition-all duration-300">
          {formatDist(distanceKm)}
        </span>
      </div>
    </motion.button>
  );
}

// Distance panel
function DistancePanel({
  steps,
  onClose,
  onSelectStep,
}: {
  steps: { index: number; name: string; distance: number; isNearest: boolean }[];
  onClose: () => void;
  onSelectStep?: (index: number) => void;
}) {
  const maxDist = Math.max(...steps.map(s => s.distance), 0.01);
  const nearest = steps.find(s => s.isNearest);

  const formatDist = (km: number) => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute bottom-4 left-4 right-4 z-[1001] max-h-[45vh] flex flex-col"
    >
      <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-white text-xs font-semibold">Vous êtes ici</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nearest highlight */}
        {nearest && (
          <div className="px-4 py-2.5 bg-sky-500/10 border-b border-white/5">
            <div className="flex items-center gap-2 text-sky-300 text-[11px]">
              <Star className="w-3 h-3 fill-sky-400 text-sky-400" />
              <span>Point le plus proche : <strong>{nearest.name}</strong> — {formatDist(nearest.distance)}</span>
            </div>
          </div>
        )}

        {/* Steps list */}
        <div className="overflow-y-auto max-h-[28vh] px-4 py-2 space-y-1.5">
          {steps.map(step => (
            <button
              key={step.index}
              onClick={() => onSelectStep?.(step.index)}
              className="w-full flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              <span className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                ${step.isNearest
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }
              `}>
                {step.index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-[11px] font-medium truncate pr-2">{step.name}</span>
                  <span className={`text-[10px] flex-shrink-0 font-mono ${step.isNearest ? 'text-sky-300' : 'text-white/50'}`}>
                    {formatDist(step.distance)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${step.isNearest ? 'bg-sky-400' : 'bg-emerald-500/40'}`}
                    style={{ width: `${Math.max(4, (1 - step.distance / maxDist) * 100)}%` }}
                  />
                </div>
              </div>
              {step.isNearest && (
                <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 font-medium">
                  ★
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const TRACKING_TIMEOUT_MS = 10 * 60 * 1000; // 10 min auto-stop

// Draggable amber marker for the "create marche" mode
function DraggableCreateMarker({
  position,
  onChange,
}: {
  position: { lat: number; lng: number };
  onChange: (p: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const icon = L.divIcon({
      className: 'create-marche-marker',
      html: `
        <div style="position:relative;width:36px;height:36px;">
          <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(251,191,36,0.18);animation:gps-pulse 2s ease-out infinite;"></div>
          <div style="
            width:36px;height:36px;border-radius:50%;
            background:linear-gradient(135deg,#fbbf24,#f59e0b);
            border:3px solid white;
            box-shadow:0 4px 14px rgba(251,191,36,0.5);
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:700;font-size:20px;line-height:1;
            cursor:grab;
          ">+</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([position.lat, position.lng], {
      icon,
      draggable: true,
      autoPan: true,
    });
    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      onChange({ lat: ll.lat, lng: ll.lng });
    });
    marker.addTo(map);

    map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });

    return () => {
      map.removeLayer(marker);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

const ExplorationCarteTab: React.FC<ExplorationCarteTabProps> = ({
  explorationId,
  explorationName,
  marches,
  marcheEventId,
  marcheEventTitle,
  marcheEventDate,
  marcheEventLieu,
  userLevel,
  onSelectStep,
}) => {
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [visibleMarkers, setVisibleMarkers] = useState<number>(0);
  const [mapStyle, setMapStyle] = useState<MapStyle>('geopoetic');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | undefined>(undefined);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showDistances, setShowDistances] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVibratedRef = useRef<number>(0);

  // Create-marche mode state
  const [isCreatingMarche, setIsCreatingMarche] = useState(false);
  const [createPosition, setCreatePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userCanCreate = canCreateMarche(userLevel);

  // Photo GPS drop tool
  const { photoPoint, triggerFileInput, clear: clearPhotoPoint, FileInput } = usePhotoGpsDrop();

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
  const geoMarches = useMemo(() => {
    console.log('[CarteTab] marches reçues:', marches.map(m => ({ id: m.id, lat: m.latitude, lng: m.longitude })));
    return marches.filter(m => m.latitude != null && m.longitude != null);
  }, [marches]);

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

  // Stop tracking helper
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
      trackingTimeoutRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Start tracking helper
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    stopTracking();

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setUserAccuracy(pos.coords.accuracy);
      },
      (err) => {
        // Ne pas couper le suivi sur timeout — retenter automatiquement
        if (err.code === err.TIMEOUT) {
          console.warn('GPS timeout, en attente du prochain fix...');
          return;
        }
        // Erreur fatale (permission refusée, indisponible)
        console.error('Geolocation error:', err.message);
        toast.error("Signal GPS perdu — suivi désactivé");
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    watchIdRef.current = id;
    setIsTracking(true);

    // Auto-stop after 10 min
    trackingTimeoutRef.current = setTimeout(() => {
      stopTracking();
    }, TRACKING_TIMEOUT_MS);
  }, [stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, []);

  // Geolocation handler — simple tap
  const handleGeolocate = useCallback(() => {
    if (isTracking) {
      stopTracking();
      return;
    }
    if (userLocation) {
      setShowDistances(prev => !prev);
      return;
    }
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setUserAccuracy(pos.coords.accuracy);
        setShowDistances(true);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [userLocation, isTracking, stopTracking]);

  // Long press → start tracking
  const handleLongPress = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
      setShowDistances(false); // use compact banner instead
    }
  }, [isTracking, startTracking, stopTracking]);

  // Compute distances from user to each step
  const stepsWithDistance = useMemo(() => {
    if (!userLocation) return [];
    return geoMarches.map((m, i) => {
      const dist = haversineKm(userLocation[0], userLocation[1], m.latitude!, m.longitude!);
      return { index: i, name: m.nom_marche || m.ville, distance: dist, lat: m.latitude!, lng: m.longitude!, isNearest: false };
    }).sort((a, b) => a.distance - b.distance).map((s, i) => ({ ...s, isNearest: i === 0 }));
  }, [userLocation, geoMarches]);

  const nearestStep = stepsWithDistance.find(s => s.isNearest);

  // Haptic feedback when < 100m in tracking mode
  useEffect(() => {
    if (!isTracking || !nearestStep) return;
    if (nearestStep.distance < 0.1) {
      const now = Date.now();
      if (now - lastVibratedRef.current > 10000) {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        lastVibratedRef.current = now;
      }
    }
  }, [isTracking, nearestStep]);

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
        <DynamicTileLayer mapStyle={mapStyle} />
        <ZoomControls />
        <FitBounds positions={positions} />

        {/* Route polyline */}
        {positions.length > 1 && (
          <>
            <Polyline
              positions={positions}
              pathOptions={{
                color: POLYLINE_COLORS[mapStyle],
                weight: 3,
                opacity: mapStyle === 'satellite' ? 0.9 : 0.6,
                dashArray: '8, 12',
                lineCap: 'round',
              }}
            />
            <ArrowDecorators positions={positions} color={ARROW_COLORS[mapStyle]} />
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
        {/* User GPS marker */}
        {userLocation && (
          <UserLocationMarker
            position={userLocation}
            accuracy={userAccuracy}
            nearestPosition={nearestStep ? [nearestStep.lat, nearestStep.lng] : undefined}
          />
        )}
        {/* Photo GPS marker */}
        {photoPoint && (
          <PhotoGpsMarker
            point={photoPoint}
            marches={marches.map(m => ({ id: m.id, nom_marche: m.nom_marche, ville: m.ville }))}
            marcheEventId={marcheEventId || ''}
            onClose={clearPhotoPoint}
            onUploaded={clearPhotoPoint}
          />
        )}
        {/* Create-marche draggable marker */}
        {isCreatingMarche && createPosition && (
          <DraggableCreateMarker
            position={createPosition}
            onChange={setCreatePosition}
          />
        )}
      </MapContainer>

      {/* Map style toggle */}
      <MapStyleToggle mapStyle={mapStyle} onChange={setMapStyle} />

      {/* Photo GPS button */}
      {marcheEventId && (
        <div className="absolute bottom-20 right-[7.5rem] z-[1000]">
          <PhotoGpsButton onClick={triggerFileInput} />
        </div>
      )}
      {FileInput}

      {/* Geolocate button */}
      <GeolocateButton
        active={!!userLocation}
        loading={geoLoading}
        isTracking={isTracking}
        onClick={handleGeolocate}
        onLongPress={handleLongPress}
      />

      {/* Bottom panel: tracking banner, distance panel, or stats bar */}
      <AnimatePresence mode="wait">
        {isTracking && nearestStep ? (
          <ProximityBanner
            key="proximity"
            nearestName={nearestStep.name}
            distanceKm={nearestStep.distance}
            onTap={() => setShowDistances(true)}
          />
        ) : showDistances && stepsWithDistance.length > 0 ? (
          <DistancePanel
            key="distances"
            steps={stepsWithDistance}
            onClose={() => setShowDistances(false)}
            onSelectStep={onSelectStep}
          />
        ) : (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 z-[1000]"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom popup style overrides */}
      <style>{`
        @keyframes gps-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes photo-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .carte-tiles-dark {
          filter: brightness(0.6) saturate(0.3);
        }
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
        .photo-gps-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-control-zoom {
          display: none !important;
        }
      `}</style>
    </motion.div>
  );
};

export default ExplorationCarteTab;
