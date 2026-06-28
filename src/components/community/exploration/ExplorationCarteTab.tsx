import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { MapContainer, Polyline, Marker, Popup, useMap, useMapEvents, Circle, CircleMarker, Pane } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationBiodiversitySummary } from '@/hooks/useExplorationBiodiversitySummary';
import { useExplorationSpeciesCount } from '@/hooks/useExplorationSpeciesCount';
import { Camera, Mic, BookOpen, Leaf, Navigation, MapPin, Plus, Minus, Crosshair, X, Star, Sparkles, Move } from 'lucide-react';
import { PhotoGpsButton, PhotoGpsMarker, usePhotoGpsDrop } from './PhotoGpsDropTool';
import CreateMarcheDrawer from './CreateMarcheDrawer';
import { canCreateMarche, computeMarcheDefaults } from './createMarcheUtils';
import CadastreLayer from '@/components/cadastre/CadastreLayer';
import {
  DynamicTileLayer,
  MapStyleToggle,
  POLYLINE_COLORS,
  ARROW_COLORS,
  type MapStyle,
  FitBounds,
  ZoomControls,
  GeolocateButton,
  UserLocationMarker,
  ArrowDecorators,
  createNumberedIcon,
} from '@/components/maps';
import GpsEditOverlay from '@/components/cadastre/GpsEditOverlay';
import { useCanCurateAudio } from '@/hooks/useCanCurateAudio';
import {
  useExplorationWaypoints,
  useCreateWaypoint,
  buildRouteWithWaypoints,
} from '@/hooks/useExplorationWaypoints';
import { useExplorationById, useUpdateExplorationLoop } from '@/hooks/useExplorations';
import { WaypointMarker, WaypointCreateHandler, detectSegmentCandidates, findSegmentByEndpoints, waypointDraftIcon, type SegmentCandidate } from './WaypointMarker';
import { useChatTabSnapshot } from '@/hooks/useChatPageContext';
import { WaypointInsertConfirmDialog } from './WaypointInsertConfirmDialog';
import MapOptionsMenu from './MapOptionsMenu';
import WeatherStationsLayer from './WeatherStationsLayer';
import { useMapLayers } from '@/hooks/useMapLayers';
import 'leaflet/dist/leaflet.css';

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
  isAdmin?: boolean;
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

// createNumberedIcon, ArrowDecorators, FitBounds, ZoomControls,
// UserLocationMarker and GeolocateButton are now imported from @/components/maps
// so any improvement profite à la fois à l'onglet Carte et au drawer Espèce.

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

