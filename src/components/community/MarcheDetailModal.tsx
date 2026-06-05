import React, { useState, useEffect, useRef } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Headphones, BookOpen, PenLine, Leaf, MapPin, Music, ChevronLeft, ChevronRight, ChevronDown, Check, Camera, FileText, Globe, Users, User, ExternalLink, Video, Plus, Grid3X3, LayoutList, Crosshair, Map as MapIcon, List } from 'lucide-react';
import LireDescriptionsTab from './exploration/LireDescriptionsTab';
import { usePhotoGpsCheck, formatDistance, distanceColor, distanceEmoji, type PhotoGpsResult } from '@/hooks/usePhotoGpsCheck';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import MediaLightbox, { type LightboxItem } from './contributions/MediaLightbox';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import { useIsCurator } from '@/hooks/useExplorationCurations';
import { motion, AnimatePresence } from 'framer-motion';
import GpsMapView from './contributions/GpsMapView';
import { toast } from 'sonner';
import { classifyBatch } from '@/utils/fileClassifier';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { createSlug } from '@/utils/slugGenerator';
import SpeciesExplorer from '@/components/biodiversity/SpeciesExplorer';
import RadiusSelector from '@/components/biodiversity/RadiusSelector';
import { isSpeciesWithinRadius } from '@/utils/speciesRadiusFilter';
import FileUploadZone from './contributions/FileUploadZone';
import ContributionItem from './contributions/ContributionItem';
import SortToggle from './contributions/SortToggle';
import MediaSkeletonGrid from './contributions/MediaSkeletonGrid';
import {
  useMarcheurMedias, useUploadMedias, useAddExternalVideo,
  useMarcheurAudio, useUploadAudio,
  useMarcheurTextes, useCreateTexte,
  useUpdateContribution, useDeleteContribution,
  useMarcheurStats, useReorderContributions,
} from '@/hooks/useMarcheurContributions';
import DraggableContributionGrid from './contributions/DraggableContributionGrid';
import MarcheurAudioPanel from './audio/MarcheurAudioPanel';

interface MarcheDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  marcheEventId: string;
  eventTitle: string;
  eventDate: string;
  eventLieu: string | null;
}

type TabKey = 'voir' | 'ecouter' | 'lire' | 'ecrire' | 'vivant';

const tabs: { key: TabKey; label: string; icon: typeof Eye }[] = [
  { key: 'voir', label: 'Voir', icon: Eye },
  { key: 'ecouter', label: 'Écouter', icon: Headphones },
  { key: 'lire', label: 'Lire', icon: BookOpen },
  { key: 'ecrire', label: 'Écrire', icon: PenLine },
  { key: 'vivant', label: 'Vivant', icon: Leaf },
];

const TEXTE_TYPES = [
  { value: 'texte-libre', label: 'Texte libre' },
  { value: 'haiku', label: 'Haïku' },
  { value: 'haibun', label: 'Haïbun' },
  { value: 'senryu', label: 'Senryū' },
  { value: 'poeme', label: 'Poème' },
  { value: 'fable', label: 'Fable' },
  { value: 'manifeste', label: 'Manifeste' },
];

const EmptyState: React.FC<{ message: string; sub?: string }> = ({ message, sub }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <p className="text-emerald-200/40 text-xs">{message}</p>
    {sub && <p className="text-emerald-200/25 text-[10px] mt-1">{sub}</p>}
  </div>
);