// Cadastre tap-to-add: intercept next map click to drop a new step
function CadastreTapCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  const map = useMap();
  useEffect(() => {
    const c = map.getContainer();
    const prev = c.style.cursor;
    c.style.cursor = 'crosshair';
    return () => { c.style.cursor = prev; };
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
  isAdmin,
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
  // Cadastre "tap-to-add" mode (click on the parcel to instantly drop a new step)
  const [isCadastreTapMode, setIsCadastreTapMode] = useState(false);

  // Waypoints (intermediate route points)
  const { data: waypoints = [] } = useExplorationWaypoints(marcheEventId);
  const { data: explorationData } = useExplorationById(explorationId || '');
  const isLoop = !!explorationData?.is_loop;
  const updateLoop = useUpdateExplorationLoop();
  const createWaypoint = useCreateWaypoint();
  const [isCreatingWaypoint, setIsCreatingWaypoint] = useState(false);
  const { layers: mapLayers, toggleLayer: toggleMapLayer, setWeatherStationsMode, setWeatherStationsRadius, activeCount: mapLayersActiveCount } = useMapLayers(explorationId);

  // Per-marche radius (override) + exploration default → résolution cascade.
  const { data: marcheRadii } = useQuery({
    queryKey: ['exploration-marche-radii', explorationId, marches.map(m => m.id).join(',')],
    queryFn: async () => {
      const ids = marches.map(m => m.id).filter(Boolean);
      if (ids.length === 0) return new Map<string, number | null>();
      const { data } = await supabase.from('marches').select('id, radius_m').in('id', ids);
      const m = new Map<string, number | null>();
      (data || []).forEach((row: any) => m.set(row.id, row.radius_m));
      return m;
    },
    enabled: marches.length > 0,
    staleTime: 60_000,
  });
  const explorationDefaultRadiusM = (explorationData as any)?.default_radius_m ?? null;
  const resolveMarcheRadiusM = useCallback((marcheId: string): number => {
    const override = marcheRadii?.get(marcheId);
    return override ?? explorationDefaultRadiusM ?? 500;
  }, [marcheRadii, explorationDefaultRadiusM]);
  const hideMarcheMarkers = mapLayers.weatherStations === 'on_only';
  const [pendingWaypoint, setPendingWaypoint] = useState<{
    lat: number;
    lng: number;
    candidates: SegmentCandidate[];
    selectedIdx: number;
  } | null>(null);
  const [hoveredCandidateIdx, setHoveredCandidateIdx] = useState<number | null>(null);
  // Manual segment-pick mode (for when no candidate matches what the user sees)
  const [pickMode, setPickMode] = useState<null | { stage: 'A' | 'B'; pickedA?: { kind: 'step' | 'waypoint'; id: string; lat: number; lng: number } }>(null);
  const showWaypoints = mapLayers.showWaypoints;
  const [showDistanceMode, setShowDistanceMode] = useState<'estimated' | 'crow'>('estimated');

  // Resolve a (kind, id) endpoint to a SegmentCandidate for a given pending waypoint.
  // When the user has picked both endpoints, we commit the waypoint immediately
  // (no re-confirmation popup) — their intent is unambiguous.
  const handlePickEndpoint = useCallback((ep: { kind: 'step' | 'waypoint'; id: string; lat: number; lng: number }) => {
    setPickMode((curr) => {
      if (!curr) return curr;
      if (!curr.pickedA) {
        toast.success('Point 1 sélectionné — cliquez sur le 2ᵉ point voisin');
        return { stage: 'B', pickedA: ep };
      }
      if (!pendingWaypoint || !marcheEventId) return null;
      const aId = curr.pickedA.id;
      const bId = ep.id;
      if (aId === bId) {
        toast.error('Choisissez 2 points différents');
        return curr;
      }
      let resolved = pendingWaypoint.candidates.find(
        (c) =>
          (c.p1.id === aId && c.p2.id === bId) ||
          (c.p1.id === bId && c.p2.id === aId),
      );
      if (!resolved) {
        const reconstructed = findSegmentByEndpoints(
          aId,
          bId,
          geoMarchesRef.current.map(m => ({ id: m.id, latitude: m.latitude!, longitude: m.longitude! })),
          waypointsRef.current,
          isLoop,
        );
        if (reconstructed) resolved = reconstructed;
      }
      if (!resolved) {
        toast.error('Ces 2 points ne sont pas voisins sur le tracé');
        return { stage: 'A', pickedA: undefined };
      }
      // Commit immediately — no popup re-opening
      createWaypoint.mutate({
        marche_event_id: marcheEventId,
        after_marche_id: resolved.after_marche_id,
        ordre: resolved.ordre,
        latitude: pendingWaypoint.lat,
        longitude: pendingWaypoint.lng,
      });
      setPendingWaypoint(null);
      setHoveredCandidateIdx(null);
      return null;
    });
  }, [pendingWaypoint, marcheEventId, createWaypoint, isLoop]);

  const userCanCreate = canCreateMarche(userLevel, isAdmin);
  const { data: canEditGps = false } = useCanCurateAudio();

  // GPS edit (Cadastre mode) state
  const [gpsEditPointId, setGpsEditPointId] = useState<string | null>(null);
  const [cadastrePreview, setCadastrePreview] = useState<{ lat: number; lng: number; geometry: any; data: any } | null>(null);
  const stepMarkerRefs = useRef<Map<string, L.Marker>>(new Map());
  const [showCreateHint, setShowCreateHint] = useState(false);
  useEffect(() => {
    if (!userCanCreate) return;
    try {
      if (localStorage.getItem('create-marche-hint-seen') === '1') return;
    } catch {}
    setShowCreateHint(true);
    const t = setTimeout(() => {
      setShowCreateHint(false);
      try { localStorage.setItem('create-marche-hint-seen', '1'); } catch {}
    }, 5000);
    return () => clearTimeout(t);
  }, [userCanCreate]);

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
  const { data: speciesCount } = useExplorationSpeciesCount(explorationId, { realtime: true });
  const unifiedTotalSpecies = speciesCount?.total ?? bioSummary?.totalSpecies ?? 0;

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
  const geoMarchesRef = useRef(geoMarches);
  useEffect(() => { geoMarchesRef.current = geoMarches; }, [geoMarches]);
  const waypointsRef = useRef(waypoints);
  useEffect(() => { waypointsRef.current = waypoints; }, [waypoints]);

  const positions: [number, number][] = useMemo(
    () => geoMarches.map(m => [m.latitude!, m.longitude!]),
    [geoMarches]
  );

  // Route + distances (with waypoints)
  const route = useMemo(
    () => buildRouteWithWaypoints(
      geoMarches.map(m => ({ id: m.id, latitude: m.latitude!, longitude: m.longitude! })),
      waypoints,
      isLoop,
    ),
    [geoMarches, waypoints, isLoop],
  );
  const totalDistance = route.crowKm;
  const estimatedDistance = route.estimatedKm;
  const polylinePositions = showWaypoints
    ? route.positions
    : (isLoop && positions.length >= 2 ? [...positions, positions[0]] : positions);

  const bioByMarche = useMemo(() => {
    const map = new Map<string, number>();
    bioSummary?.speciesByMarche?.forEach(s => map.set(s.marcheId, s.speciesCount));
    return map;
  }, [bioSummary]);

  // ── Slice "carte" pour le ChatBot contextuel ───────────────────────────────
  // Publie l'état réel de la carte visible (marches, étapes, fond, bbox)
  // pour que l'IA puisse raisonner sur la géographie sans halluciner.
  const carteSnapshot = useMemo(() => {
    if (geoMarches.length === 0) return null;
    const lats = geoMarches.map(m => m.latitude!);
    const lons = geoMarches.map(m => m.longitude!);
    const round = (n: number) => Math.round(n * 1e5) / 1e5;
    return {
      label: explorationName ? `Carte — ${explorationName}` : 'Carte de l\'exploration',
      fond: mapStyle,
      is_loop: isLoop,
      distance_oiseau_km: route.crowKm ? Math.round(route.crowKm * 10) / 10 : null,
      distance_estimee_km: route.estimatedKm ? Math.round(route.estimatedKm * 10) / 10 : null,
      bbox: {
        north: round(Math.max(...lats)),
        south: round(Math.min(...lats)),
        east: round(Math.max(...lons)),
        west: round(Math.min(...lons)),
      },
      marches: geoMarches.map(m => ({
        ordre: m.ordre,
        nom: m.nom_marche,
        ville: m.ville,
        lat: round(m.latitude!),
        lon: round(m.longitude!),
        especes_count: bioByMarche.get(m.id) ?? 0,
      })),
      etapes: waypoints.slice(0, 60).map((w: any) => ({
        etape: w.ordre,
        after_marche_id: w.after_marche_id,
        lat: round(Number(w.latitude)),
        lon: round(Number(w.longitude)),
        label: w.label ?? null,
      })),
      etapes_total: waypoints.length,
    };
  }, [geoMarches, waypoints, mapStyle, isLoop, route.crowKm, route.estimatedKm, bioByMarche, explorationName]);
  useChatTabSnapshot('carte', carteSnapshot);

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

  // Defaults for the create-marche drawer
  const marcheDefaults = useMemo(
    () => computeMarcheDefaults(marches, marcheEventDate, marcheEventLieu),
    [marches, marcheEventDate, marcheEventLieu],
  );

  const handleStartCreate = useCallback(() => {
    if (!userCanCreate || !explorationId) return;
    const lat = marcheDefaults.centerLat ?? userLocation?.[0] ?? null;
    const lng = marcheDefaults.centerLng ?? userLocation?.[1] ?? null;
    if (lat == null || lng == null) {
      toast.error('Impossible de déterminer une position de départ');
      return;
    }
    setCreatePosition({ lat, lng });
    setIsCreatingMarche(true);
    setShowDistances(false);
  }, [userCanCreate, explorationId, marcheDefaults, userLocation]);

  const handleCancelCreate = useCallback(() => {
    setIsCreatingMarche(false);
    setCreatePosition(null);
    setDrawerOpen(false);
  }, []);

  const handleConfirmCreate = useCallback(() => {
    if (!createPosition) return;
    setDrawerOpen(true);
  }, [createPosition]);

  // Cadastre tap-to-add: handle map clicks while in tap mode
  const handleCadastreTap = useCallback((lat: number, lng: number) => {
    if (!userCanCreate || !explorationId) return;
    setCreatePosition({ lat, lng });
    setIsCreatingMarche(true);
    setIsCadastreTapMode(false);
    setShowDistances(false);
  }, [userCanCreate, explorationId]);


  // Auto-exit tap mode when leaving cadastre view, and listen Escape to cancel
  useEffect(() => {
    if (mapStyle !== 'cadastre' && isCadastreTapMode) setIsCadastreTapMode(false);
  }, [mapStyle, isCadastreTapMode]);
  useEffect(() => {
    if (!isCadastreTapMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsCadastreTapMode(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCadastreTapMode]);

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
        <ZoomControls mapStyle={mapStyle} />
        <FitBounds positions={positions} />

        {/* Route polyline */}
        {polylinePositions.length > 1 && (
          <>
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: POLYLINE_COLORS[mapStyle],
                weight: 3,
                opacity: mapStyle === 'satellite' ? 0.9 : 0.6,
                dashArray: '8, 12',
                lineCap: 'round',
              }}
            />
            <ArrowDecorators positions={polylinePositions} color={ARROW_COLORS[mapStyle]} />
          </>
        )}

        {/* Waypoint click handler (intermediate point creation mode) */}
        <WaypointCreateHandler
          active={isCreatingWaypoint}
          onPick={(lat, lng) => {
            const candidates = detectSegmentCandidates(
              lat,
              lng,
              geoMarches.map(m => ({ id: m.id, latitude: m.latitude!, longitude: m.longitude! })),
              waypoints,
              Number.POSITIVE_INFINITY,
              isLoop,
            );
            if (!candidates.length || !marcheEventId) {
              toast.error('Impossible de détecter un segment');
              return;
            }
            setPendingWaypoint({ lat, lng, candidates, selectedIdx: 0 });
            setIsCreatingWaypoint(false);
          }}
        />

        {/* Draft waypoint marker + preview polylines while confirming */}
        {pendingWaypoint && (
          <>
            <Marker
              position={[pendingWaypoint.lat, pendingWaypoint.lng]}
              icon={waypointDraftIcon}
              interactive={false}
            />
            {(() => {
              // Show hovered candidate if any, else the selected one
              const idx = hoveredCandidateIdx ?? pendingWaypoint.selectedIdx;
              const c = pendingWaypoint.candidates[idx];
              if (!c) return null;
              return (
                <>
                  <Polyline
                    positions={[[pendingWaypoint.lat, pendingWaypoint.lng], [c.p1.latitude, c.p1.longitude]]}
                    pathOptions={{ color: '#d97706', weight: 2, opacity: 0.75, dashArray: '4, 6' }}
                  />
                  <Polyline
                    positions={[[pendingWaypoint.lat, pendingWaypoint.lng], [c.p2.latitude, c.p2.longitude]]}
                    pathOptions={{ color: '#d97706', weight: 2, opacity: 0.75, dashArray: '4, 6' }}
                  />
                  {/* Halos around the 2 endpoints — pulses on hover */}
                  <CircleMarker
                    center={[c.p1.latitude, c.p1.longitude]}
                    radius={hoveredCandidateIdx !== null ? 18 : 12}
                    pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.9, fillColor: '#fde68a', fillOpacity: 0.25 }}
                  />
                  <CircleMarker
                    center={[c.p2.latitude, c.p2.longitude]}
                    radius={hoveredCandidateIdx !== null ? 18 : 12}
                    pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.9, fillColor: '#fde68a', fillOpacity: 0.25 }}
                  />
                </>
              );
            })()}
          </>
        )}

        {/* Manual pick-mode: interactive cyan halos that capture clicks for endpoint selection */}
        {pickMode && pendingWaypoint && (
          <>
            {geoMarches.map((m) => (
              <CircleMarker
                key={`pick-step-${m.id}`}
                center={[m.latitude!, m.longitude!]}
                radius={20}
                pathOptions={{ color: '#06b6d4', weight: 3, opacity: 0.9, fillColor: '#67e8f9', fillOpacity: 0.3, interactive: true, bubblingMouseEvents: false }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e as any);
                    handlePickEndpoint({ kind: 'step', id: m.id, lat: m.latitude!, lng: m.longitude! });
                  },
                }}
              />
            ))}
            {waypoints.map((wp) => (
              <CircleMarker
                key={`pick-wp-${wp.id}`}
                center={[wp.latitude, wp.longitude]}
                radius={16}
                pathOptions={{ color: '#06b6d4', weight: 3, opacity: 0.9, fillColor: '#67e8f9', fillOpacity: 0.3, interactive: true, bubblingMouseEvents: false }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e as any);
                    handlePickEndpoint({ kind: 'waypoint', id: wp.id, lat: wp.latitude, lng: wp.longitude });
                  },
                }}
              />
            ))}
            {/* Highlight the first picked point (decorative, on top) */}
            {pickMode.pickedA && (
              <CircleMarker
                center={[pickMode.pickedA.lat, pickMode.pickedA.lng]}
                radius={24}
                pathOptions={{ color: '#0e7490', weight: 4, opacity: 1, fillColor: '#06b6d4', fillOpacity: 0.45, interactive: false }}
              />
            )}
          </>
        )}

        {/* Render waypoints */}
        {showWaypoints && waypoints.map((wp) => {
          const idxA = geoMarches.findIndex(m => m.id === wp.after_marche_id);
          const segLabel = idxA >= 0 && idxA < geoMarches.length - 1
            ? `Entre étape ${idxA + 1} et ${idxA + 2}`
            : undefined;
          return (
            <WaypointMarker
              key={wp.id}
              waypoint={wp}
              canEdit={userCanCreate}
              segmentLabel={segLabel}
              pickModeOnClick={pickMode ? handlePickEndpoint : undefined}
            />
          );
        })}

        {/* Radius circles per marche (resolved: marche.radius_m → exploration.default_radius_m → 500m) */}
        {mapLayers.showObservationRadii && !hideMarcheMarkers && geoMarches.map((marche) => {
          const radiusM = resolveMarcheRadiusM(marche.id);
          const isOverride = (marcheRadii?.get(marche.id) ?? null) != null;
          return (
            <Circle
              key={`radius-${marche.id}`}
              center={[marche.latitude!, marche.longitude!]}
              radius={radiusM}
              pathOptions={{
                color: isOverride ? '#10b981' : '#64748b',
                weight: 1,
                opacity: 0.55,
                fillColor: isOverride ? '#10b981' : '#94a3b8',
                fillOpacity: 0.08,
                dashArray: isOverride ? undefined : '4 4',
              }}
              interactive={false}
            />
          );
        })}

        {/* Numbered markers with progressive reveal — pane dédié sous le popup cadastre */}
        <Pane name="marche-steps" style={{ zIndex: 590 }} />
        {!hideMarcheMarkers && geoMarches.map((marche, index) => {
          if (index >= visibleMarkers) return null;
          const stats = contribStats?.[marche.id];
          const speciesCount = bioByMarche.get(marche.id) || 0;
          const totalContrib = (stats?.photos || 0) + (stats?.sons || 0) + (stats?.textes || 0) + speciesCount;

          return (
            <Marker
              key={marche.id}
              position={[marche.latitude!, marche.longitude!]}
              pane="marche-steps"
              icon={createNumberedIcon(index + 1, activeMarker === index, totalContrib, mapStyle === 'cadastre')}
              ref={(ref) => {
                if (ref) stepMarkerRefs.current.set(marche.id, ref as unknown as L.Marker);
                else stepMarkerRefs.current.delete(marche.id);
              }}
              eventHandlers={{
                click: (e) => {
                  if (pickMode) {
                    (e.target as L.Marker).closePopup();
                    handlePickEndpoint({ kind: 'step', id: marche.id, lat: marche.latitude!, lng: marche.longitude! });
                    return;
                  }
                  setActiveMarker(index);
                },
              }}
            >
              {!pickMode && (
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

                  {mapStyle === 'cadastre' && canEditGps && (
                    <button
                      onClick={() => {
                        stepMarkerRefs.current.get(marche.id)?.closePopup();
                        setGpsEditPointId(marche.id);
                      }}
                      className="w-full mt-1.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-200 text-[11px] font-medium hover:bg-blue-500/25 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Move className="w-3 h-3" />
                      Repositionner (aperçu)
                    </button>
                  )}
                </div>
              </Popup>
              )}
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

        {/* Cadastre tap-to-add: capture next click as new step */}
        {isCadastreTapMode && mapStyle === 'cadastre' && !isCreatingMarche && (
          <CadastreTapCapture onPick={handleCadastreTap} />
        )}

        {/* Weather stations layer */}
        {mapLayers.weatherStations !== 'off' && (
          <WeatherStationsLayer
            marches={geoMarches.map(m => ({
              id: m.id,
              latitude: m.latitude!,
              longitude: m.longitude!,
              nom_marche: m.nom_marche,
              ville: m.ville,
            }))}
            radiusKm={mapLayers.weatherStationsRadius}
          />
        )}

        {/* Cadastre overlay (LEXICON parcels for each step) */}
        {mapStyle === 'cadastre' && (
          <CadastreLayer
            points={geoMarches.map(m => ({
              id: m.id,
              lat: m.latitude!,
              lng: m.longitude!,
              label: m.nom_marche || undefined,
            }))}
            enabled={mapStyle === 'cadastre'}
            previewGeometry={cadastrePreview?.geometry}
            previewData={cadastrePreview?.data}
            tapMode={isCadastreTapMode && !isCreatingMarche}
            onTapLatLng={handleCadastreTap}
          />
        )}

        {/* GPS edit overlay (Cadastre mode, curators only) */}
        {mapStyle === 'cadastre' && canEditGps && gpsEditPointId && (() => {
          const target = geoMarches.find(m => m.id === gpsEditPointId);
          if (!target) return null;
          return (
            <GpsEditOverlay
              initialLat={target.latitude!}
              initialLng={target.longitude!}
              onClose={() => { setGpsEditPointId(null); setCadastrePreview(null); }}
              onPreview={setCadastrePreview}
              marcheId={target.id}
              canPersist={canEditGps}
            />
          );
        })()}
      </MapContainer>

      {/* Confirm dialog for waypoint insertion */}
      {pendingWaypoint && (() => {
        // Display top 4 candidates, plus the selected one if it's outside that window
        const top = pendingWaypoint.candidates.slice(0, 4);
        const sel = pendingWaypoint.candidates[pendingWaypoint.selectedIdx];
        const display = sel && !top.includes(sel) ? [...top, sel] : top;
        const dialogSelectedIdx = sel ? display.indexOf(sel) : 0;
        return (
          <WaypointInsertConfirmDialog
            open={!!pendingWaypoint && !pickMode}
            candidates={display}
            selectedIdx={dialogSelectedIdx}
            onSelect={(idx) => {
              const realIdx = pendingWaypoint.candidates.indexOf(display[idx]);
              if (realIdx >= 0) setPendingWaypoint((p) => (p ? { ...p, selectedIdx: realIdx } : p));
            }}
            onHover={(idx) => {
              if (idx === null) { setHoveredCandidateIdx(null); return; }
              const realIdx = pendingWaypoint.candidates.indexOf(display[idx]);
              setHoveredCandidateIdx(realIdx >= 0 ? realIdx : null);
            }}
            onPickOnMap={() => { setPickMode({ stage: 'A' }); setHoveredCandidateIdx(null); }}
            buildLabel={(c) => {
              const stepA = c.afterMarcheIndex + 1;
              const stepB = c.afterMarcheIndex + 2;
              if (c.totalInSegment === 0) {
                return `Entre étape ${stepA} et étape ${stepB}`;
              }
              const left = c.kInSegment === 0
                ? `étape ${stepA}`
                : `point intermédiaire ${c.kInSegment}/${c.totalInSegment}`;
              const right = c.kInSegment === c.totalInSegment
                ? `étape ${stepB}`
                : `point intermédiaire ${c.kInSegment + 1}/${c.totalInSegment}`;
              return `Entre ${left} et ${right}`;
            }}
            onCancel={() => { setPendingWaypoint(null); setPickMode(null); setHoveredCandidateIdx(null); }}
            onConfirm={() => {
              if (!marcheEventId || !pendingWaypoint) return;
              const c = pendingWaypoint.candidates[pendingWaypoint.selectedIdx];
              createWaypoint.mutate({
                marche_event_id: marcheEventId,
                after_marche_id: c.after_marche_id,
                ordre: c.ordre,
                latitude: pendingWaypoint.lat,
                longitude: pendingWaypoint.lng,
              });
              setPendingWaypoint(null);
              setPickMode(null);
              setHoveredCandidateIdx(null);
            }}
          />
        );
      })()}

      {/* Pick-mode floating banner */}
      {pickMode && pendingWaypoint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] bg-cyan-900/95 text-white text-sm px-4 py-2 rounded-full shadow-xl border border-cyan-400/40 backdrop-blur flex items-center gap-3">
          <span>
            {pickMode.pickedA
              ? 'Cliquez sur le 2ᵉ point voisin — l\'insertion sera validée automatiquement'
              : 'Cliquez sur le 1ᵉʳ point voisin (étape ou point intermédiaire)'}
          </span>
          <button
            onClick={() => setPickMode(null)}
            className="text-cyan-200 hover:text-white text-xs underline"
          >
            Annuler
          </button>
        </div>
      )}


      {/* Map style toggle */}
      <MapStyleToggle mapStyle={mapStyle} onChange={setMapStyle} />

      {/* Cadastre tap-to-add: pill button shown only in Cadastre view for curators */}
      {mapStyle === 'cadastre' && userCanCreate && explorationId && !isCreatingMarche && (
        <button
          onClick={() => setIsCadastreTapMode(v => !v)}
          className={`absolute top-16 right-4 z-[1000] flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-xl border transition-all ${
            isCadastreTapMode
              ? 'bg-amber-500/90 hover:bg-amber-500 border-amber-300/50 text-white animate-pulse'
              : 'bg-emerald-700/90 hover:bg-emerald-700 border-emerald-400/40 text-white'
          }`}
          title={isCadastreTapMode ? 'Échap pour annuler' : 'Cliquer sur la parcelle pour poser un nouveau point'}
        >
          {isCadastreTapMode ? (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span>Cliquez sur la parcelle… (Échap)</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un point</span>
            </>
          )}
        </button>
      )}

      {/* Create-marche top banner (Ambassadeur / Sentinelle only, in create mode) */}
      <AnimatePresence>
        {isCreatingMarche && createPosition && !drawerOpen && (

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="absolute top-4 left-4 right-[7.5rem] z-[1000]"
          >
            <div className="bg-zinc-950/95 backdrop-blur-xl rounded-xl border border-amber-400/60 px-3 py-2.5 shadow-2xl shadow-black/50 ring-1 ring-black/30">
              <div className="flex items-center gap-2 text-amber-200 text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span className="truncate">Glissez le repère, puis validez</span>
              </div>
              <div className="mt-1 font-mono text-[10px] text-amber-100/90 tabular-nums">
                {createPosition.lat.toFixed(5)}, {createPosition.lng.toFixed(5)}
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={handleCancelCreate}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmCreate}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold transition-colors shadow-sm"
                >
                  Valider
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map options menu (regroupe création + couches d'affichage) */}
      {explorationId && !isCreatingMarche && (
        <div className="absolute bottom-20 left-4 z-[1000] flex flex-col items-start gap-2">
          <AnimatePresence>
            {userCanCreate && showCreateHint && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="bg-black/75 backdrop-blur-xl rounded-lg border border-amber-400/30 px-2.5 py-1.5 text-[10px] text-amber-100 shadow-md max-w-[180px]"
              >
                Vous pouvez ajouter une marche ici
              </motion.div>
            )}
            {isCreatingWaypoint && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="bg-black/75 backdrop-blur-xl rounded-lg border border-amber-400/40 px-2.5 py-1.5 text-[10px] text-amber-100 shadow-md max-w-[200px]"
              >
                Cliquez sur la carte pour placer le point intermédiaire
              </motion.div>
            )}
          </AnimatePresence>
          <MapOptionsMenu
            userCanCreate={userCanCreate}
            marcheEventId={marcheEventId}
            explorationId={explorationId}
            isLoop={isLoop}
            isLoopPending={updateLoop.isPending}
            isCreatingWaypoint={isCreatingWaypoint}
            layers={mapLayers}
            activeBadgeCount={(isLoop ? 1 : 0) + mapLayersActiveCount}
            waypointsCount={waypoints.length}
            onToggleLoop={() => updateLoop.mutate({ id: explorationId, is_loop: !isLoop })}
            onStartCreateMarche={handleStartCreate}
            onToggleCreateWaypoint={() => setIsCreatingWaypoint(v => !v)}
            onToggleLayer={toggleMapLayer}
            onSetWeatherStationsMode={setWeatherStationsMode}
            onSetWeatherStationsRadius={setWeatherStationsRadius}
          />
        </div>
      )}

      {/* Photo GPS button */}
      {marcheEventId && !isCreatingMarche && (
        <div className="absolute bottom-20 right-[7.5rem] z-[1000]">
          <PhotoGpsButton onClick={triggerFileInput} />
        </div>
      )}
      {FileInput}

      {/* Geolocate button */}
      {!isCreatingMarche && (
        <GeolocateButton
          active={!!userLocation}
          loading={geoLoading}
          isTracking={isTracking}
          onClick={handleGeolocate}
          onLongPress={handleLongPress}
        />
      )}

      {/* Bottom panel: tracking banner, distance panel, or stats bar */}
      <AnimatePresence mode="wait">
        {isCreatingMarche ? null : isTracking && nearestStep ? (
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
                  <button
                    onClick={() => setShowDistanceMode(m => m === 'estimated' ? 'crow' : 'estimated')}
                    className="text-white/60 hover:text-white/90 tabular-nums"
                    title="Basculer vol d'oiseau / estimé"
                  >
                    {showDistanceMode === 'estimated' && estimatedDistance > totalDistance ? (
                      <>~{estimatedDistance < 1 ? `${Math.round(estimatedDistance * 1000)} m` : `${estimatedDistance.toFixed(1)} km`} estimés</>
                    ) : (
                      <>~{totalDistance < 1 ? `${Math.round(totalDistance * 1000)} m` : `${totalDistance.toFixed(1)} km`} vol d'oiseau</>
                    )}
                  </button>
                )}
                {unifiedTotalSpecies > 0 && (
                  <div className="flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">{unifiedTotalSpecies} espèces</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create-marche drawer */}
      {explorationId && (
        <CreateMarcheDrawer
          open={drawerOpen}
          onOpenChange={(o) => {
            setDrawerOpen(o);
            if (!o && isCreatingMarche) {
              // Closing drawer without creating: stay in mode so user can re-adjust
            }
          }}
          position={createPosition}
          defaultVille={marcheDefaults.defaultVille}
          defaultDate={marcheDefaults.defaultDate}
          explorationId={explorationId}
          explorationName={explorationName}
          marcheEventTitle={marcheEventTitle}
          onCreated={handleCancelCreate}
        />
      )}

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