// ─── Voir Tab (photos + vidéos + user contributions) ───
export const VoirTab: React.FC<{ marcheId: string; userId: string; marcheEventId: string; activeMarcheId?: string }> = ({ marcheId, userId, marcheEventId, activeMarcheId }) => {
  const { trackActivity } = useActivityTracker();
  const [sort, setSort] = useState<'desc' | 'asc'>('asc');
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showGpsDialog, setShowGpsDialog] = useState(false);
  const [gpsDialogTab, setGpsDialogTab] = useState<'list' | 'map'>('list');
  const { results: gpsResults, marcheCoords, isChecking, checkPhotos, reset: resetGps } = usePhotoGpsCheck(marcheId);
  const [viewMode, setViewMode] = useState<'immersion' | 'fiche'>(() => {
    const stored = localStorage.getItem('voir-tab-view');
    return stored === 'immersion' || stored === 'fiche' ? stored : 'immersion';
  });

  useEffect(() => {
    setViewMode('immersion');
    localStorage.setItem('voir-tab-view', 'immersion');
  }, [marcheEventId]);

  // Admin photos from the marche
  const { data: adminPhotos, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['marche-detail-photos', marcheId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_photos')
        .select('id, url_supabase, titre')
        .eq('marche_id', marcheId)
        .order('ordre')
        .limit(20);
      return data || [];
    },
    enabled: !!marcheId,
  });

  // Resolve exploration_id (for curator check + marcheurs list used by attribution sheet)
  const { data: explorationId } = useQuery({
    queryKey: ['marche-event-exploration', marcheEventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_events')
        .select('exploration_id')
        .eq('id', marcheEventId)
        .single();
      return data?.exploration_id ?? null;
    },
    enabled: !!marcheEventId,
  });

  const { data: isCurator } = useIsCurator(explorationId ?? undefined);
  const { data: explorationMarcheurs = [] } = useExplorationMarcheurs(explorationId ?? undefined);

  // User contributions
  const { data: userMedias, isLoading: isLoadingUser } = useMarcheurMedias(marcheEventId, userId, sort, activeMarcheId);
  const uploadMedias = useUploadMedias(userId);
  const addExtVideo = useAddExternalVideo(userId);
  const updateContrib = useUpdateContribution();
  const deleteContrib = useDeleteContribution();
  const reorderContribs = useReorderContributions();

  // Map exploration_marcheurs.id → { user_id, fullName, avatar_url, couleur }
  // (the public hook ExplorationMarcheur omits user_id, so we fetch it directly)
  const { data: marcheurAttribMap } = useQuery({
    queryKey: ['marcheur-attrib-map', explorationId],
    queryFn: async () => {
      if (!explorationId) return new Map<string, { userId: string | null; fullName: string; avatarUrl: string | null; couleur: string | null }>();
      const { data } = await supabase
        .from('exploration_marcheurs')
        .select('id, user_id, prenom, nom, avatar_url, couleur')
        .eq('exploration_id', explorationId);
      const map = new Map<string, { userId: string | null; fullName: string; avatarUrl: string | null; couleur: string | null }>();
      (data || []).forEach((m: any) => {
        map.set(m.id, {
          userId: m.user_id ?? null,
          fullName: `${m.prenom ?? ''} ${m.nom ?? ''}`.trim(),
          avatarUrl: m.avatar_url ?? null,
          couleur: m.couleur ?? null,
        });
      });
      return map;
    },
    enabled: !!explorationId,
  });

  // Compute the effective author for each media (real photographer, not uploader)
  const allMedias = userMedias || [];
  const effectiveAuthor = (m: any): { userId: string | null; marcheurId: string | null; fullName: string | null; avatarUrl: string | null; couleur: string | null } => {
    const attribId = m.attributed_marcheur_id ?? null;
    if (attribId && marcheurAttribMap?.has(attribId)) {
      const info = marcheurAttribMap.get(attribId)!;
      return { userId: info.userId, marcheurId: attribId, fullName: info.fullName || null, avatarUrl: info.avatarUrl, couleur: info.couleur };
    }
    return { userId: m.user_id ?? null, marcheurId: null, fullName: null, avatarUrl: null, couleur: null };
  };

  // Bucket 1 — Mes contributions: media whose effective author is me
  const myMedias = allMedias.filter(m => effectiveAuthor(m).userId === userId);
  // Bucket 2 — Crédités à d'autres marcheurs: attributed to someone else (regardless of who uploaded)
  const creditedToOthers = allMedias.filter(m => {
    const a = effectiveAuthor(m);
    return a.marcheurId && a.userId !== userId;
  });
  // Bucket 3 — Des marcheurs: uploaded by others, not attributed to me, public
  const othersMedias = allMedias.filter(m => {
    const a = effectiveAuthor(m);
    return a.marcheurId === null && m.user_id !== userId && m.is_public;
  });

  // Group bucket 2 by attributed marcheur
  const creditedGroups = React.useMemo(() => {
    const groups = new Map<string, { marcheurId: string; fullName: string; avatarUrl: string | null; couleur: string | null; medias: typeof allMedias }>();
    creditedToOthers.forEach(m => {
      const a = effectiveAuthor(m);
      if (!a.marcheurId) return;
      if (!groups.has(a.marcheurId)) {
        groups.set(a.marcheurId, {
          marcheurId: a.marcheurId,
          fullName: a.fullName || 'Marcheur',
          avatarUrl: a.avatarUrl,
          couleur: a.couleur,
          medias: [],
        });
      }
      groups.get(a.marcheurId)!.medias.push(m);
    });
    return Array.from(groups.values());
  }, [creditedToOthers, marcheurAttribMap]);

  // Resolve uploader names (for the attribution credit chip in lightbox)
  const uploaderIds = React.useMemo(
    () => Array.from(new Set(allMedias.map(m => m.user_id))),
    [allMedias],
  );
  const { data: uploaderProfiles = [] } = useQuery({
    queryKey: ['marcheur-medias-uploaders', uploaderIds.sort().join(',')],
    queryFn: async () => {
      if (!uploaderIds.length) return [];
      const { data } = await supabase
        .from('community_profiles')
        .select('user_id, prenom, nom, avatar_url')
        .in('user_id', uploaderIds);
      return data || [];
    },
    enabled: uploaderIds.length > 0,
  });
  const uploaderInfoById = React.useMemo(() => {
    const map = new Map<string, { fullName: string; avatarUrl: string | null }>();
    uploaderProfiles.forEach((p: any) => {
      const full = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
      map.set(p.user_id, { fullName: full || 'Marcheur', avatarUrl: p.avatar_url ?? null });
    });
    return map;
  }, [uploaderProfiles]);
  const uploaderNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    uploaderInfoById.forEach((info, id) => {
      if (info.fullName) map.set(id, info.fullName);
    });
    return map;
  }, [uploaderInfoById]);

  // Group "Des marcheurs" by uploader
  const othersGroups = React.useMemo(() => {
    const groups = new Map<string, { userId: string; fullName: string; avatarUrl: string | null; medias: typeof allMedias }>();
    othersMedias.forEach(m => {
      const info = uploaderInfoById.get(m.user_id);
      if (!groups.has(m.user_id)) {
        groups.set(m.user_id, {
          userId: m.user_id,
          fullName: info?.fullName || 'Marcheur',
          avatarUrl: info?.avatarUrl ?? null,
          medias: [],
        });
      }
      groups.get(m.user_id)!.medias.push(m);
    });
    return Array.from(groups.values());
  }, [othersMedias, uploaderInfoById]);

  // Build unified lightbox items array (order MUST match render order: admin → mine → credited groups → others)
  const lightboxItems: LightboxItem[] = React.useMemo(() => {
    const items: LightboxItem[] = [];
    (adminPhotos || []).forEach(p => items.push({
      url: p.url_supabase, type: 'photo', titre: p.titre, isPublic: true, isOwner: false,
    }));
    const pushMedia = (m: any, isOwner: boolean) => {
      const url = m.url_fichier || m.external_url;
      if (!url) return;
      items.push({
        url, type: m.type_media, titre: m.titre,
        isPublic: isOwner ? m.is_public : true,
        isOwner, createdAt: m.created_at, id: m.id, source: 'media',
        attributedMarcheurId: (m as any).attributed_marcheur_id ?? null,
        uploaderName: uploaderNameById.get(m.user_id) ?? null,
        metadata: (m as any).metadata ?? null,
        sizeBytes: (m as any).taille_octets ?? null,
      });
    };
    myMedias.forEach(m => pushMedia(m, true));
    creditedGroups.forEach(g => g.medias.forEach(m => pushMedia(m, false)));
    othersGroups.forEach(g => g.medias.forEach(m => pushMedia(m, false)));
    return items;
  }, [adminPhotos, myMedias, creditedGroups, othersMedias, uploaderNameById]);

  // Offsets for lightbox indexing
  const adminCount = adminPhotos?.length || 0;
  const myCount = myMedias.length;
  const creditedCount = creditedGroups.reduce((sum, g) => sum + g.medias.length, 0);

  // Build GPS distance map for fiche mode
  const gpsMap = React.useMemo(() => {
    if (!gpsResults) return new Map<string, PhotoGpsResult>();
    return new Map(gpsResults.map(r => [r.photoId, r]));
  }, [gpsResults]);

  const getGpsDistance = (id: string) => {
    const r = gpsMap.get(id);
    if (!r) return null;
    return { distanceM: r.distanceM, hasGps: r.hasGps, gpsLat: r.gpsPhoto?.lat, gpsLng: r.gpsPhoto?.lng };
  };

  return (
    <div className="space-y-4">
      {/* GPS Results Dialog */}
      {showGpsDialog && (
        <Dialog open={showGpsDialog} onOpenChange={setShowGpsDialog}>
          <DialogContent className="bg-[#0a1a0f] border-emerald-500/20 max-w-sm max-h-[80vh] overflow-hidden flex flex-col p-0">
            <div className="p-4 pb-2 space-y-2">
              <DialogHeader>
                <DialogTitle className="text-white text-sm font-semibold flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  Cohérence GPS
                </DialogTitle>
              </DialogHeader>
              {marcheCoords && (
                <a href={`https://maps.google.com/?q=${marcheCoords.lat},${marcheCoords.lng}`} target="_blank" rel="noopener noreferrer"
                  className="text-emerald-300/50 text-[10px] hover:underline flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  Point marche: {marcheCoords.lat.toFixed(4)}, {marcheCoords.lng.toFixed(4)}
                </a>
              )}
              {/* Tab toggle Liste / Carte */}
              <div className="flex rounded-lg overflow-hidden border border-white/10 w-fit">
                <button
                  onClick={() => setGpsDialogTab('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-all ${
                    gpsDialogTab === 'list'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-white/40 hover:bg-white/5'
                  }`}
                >
                  <List className="w-3 h-3" />
                  Liste
                </button>
                <button
                  onClick={() => setGpsDialogTab('map')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-all ${
                    gpsDialogTab === 'map'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-white/40 hover:bg-white/5'
                  }`}
                >
                  <MapIcon className="w-3 h-3" />
                  Carte
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {isChecking && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  <span className="text-emerald-200/40 text-xs ml-2">Extraction EXIF…</span>
                </div>
              )}

              {!isChecking && gpsDialogTab === 'list' && (
                <div className="space-y-2">
                  {gpsResults && gpsResults.length === 0 && (
                    <p className="text-emerald-200/40 text-xs text-center py-4">Aucune photo à vérifier</p>
                  )}
                  {gpsResults?.map(r => (
                    <div key={r.photoId} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400/50 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-white text-[11px] font-medium truncate">{r.nom}</p>
                        {r.hasGps && r.distanceM !== null ? (
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className={distanceColor(r.distanceM)}>
                              {distanceEmoji(r.distanceM)} {formatDistance(r.distanceM)}
                            </span>
                            <a href={`https://maps.google.com/?q=${r.gpsPhoto!.lat},${r.gpsPhoto!.lng}`} target="_blank" rel="noopener noreferrer"
                              className="text-blue-400/60 hover:underline">📍photo</a>
                            {marcheCoords && (
                              <a href={`https://maps.google.com/?q=${marcheCoords.lat},${marcheCoords.lng}`} target="_blank" rel="noopener noreferrer"
                                className="text-emerald-400/60 hover:underline">📍marche</a>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/30 text-[10px]">❌ Pas de GPS</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isChecking && gpsDialogTab === 'map' && gpsResults && (
                <GpsMapView results={gpsResults} marcheCoords={marcheCoords} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {lightboxIndex !== null && (
        <MediaLightbox
          items={lightboxItems}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          canReattribute={!!isCurator}
          marcheurs={explorationMarcheurs}
          explorationId={explorationId ?? undefined}
        />
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
        <div className="flex-1" />
        {/* View mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10 dark:border-white/10 border-stone-300/60">
          <button
            onClick={() => { setViewMode('immersion'); localStorage.setItem('voir-tab-view', 'immersion'); }}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-all ${
              viewMode === 'immersion'
                ? 'bg-emerald-500/20 text-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'text-foreground/50 hover:bg-white/5 dark:text-white/40 dark:hover:bg-white/5'
            }`}
          >
            <Grid3X3 className="w-3 h-3" />
            Immersion
          </button>
          <button
            onClick={() => { setViewMode('fiche'); localStorage.setItem('voir-tab-view', 'fiche'); }}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-all ${
              viewMode === 'fiche'
                ? 'bg-emerald-500/20 text-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'text-foreground/50 hover:bg-white/5 dark:text-white/40 dark:hover:bg-white/5'
            }`}
          >
            <LayoutList className="w-3 h-3" />
            Fiche
          </button>
        </div>
        {/* GPS check button - fiche mode only */}
        {viewMode === 'fiche' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    const allPhotos: { id: string; nom: string; url: string; storedGps?: { latitude: number; longitude: number } | null }[] = [];
                    (adminPhotos || []).forEach(p => allPhotos.push({ id: p.id, nom: p.titre || 'Photo exploration', url: p.url_supabase }));
                    myMedias.filter(m => m.type_media === 'photo' && (m.url_fichier || m.external_url)).forEach(m => {
                      const meta = (m as any).metadata;
                      allPhotos.push({ id: m.id, nom: m.titre || 'Ma photo', url: (m.url_fichier || m.external_url)!, storedGps: meta?.gps || null });
                    });
                    othersMedias.filter(m => m.type_media === 'photo' && (m.url_fichier || m.external_url)).forEach(m => {
                      const meta = (m as any).metadata;
                      allPhotos.push({ id: m.id, nom: m.titre || 'Photo marcheur', url: (m.url_fichier || m.external_url)!, storedGps: meta?.gps || null });
                    });
                    checkPhotos(allPhotos);
                    setShowGpsDialog(true);
                  }}
                  disabled={isChecking}
                  className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors flex items-center gap-1"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span className="text-[9px] font-medium">GPS</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">Vérifier GPS</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <SortToggle sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>

      {/* Skeleton loading state */}
      {(isLoadingAdmin || isLoadingUser) && !adminPhotos && !userMedias && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <MediaSkeletonGrid count={6} mode={viewMode} />
        </motion.div>
      )}

      {showUpload && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
          <FileUploadZone
            accept="image/*,video/*,image/heic,image/heif,.heic,.heif,.HEIC,.HEIF,.mov,.mp4"
            label="Photos & vidéos"
            icon={<Camera className="w-6 h-6 text-emerald-400/60" />}
            isUploading={uploadMedias.isPending}
            onFilesSelected={(files, isPublic) => {
              const { photos, videos, unknown } = classifyBatch(files);
              if (unknown.length) {
                toast.error(
                  `Format non supporté : ${unknown.map(f => f.name).join(', ')}`
                );
              }
              if (!photos.length && !videos.length) return;
              const total = photos.length + videos.length;
              toast.info(
                `Préparation de ${total} fichier${total > 1 ? 's' : ''}…`
              );
              if (photos.length) {
                uploadMedias.mutate({ files: photos, marcheEventId, isPublic, typeMedia: 'photo', marcheId: activeMarcheId });
                trackActivity(userId, 'media_upload', 'photo', { marcheEventId, metadata: { count: photos.length } });
              }
              if (videos.length) {
                uploadMedias.mutate({ files: videos, marcheEventId, isPublic, typeMedia: 'video', marcheId: activeMarcheId });
                trackActivity(userId, 'media_upload', 'video', { marcheEventId, metadata: { count: videos.length } });
              }
            }}
          />
        </motion.div>
      )}

      {/* Admin photos (from exploration) */}
      {adminPhotos && adminPhotos.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-emerald-400/50" />
            <span className="text-emerald-200/40 text-[10px] uppercase tracking-wider" data-chat-heading>De l'exploration ({adminPhotos.length})</span>
          </div>
          <div className={`grid ${viewMode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-3 gap-1.5'}`}>
            {adminPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className={`${viewMode === 'immersion' ? 'aspect-[3/4]' : 'aspect-square'} rounded-lg overflow-hidden bg-white/5 cursor-pointer active:scale-95 transition-transform group relative`}
                onClick={() => setLightboxIndex(i)}
                data-chat-card
                data-chat-title={photo.titre || 'Photo de l\'exploration'}
                data-chat-subtitle="photo • de l'exploration • publique"
                data-chat-badges="photo,exploration,public"
              >
                <img src={photo.url_supabase} alt={photo.titre || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                {viewMode === 'immersion' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {photo.titre && (
                      <span className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-medium truncate">{photo.titre}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My contributions */}
      {myMedias.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-amber-400" />
            <span data-chat-heading className="text-amber-300/60 text-[10px] uppercase tracking-wider">Mes contributions ({myMedias.length})</span>
          </div>
          <DraggableContributionGrid
            items={myMedias.map(m => ({
              id: m.id,
              type: m.type_media,
              titre: m.titre,
              description: m.description,
              url: m.url_fichier,
              externalUrl: m.external_url,
              isPublic: m.is_public,
              sharedToWeb: (m as any).shared_to_web,
              createdAt: m.created_at,
            }))}
            viewMode={viewMode}
            onReorder={(updates) => reorderContribs.mutate(updates)}
            onUpdate={(id, updates) => updateContrib.mutate({ table: 'marcheur_medias', id, updates })}
            onDelete={(id) => {
              const m = myMedias.find(x => x.id === id);
              deleteContrib.mutate({ table: 'marcheur_medias', id, storageUrl: m?.url_fichier || undefined });
            }}
            onClick={(i) => setLightboxIndex(adminCount + i)}
            getGpsDistance={viewMode === 'fiche' ? getGpsDistance : undefined}
          />
        </div>
      )}

      {/* Crédités à d'autres marcheurs (real photographer ≠ uploader) */}
      {creditedGroups.map((group, gIdx) => {
        const offsetBefore =
          adminCount + myCount +
          creditedGroups.slice(0, gIdx).reduce((s, g) => s + g.medias.length, 0);
        return (
          <div key={group.marcheurId} className="space-y-1.5">
            <div className="flex items-center gap-2">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/40" />
              ) : (
                <User className="w-3 h-3 text-amber-400" />
              )}
              <span data-chat-heading className="text-amber-300/70 text-[10px] uppercase tracking-wider">
                Crédité à {group.fullName} ({group.medias.length})
              </span>
            </div>
            <div className={`grid ${viewMode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'}`}>
              {group.medias.map((m, i) => (
                <ContributionItem
                  key={m.id}
                  id={m.id}
                  type={m.type_media}
                  titre={m.titre}
                  url={m.url_fichier}
                  externalUrl={m.external_url}
                  isPublic={m.is_public}
                  isOwner={false}
                  createdAt={m.created_at}
                  viewMode={viewMode}
                  gpsDistance={viewMode === 'fiche' ? getGpsDistance(m.id) : null}
                  onClick={() => setLightboxIndex(offsetBefore + i)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Others' contributions (uploaded by others, not attributed), grouped by uploader */}
      {othersGroups.map((group, gIdx) => {
        const offsetBefore =
          adminCount + myCount + creditedCount +
          othersGroups.slice(0, gIdx).reduce((s, g) => s + g.medias.length, 0);
        return (
          <div key={group.userId} className="space-y-1.5">
            <div className="flex items-center gap-2">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-400/40" />
              ) : (
                <Users className="w-3 h-3 text-blue-400" />
              )}
              <span data-chat-heading className="text-blue-300/70 text-[10px] uppercase tracking-wider">
                {group.fullName} ({group.medias.length})
              </span>
            </div>
            <div className={`grid ${viewMode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'}`}>
              {group.medias.map((m, i) => (
                <ContributionItem
                  key={m.id}
                  id={m.id}
                  type={m.type_media}
                  titre={m.titre}
                  url={m.url_fichier}
                  externalUrl={m.external_url}
                  isPublic={m.is_public}
                  isOwner={false}
                  createdAt={m.created_at}
                  viewMode={viewMode}
                  gpsDistance={viewMode === 'fiche' ? getGpsDistance(m.id) : null}
                  onClick={() => setLightboxIndex(offsetBefore + i)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {!adminPhotos?.length && !myMedias.length && !creditedGroups.length && !othersMedias.length && !showUpload && (
        <EmptyState message="Aucune photo pour cette marche" sub="Appuyez sur + Ajouter pour partager vos photos" />
      )}
    </div>
  );
};

// ─── Écouter Tab ─── (utilise désormais MarcheurAudioPanel partagé)
export const EcouterTab: React.FC<{ marcheId: string; userId: string; marcheEventId: string; activeMarcheId?: string }> = ({ marcheId, userId, marcheEventId, activeMarcheId }) => {
  return (
    <MarcheurAudioPanel
      ownerUserId={userId}
      ownerCrewId={null}
      marcheIds={activeMarcheId ? [activeMarcheId] : marcheId ? [marcheId] : []}
      marcheEventIds={marcheEventId ? [marcheEventId] : []}
      canUpload={true}
      activeMarcheId={activeMarcheId || marcheId}
      activeMarcheEventId={marcheEventId}
      viewerUserId={userId}
      variant="modal"
    />
  );
};

// ─── Lire Tab ───
export const LireTab: React.FC<{ userId: string; marcheEventId: string; activeMarcheId?: string }> = ({ userId, marcheEventId, activeMarcheId }) => {
  const { trackActivity } = useActivityTracker();
  const [sort, setSort] = useState<'desc' | 'asc'>('asc');
  const [showNew, setShowNew] = useState(false);
  const [newTitre, setNewTitre] = useState('');
  const [newContenu, setNewContenu] = useState('');
  const [newType, setNewType] = useState('texte-libre');
  const [newIsPublic, setNewIsPublic] = useState(false);

  // Kigos
  const { data: kigos } = useQuery({
    queryKey: ['marche-detail-kigos', marcheEventId, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('kigo_entries')
        .select('id, kigo, haiku, saison, especes_associees')
        .eq('user_id', userId)
        .eq('marche_event_id', marcheEventId);
      return data || [];
    },
  });

  const { data: userTextes } = useMarcheurTextes(marcheEventId, userId, sort, activeMarcheId);
  const createTexte = useCreateTexte(userId);
  const updateContrib = useUpdateContribution();
  const deleteContrib = useDeleteContribution();

  // Curator capability for credit reattribution
  const { data: explorationId } = useQuery({
    queryKey: ['marche-event-exploration', marcheEventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_events')
        .select('exploration_id')
        .eq('id', marcheEventId)
        .single();
      return data?.exploration_id ?? null;
    },
    enabled: !!marcheEventId,
  });
  const { data: isCurator } = useIsCurator(explorationId ?? undefined);

  // Effective author key — supports crew reattribution (attributed_marcheur_id),
  // user reattribution (attributed_user_id), and falls back to typist (user_id).
  // Returns "user:<uid>" or "crew:<cid>" so crew rows without a linked account
  // are properly counted on their own.
  const effectiveAuthorKey = (t: any): string => {
    if (t.attributed_marcheur_id) return `crew:${t.attributed_marcheur_id}`;
    if (t.attributed_user_id) return `user:${t.attributed_user_id}`;
    return `user:${t.user_id}`;
  };
  const myKey = `user:${userId}`;
  const myTextes = userTextes?.filter(t => effectiveAuthorKey(t) === myKey) || [];
  const othersTextes = userTextes?.filter(t => effectiveAuthorKey(t) !== myKey && t.is_public) || [];

  // Resolve author profiles (users) and crew rows for "Des marcheurs" grouping
  const otherKeys = React.useMemo(
    () => Array.from(new Set(othersTextes.map(t => effectiveAuthorKey(t)))),
    [othersTextes],
  );
  const otherUserIds = React.useMemo(
    () => otherKeys.filter(k => k.startsWith('user:')).map(k => k.slice(5)),
    [otherKeys],
  );
  const otherCrewIds = React.useMemo(
    () => otherKeys.filter(k => k.startsWith('crew:')).map(k => k.slice(5)),
    [otherKeys],
  );

  const { data: authorProfiles = [] } = useQuery({
    queryKey: ['marcheur-textes-authors', otherUserIds.sort().join(',')],
    queryFn: async () => {
      if (!otherUserIds.length) return [];
      const { data } = await supabase
        .from('community_profiles')
        .select('user_id, prenom, nom, avatar_url')
        .in('user_id', otherUserIds);
      return data || [];
    },
    enabled: otherUserIds.length > 0,
  });
  const { data: crewProfiles = [] } = useQuery({
    queryKey: ['marcheur-textes-crew', otherCrewIds.sort().join(',')],
    queryFn: async () => {
      if (!otherCrewIds.length) return [];
      const { data } = await supabase
        .from('exploration_marcheurs')
        .select('id, prenom, nom, avatar_url')
        .in('id', otherCrewIds);
      return data || [];
    },
    enabled: otherCrewIds.length > 0,
  });
  const authorInfoByKey = React.useMemo(() => {
    const map = new Map<string, { fullName: string; avatarUrl: string | null }>();
    (authorProfiles as any[]).forEach((p) => {
      const full = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
      map.set(`user:${p.user_id}`, { fullName: full || 'Marcheur', avatarUrl: p.avatar_url ?? null });
    });
    (crewProfiles as any[]).forEach((p) => {
      const full = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
      map.set(`crew:${p.id}`, { fullName: full || 'Marcheur', avatarUrl: p.avatar_url ?? null });
    });
    return map;
  }, [authorProfiles, crewProfiles]);

  const othersGroups = React.useMemo(() => {
    const groups = new Map<string, { authorId: string; fullName: string; avatarUrl: string | null; isCredited: boolean; textes: typeof othersTextes }>();
    othersTextes.forEach(t => {
      const key = effectiveAuthorKey(t);
      const info = authorInfoByKey.get(key);
      const isCredited = !!t.attributed_user_id || !!t.attributed_marcheur_id;
      if (!groups.has(key)) {
        groups.set(key, {
          authorId: key,
          fullName: info?.fullName || 'Marcheur',
          avatarUrl: info?.avatarUrl ?? null,
          isCredited,
          textes: [],
        });
      }
      groups.get(key)!.textes.push(t);
    });
    return Array.from(groups.values());
  }, [othersTextes, authorInfoByKey]);

  const handleSubmit = () => {
    if (!newContenu.trim()) return;
    createTexte.mutate({
      marcheEventId,
      titre: newTitre || undefined as any,
      contenu: newContenu,
      typeTexte: newType,
      isPublic: newIsPublic,
      marcheId: activeMarcheId,
    });
    trackActivity(userId, 'media_upload', 'text', { marcheEventId, metadata: { type: newType } });
    setNewTitre('');
    setNewContenu('');
    setShowNew(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Écrire
        </button>
        <SortToggle sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>

      {showNew && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-white/5 rounded-xl border border-amber-500/20 p-3 space-y-3"
        >
          <select
            value={newType}
            onChange={e => setNewType(e.target.value)}
            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white text-xs"
          >
            {TEXTE_TYPES.map(t => (
              <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>
            ))}
          </select>
          <input
            value={newTitre}
            onChange={e => setNewTitre(e.target.value)}
            placeholder="Titre (optionnel)"
            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30"
          />
          <textarea
            value={newContenu}
            onChange={e => setNewContenu(e.target.value)}
            placeholder="Votre texte..."
            rows={4}
            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30 resize-none"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setNewIsPublic(!newIsPublic)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] transition-colors ${
                newIsPublic ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/40'
              }`}
            >
              {newIsPublic ? <Globe className="w-3 h-3" /> : <></>}
              {newIsPublic ? 'Public' : 'Privé'}
            </button>
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="text-white/40 text-xs">Annuler</button>
              <button
                onClick={handleSubmit}
                disabled={!newContenu.trim() || createTexte.isPending}
                className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium disabled:opacity-40"
              >
                Publier
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kigos */}
      {kigos && kigos.length > 0 && (
        <div className="space-y-2">
          <span data-chat-heading className="text-emerald-200/40 text-[10px] uppercase tracking-wider">🌿 Kigo</span>
          {kigos.map(kigo => (
            <div key={kigo.id} className="bg-gradient-to-br from-amber-500/10 to-emerald-500/5 rounded-xl border border-amber-400/20 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 text-sm">🌿</span>
                <span className="text-white font-medium text-xs">{kigo.kigo}</span>
                <span className="text-emerald-300/40 text-[10px] ml-auto">{kigo.saison}</span>
              </div>
              {kigo.haiku && (
                <p className="text-emerald-100/70 text-[11px] italic whitespace-pre-line pl-4 border-l border-amber-400/20">
                  {kigo.haiku}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* My texts */}
      {myTextes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-amber-400" />
            <span data-chat-heading className="text-amber-300/60 text-[10px] uppercase tracking-wider">Mes textes ({myTextes.length})</span>
          </div>
          <div className="space-y-2">
            {myTextes.map(t => (
              <ContributionItem
                key={t.id}
                id={t.id}
                type="texte"
                titre={t.titre}
                contenu={t.contenu}
                typeTexte={t.type_texte}
                isPublic={t.is_public}
                sharedToWeb={(t as any).shared_to_web}
                isOwner={true}
                createdAt={t.created_at}
                canReattribute={!!isCurator}
                explorationId={explorationId ?? undefined}
                onUpdate={(id, updates) => updateContrib.mutate({ table: 'marcheur_textes', id, updates })}
                onDelete={(id) => deleteContrib.mutate({ table: 'marcheur_textes', id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Others texts — groupés par auteur effectif (avec crédits) */}
      {othersGroups.map(group => (
        <div key={group.authorId} className="space-y-1.5">
          <div className="flex items-center gap-2">
            {group.avatarUrl ? (
              <img
                src={group.avatarUrl}
                alt=""
                className={`w-5 h-5 rounded-full object-cover ring-1 ${group.isCredited ? 'ring-amber-400/40' : 'ring-blue-400/40'}`}
              />
            ) : (
              <Users className={`w-3 h-3 ${group.isCredited ? 'text-amber-400' : 'text-blue-400'}`} />
            )}
            <span className={`text-[10px] uppercase tracking-wider ${group.isCredited ? 'text-amber-300/70' : 'text-blue-300/70'}`}>
              {group.isCredited ? `Crédité à ${group.fullName}` : group.fullName} ({group.textes.length})
            </span>
          </div>
          <div className="space-y-2">
            {group.textes.map(t => (
              <ContributionItem key={t.id} id={t.id} type="texte" titre={t.titre} contenu={t.contenu}
                typeTexte={t.type_texte} isPublic={t.is_public} isOwner={false} createdAt={t.created_at}
                canReattribute={!!isCurator} explorationId={explorationId ?? undefined} />
            ))}
          </div>
        </div>
      ))}

      {!kigos?.length && !myTextes.length && !othersTextes.length && !showNew && (
        <EmptyState message="Aucun texte pour cette marche" sub="Appuyez sur + Écrire pour partager vos mots" />
      )}
    </div>
  );
};



// ─── Vivant (3 couches) ───
export const VivantTab: React.FC<{
  marcheId: string;
  userId: string;
  marcheSlug?: string;
  explorationId?: string;
  userRole?: string;
}> = ({ marcheId, userId, marcheSlug, explorationId, userRole }) => {
  const queryClient = useQueryClient();
  const hasSyncedRef = useRef<string | null>(null);

  const canEdit = userRole === 'ambassadeur' || userRole === 'sentinelle' || userRole === 'admin';

  // Fetch radius context (marche + exploration default)
  const { data: radiusCtx } = useQuery({
    queryKey: ['marche-radius-ctx', marcheId, explorationId],
    queryFn: async () => {
      const [marcheRes, exploRes] = await Promise.all([
        supabase.from('marches').select('id, radius_m, latitude, longitude').eq('id', marcheId).maybeSingle(),
        explorationId
          ? supabase.from('explorations').select('default_radius_m').eq('id', explorationId).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      return {
        marcheRadiusM: (marcheRes.data as any)?.radius_m ?? null,
        explorationDefaultM: (exploRes?.data as any)?.default_radius_m ?? null,
        latitude: (marcheRes.data as any)?.latitude ?? null,
        longitude: (marcheRes.data as any)?.longitude ?? null,
      };
    },
    enabled: !!marcheId,
  });

  const resolvedKm = (
    radiusCtx?.marcheRadiusM ?? radiusCtx?.explorationDefaultM ?? 500
  ) / 1000;
  const isOverride = radiusCtx?.marcheRadiusM != null;

  const [radius, setRadius] = useState(0.5);
  useEffect(() => {
    setRadius(resolvedKm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedKm]);

  // Reset sync when radius changes
  useEffect(() => {
    hasSyncedRef.current = null;
  }, [radius]);

  const coords = radiusCtx
    ? { latitude: radiusCtx.latitude, longitude: radiusCtx.longitude }
    : null;

  // Use the same hook as the web bioacoustic pages
  const { data: biodiversityData, isLoading } = useBiodiversityData({
    latitude: coords?.latitude ?? 0,
    longitude: coords?.longitude ?? 0,
    radius,
    dateFilter: 'recent',
  });

  // ✅ Canonical persisted species count for this marche (radius-aware, dedup, snapshots ∪ marcheur)
  // This is THE figure that must match every other view (Carte / Synthèse / Apprendre / Liste).
  const { data: canonicalCount } = useQuery({
    queryKey: ['marche-canonical-species-count', marcheId, radiusCtx?.marcheRadiusM, radiusCtx?.explorationDefaultM],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_marche_species_count', { p_marche_id: marcheId });
      if (error) throw error;
      return (data as any)?.total ?? 0;
    },
    enabled: !!marcheId,
    staleTime: 1000 * 60,
  });

  // Silent sync to biodiversity_snapshots after live data arrives
  useEffect(() => {
    if (!biodiversityData?.species || !biodiversityData.summary || !coords || !marcheId) return;
    if (hasSyncedRef.current === marcheId) return;
    hasSyncedRef.current = marcheId;

    const syncSnapshot = async () => {
      try {
        const { error } = await supabase.functions.invoke('sync-biodiversity-snapshot', {
          body: {
            marcheId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            speciesData: biodiversityData.species,
            summary: biodiversityData.summary,
            methodology: biodiversityData.methodology,
          },
        });
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['event-biodiversity-snapshots'] });
          queryClient.invalidateQueries({ queryKey: ['biodiversity-snapshots'] });
          queryClient.invalidateQueries({ queryKey: ['marche-canonical-species-count', marcheId] });
        }
      } catch (err) {
        console.warn('⚠️ Snapshot sync error (non-blocking):', err);
      }
    };

    syncSnapshot();
  }, [biodiversityData, coords, marcheId, queryClient]);


  const explorerLink = marcheSlug ? `/bioacoustique/${marcheSlug}` : null;

  const saveAsMarcheOverride = async () => {
    const radiusM = Math.round(radius * 1000);
    const { error } = await supabase.from('marches').update({ radius_m: radiusM }).eq('id', marcheId);
    if (error) toast.error('Échec enregistrement');
    else {
      toast.success(`Rayon de cette marche : ${radiusM} m`);
      queryClient.invalidateQueries({ queryKey: ['marche-radius-ctx', marcheId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-all-marches'] });
      queryClient.invalidateQueries({ queryKey: ['event-all-marches'] });
    }
  };

  const clearMarcheOverride = async () => {
    const { error } = await supabase.from('marches').update({ radius_m: null }).eq('id', marcheId);
    if (error) toast.error('Échec');
    else {
      toast.success("Retour au défaut de l'exploration");
      queryClient.invalidateQueries({ queryKey: ['marche-radius-ctx', marcheId] });
    }
  };

  if (isLoading && !biodiversityData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  const persistedKm = (radiusCtx?.marcheRadiusM ?? radiusCtx?.explorationDefaultM ?? 500) / 1000;
  const isDirty = Math.abs(radius - persistedKm) > 1e-6;

  return (
    <div className="space-y-4">
      {explorerLink && (
        <a href={explorerLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-emerald-400/70 text-[11px] hover:text-emerald-300 transition-colors">
          <ExternalLink className="w-3 h-3" />Explorer sur le territoire
        </a>
      )}
      <div className="space-y-2">
        <RadiusSelector value={radius} onChange={setRadius} loading={isLoading} readOnly={!canEdit} />
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">
              {isOverride
                ? <>Rayon <em>personnalisé</em> pour cette marche</>
                : <>Hérite du défaut exploration ({Math.round(persistedKm * 1000)} m)</>}
            </span>
            {isDirty && (
              <button
                onClick={saveAsMarcheOverride}
                className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                Définir comme rayon de cette marche
              </button>
            )}
            {isOverride && (
              <button
                onClick={clearMarcheOverride}
                className="px-2.5 py-1 rounded-full bg-background/40 border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
              >
                Revenir au défaut
              </button>
            )}
          </div>
        )}
      </div>
      {/* Canonical inventory headline — single source of truth across all views */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-emerald-300/70">Inventaire collecté</span>
          <span className="text-emerald-200 text-sm font-medium">
            {canonicalCount ?? '…'} espèce{(canonicalCount ?? 0) > 1 ? 's' : ''}
            <span className="text-emerald-300/60 text-[11px] ml-2">
              (rayon {Math.round(persistedKm * 1000)} m)
            </span>
          </span>
        </div>
        {biodiversityData?.species && biodiversityData.species.length !== (canonicalCount ?? 0) && (
          <span className="text-[10px] text-amber-300/80" title="Aperçu en direct depuis iNaturalist, peut différer de l'inventaire persisté">
            Aperçu live : {biodiversityData.species.length}
          </span>
        )}
      </div>
      {(!biodiversityData?.species || biodiversityData.species.length === 0) ? (
        <EmptyState message="Aucune donnée biodiversité disponible pour ce rayon" />
      ) : (
        <SpeciesExplorer
          species={biodiversityData.species}
          compact
          explorationId={explorationId}
          trophicPool={biodiversityData.species}
        />

      )}
    </div>
  );
};

// ─── Step Selector ───
export const StepSelector: React.FC<{
  marches: { id: string; nom_marche: string | null; ville: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
}> = ({ marches, activeIndex, onSelect }) => {
  const [isListOpen, setIsListOpen] = useState(false);
  const current = marches[activeIndex];

  const handleJump = (index: number) => {
    onSelect(index);
    setIsListOpen(false);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-amber-500/5 rounded-xl border border-emerald-400/15 p-3 mx-1">
      <div className="flex items-center justify-between">
        <button onClick={() => onSelect(activeIndex - 1)} disabled={activeIndex === 0}
          className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4 text-emerald-300" />
        </button>
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="text-center flex-1 min-w-0 px-2 cursor-pointer group"
        >
          <p className="text-emerald-300/60 text-[10px] font-medium flex items-center justify-center gap-1">
            Étape {activeIndex + 1}/{marches.length}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isListOpen ? 'rotate-180' : ''}`} />
          </p>
          <p className="text-white text-sm font-medium truncate group-hover:text-emerald-200 transition-colors">
            🌿 {current.nom_marche || current.ville}
          </p>
        </button>
        <button onClick={() => onSelect(activeIndex + 1)} disabled={activeIndex === marches.length - 1}
          className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-emerald-300" />
        </button>
      </div>

      {/* Jump-to drawer */}
      <AnimatePresence>
        {isListOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-emerald-400/10">
              <div className="max-h-[200px] overflow-y-auto space-y-0.5 scrollbar-thin">
                {marches.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => handleJump(i)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                      i === activeIndex
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      i === activeIndex ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-white/50'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="truncate flex-1">{m.nom_marche || m.ville}</span>
                    {i === activeIndex && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center gap-1.5 mt-2">
        {marches.map((_, i) => (
          <button key={i} onClick={() => onSelect(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-emerald-400 scale-125' : 'bg-white/20 hover:bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
};

// ─── Main Modal ───
const MarcheDetailModal: React.FC<MarcheDetailModalProps> = ({
  open, onClose, userId, marcheEventId, eventTitle, eventDate, eventLieu,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('voir');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { trackActivity } = useActivityTracker();

  // Track marche view on open
  useEffect(() => {
    if (open && marcheEventId) {
      trackActivity(userId, 'marche_view', `marche:${marcheEventId}`, { marcheEventId });
    }
  }, [open, marcheEventId]);

  // Track tab switches inside marche modal
  useEffect(() => {
    if (open) {
      trackActivity(userId, 'tab_switch', `tab:marche:${activeTab}`, { marcheEventId });
    }
  }, [activeTab, open]);

  const { data: explorationMarches } = useQuery({
    queryKey: ['marche-detail-steps', marcheEventId],
    queryFn: async () => {
      const { data: event } = await supabase.from('marche_events').select('exploration_id').eq('id', marcheEventId).single();
      if (!event?.exploration_id) return [];
      const { data: links } = await supabase.from('exploration_marches').select('marche_id, ordre').eq('exploration_id', event.exploration_id).order('ordre');
      if (!links?.length) return [];
      const { data: marches } = await supabase.from('marches').select('id, nom_marche, ville').in('id', links.map(l => l.marche_id));
      if (!marches?.length) return [];
      const ordreMap = new Map(links.map(l => [l.marche_id, l.ordre ?? 0]));
      return marches.sort((a, b) => (ordreMap.get(a.id) ?? 0) - (ordreMap.get(b.id) ?? 0));
    },
    enabled: open,
  });

  const hasMultipleSteps = (explorationMarches?.length ?? 0) > 1;
  const activeMarcheId = explorationMarches?.[activeStepIndex]?.id;
  const activeMarche = explorationMarches?.[activeStepIndex];
  const activeMarcheSlug = activeMarche ? createSlug(activeMarche.nom_marche || activeMarche.ville, activeMarche.ville) : undefined;

  // Stats for badge indicators (must be after activeMarcheId is derived)
  const { data: stats } = useMarcheurStats(marcheEventId, userId, activeMarcheId);

  // Count of available descriptions (Présentation / En détail) for current step
  const { data: lireCount = 0 } = useQuery({
    queryKey: ['marche-descriptions-count', activeMarcheId],
    queryFn: async () => {
      if (!activeMarcheId) return 0;
      const { data, error } = await supabase
        .from('marches')
        .select('descriptif_court, descriptif_long')
        .eq('id', activeMarcheId)
        .maybeSingle();
      if (error) throw error;
      let n = 0;
      if ((data?.descriptif_court || '').trim()) n++;
      if ((data?.descriptif_long || '').trim()) n++;
      return n;
    },
    enabled: open && !!activeMarcheId,
    staleTime: 5 * 60 * 1000,
  });

  const tabCounts: Record<TabKey, number> = {
    voir: stats?.totalMedias || 0,
    ecouter: stats?.totalAudio || 0,
    lire: lireCount,
    ecrire: stats?.totalTextes || 0,
    vivant: 0,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-[#0a1a0f] border-emerald-500/20 max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0"
        data-chat-context="marche-detail"
        data-chat-title={eventTitle}
        data-chat-subtitle={[eventDate, eventLieu].filter(Boolean).join(' • ')}
        data-chat-active-tab={activeTab}
      >
        <div className="p-4 pb-2 space-y-1">
          <DialogHeader>
            <DialogTitle className="text-white text-base font-semibold">{eventTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-emerald-300/60 text-[11px]">
            {eventDate && <span>{format(new Date(eventDate), 'dd MMMM yyyy', { locale: fr })}</span>}
            {eventLieu && (
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{eventLieu}</span>
            )}
          </div>
        </div>

        {hasMultipleSteps && explorationMarches && (
          <div className="px-3 pb-2">
            <StepSelector marches={explorationMarches} activeIndex={activeStepIndex} onSelect={setActiveStepIndex} />
          </div>
        )}

        {/* Tabs with count badges */}
        <div className="flex border-b border-white/10 px-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors relative ${
                  isActive ? 'text-emerald-300' : 'text-emerald-200/40 hover:text-emerald-200/60'
                }`}>
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                      {count}
                    </span>
                  )}
                </div>
                {tab.label}
                {isActive && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activeMarcheId || marcheEventId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'voir' && <VoirTab marcheId={activeMarcheId || ''} userId={userId} marcheEventId={marcheEventId} activeMarcheId={activeMarcheId} />}
              {activeTab === 'ecouter' && <EcouterTab marcheId={activeMarcheId || ''} userId={userId} marcheEventId={marcheEventId} activeMarcheId={activeMarcheId} />}
              {activeTab === 'lire' && <LireDescriptionsTab activeMarcheId={activeMarcheId} />}
              {activeTab === 'ecrire' && <LireTab userId={userId} marcheEventId={marcheEventId} activeMarcheId={activeMarcheId} />}
              {activeTab === 'vivant' && <VivantTab marcheId={activeMarcheId || ''} userId={userId} marcheSlug={activeMarcheSlug} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarcheDetailModal;
