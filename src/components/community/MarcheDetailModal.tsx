import React, { useState, useEffect, useRef } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Headphones, BookOpen, Leaf, MapPin, Music, ChevronLeft, ChevronRight, ChevronDown, Check, Camera, FileText, Globe, Users, User, ExternalLink, Video, Plus, Grid3X3, LayoutList, Crosshair } from 'lucide-react';
import { usePhotoGpsCheck, formatDistance, distanceColor, distanceEmoji, type PhotoGpsResult } from '@/hooks/usePhotoGpsCheck';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import MediaLightbox, { type LightboxItem } from './contributions/MediaLightbox';
import { motion, AnimatePresence } from 'framer-motion';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { createSlug } from '@/utils/slugGenerator';
import SpeciesExplorer from '@/components/biodiversity/SpeciesExplorer';
import RadiusSelector from '@/components/biodiversity/RadiusSelector';
import FileUploadZone from './contributions/FileUploadZone';
import ContributionItem from './contributions/ContributionItem';
import SortToggle from './contributions/SortToggle';
import MediaSkeletonGrid from './contributions/MediaSkeletonGrid';
import {
  useMarcheurMedias, useUploadMedias, useAddExternalVideo,
  useMarcheurAudio, useUploadAudio,
  useMarcheurTextes, useCreateTexte,
  useUpdateContribution, useDeleteContribution,
  useMarcheurStats,
} from '@/hooks/useMarcheurContributions';

interface MarcheDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  marcheEventId: string;
  eventTitle: string;
  eventDate: string;
  eventLieu: string | null;
}

type TabKey = 'voir' | 'ecouter' | 'lire' | 'vivant';

const tabs: { key: TabKey; label: string; icon: typeof Eye }[] = [
  { key: 'voir', label: 'Voir', icon: Eye },
  { key: 'ecouter', label: 'Écouter', icon: Headphones },
  { key: 'lire', label: 'Lire', icon: BookOpen },
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
        .select('id, url_supabase, titre, description')
        .eq('marche_id', marcheId)
        .order('ordre')
        .limit(20);
      return data || [];
    },
    enabled: !!marcheId,
  });

  // User contributions
  const { data: userMedias, isLoading: isLoadingUser } = useMarcheurMedias(marcheEventId, userId, sort, activeMarcheId);
  const uploadMedias = useUploadMedias(userId);
  const addExtVideo = useAddExternalVideo(userId);
  const updateContrib = useUpdateContribution();
  const deleteContrib = useDeleteContribution();

  const myMedias = userMedias?.filter(m => m.user_id === userId) || [];
  const othersMedias = userMedias?.filter(m => m.user_id !== userId && m.is_public) || [];

  // Build unified lightbox items array
  const lightboxItems: LightboxItem[] = React.useMemo(() => {
    const items: LightboxItem[] = [];
    // Admin photos
    (adminPhotos || []).forEach(p => items.push({
      url: p.url_supabase, type: 'photo', titre: p.titre, isPublic: true, isOwner: false,
    }));
    // My contributions
    myMedias.forEach(m => {
      const url = m.url_fichier || m.external_url;
      if (url) items.push({ url, type: m.type_media, titre: m.titre, isPublic: m.is_public, isOwner: true, createdAt: m.created_at });
    });
    // Others' public contributions
    othersMedias.forEach(m => {
      const url = m.url_fichier || m.external_url;
      if (url) items.push({ url, type: m.type_media, titre: m.titre, isPublic: true, isOwner: false, createdAt: m.created_at });
    });
    return items;
  }, [adminPhotos, myMedias, othersMedias]);

  // Track offset for each section to compute lightbox index
  const adminCount = adminPhotos?.length || 0;
  const myCount = myMedias.length;

  return (
    <div className="space-y-4">
      {lightboxIndex !== null && (
        <MediaLightbox items={lightboxItems} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
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
                    const allPhotos: { id: string; nom: string; url: string }[] = [];
                    (adminPhotos || []).forEach(p => allPhotos.push({ id: p.id, nom: p.titre || 'Photo exploration', url: p.url_supabase }));
                    myMedias.filter(m => m.type_media === 'photo' && (m.url_fichier || m.external_url)).forEach(m => 
                      allPhotos.push({ id: m.id, nom: m.titre || 'Ma photo', url: (m.url_fichier || m.external_url)! })
                    );
                    othersMedias.filter(m => m.type_media === 'photo' && (m.url_fichier || m.external_url)).forEach(m =>
                      allPhotos.push({ id: m.id, nom: m.titre || 'Photo marcheur', url: (m.url_fichier || m.external_url)! })
                    );
                    checkPhotos(allPhotos);
                    setShowGpsDialog(true);
                  }}
                  disabled={isChecking}
                  className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
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
            accept="image/*,video/*"
            label="Photos & vidéos"
            icon={<Camera className="w-6 h-6 text-emerald-400/60" />}
            isUploading={uploadMedias.isPending}
            onFilesSelected={(files, isPublic) => {
              const photos = files.filter(f => f.type.startsWith('image/'));
              const videos = files.filter(f => f.type.startsWith('video/'));
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
            <span className="text-emerald-200/40 text-[10px] uppercase tracking-wider">De l'exploration</span>
          </div>
          <div className={`grid ${viewMode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-3 gap-1.5'}`}>
            {adminPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className={`${viewMode === 'immersion' ? 'aspect-[3/4]' : 'aspect-square'} rounded-lg overflow-hidden bg-white/5 cursor-pointer active:scale-95 transition-transform group relative`}
                onClick={() => setLightboxIndex(i)}
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
            <span className="text-amber-300/60 text-[10px] uppercase tracking-wider">Mes contributions ({myMedias.length})</span>
          </div>
          <div className={`grid ${viewMode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'}`}>
            {myMedias.map((m, i) => (
              <ContributionItem
                key={m.id}
                id={m.id}
                type={m.type_media}
                titre={m.titre}
                description={m.description}
                url={m.url_fichier}
                externalUrl={m.external_url}
                isPublic={m.is_public}
                isOwner={true}
                createdAt={m.created_at}
                viewMode={viewMode}
                onUpdate={(id, updates) => updateContrib.mutate({ table: 'marcheur_medias', id, updates })}
                onDelete={(id) => deleteContrib.mutate({ table: 'marcheur_medias', id, storageUrl: m.url_fichier || undefined })}
                onClick={() => setLightboxIndex(adminCount + i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Others' contributions */}
      {othersMedias.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-blue-300/60 text-[10px] uppercase tracking-wider">Des marcheurs ({othersMedias.length})</span>
          </div>
          <div className={`grid ${viewMode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'}`}>
            {othersMedias.map((m, i) => (
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
                onClick={() => setLightboxIndex(adminCount + myCount + i)}
              />
            ))}
          </div>
        </div>
      )}

      {!adminPhotos?.length && !myMedias.length && !othersMedias.length && !showUpload && (
        <EmptyState message="Aucune photo pour cette marche" sub="Appuyez sur + Ajouter pour partager vos photos" />
      )}
    </div>
  );
};

// ─── Écouter Tab ───
export const EcouterTab: React.FC<{ marcheId: string; userId: string; marcheEventId: string; activeMarcheId?: string }> = ({ marcheId, userId, marcheEventId, activeMarcheId }) => {
  const { trackActivity } = useActivityTracker();
  const [sort, setSort] = useState<'desc' | 'asc'>('asc');
  const [showUpload, setShowUpload] = useState(false);

  const { data: adminAudio } = useQuery({
    queryKey: ['marche-detail-audio', marcheId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_audio')
        .select('id, url_supabase, titre, duree_secondes, type_audio')
        .eq('marche_id', marcheId)
        .order('ordre')
        .limit(20);
      return data || [];
    },
    enabled: !!marcheId,
  });

  const { data: userAudio } = useMarcheurAudio(marcheEventId, userId, sort, activeMarcheId);
  const uploadAudio = useUploadAudio(userId);
  const updateContrib = useUpdateContribution();
  const deleteContrib = useDeleteContribution();

  const myAudio = userAudio?.filter(a => a.user_id === userId) || [];
  const othersAudio = userAudio?.filter(a => a.user_id !== userId && a.is_public) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un son
        </button>
        <SortToggle sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>

      {showUpload && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <FileUploadZone
            accept="audio/*"
            label="Enregistrements sonores"
            icon={<Music className="w-6 h-6 text-violet-400/60" />}
            isUploading={uploadAudio.isPending}
            onFilesSelected={(files, isPublic) => {
              uploadAudio.mutate({ files, marcheEventId, isPublic, marcheId: activeMarcheId });
              trackActivity(userId, 'media_upload', 'audio', { marcheEventId, metadata: { count: files.length } });
            }}
          />
        </motion.div>
      )}

      {/* Admin audio */}
      {adminAudio && adminAudio.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-emerald-400/50" />
            <span className="text-emerald-200/40 text-[10px] uppercase tracking-wider">De l'exploration</span>
          </div>
          <div className="space-y-2">
            {adminAudio.map(audio => (
              <div key={audio.id} className="bg-white/5 rounded-lg border border-white/10 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium truncate">{audio.titre || 'Enregistrement'}</p>
                    {audio.duree_secondes && (
                      <p className="text-emerald-200/40 text-[10px]">
                        {Math.floor(audio.duree_secondes / 60)}:{String(audio.duree_secondes % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>
                <audio controls className="w-full h-8" preload="none">
                  <source src={audio.url_supabase} />
                </audio>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My audio */}
      {myAudio.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300/60 text-[10px] uppercase tracking-wider">Mes sons ({myAudio.length})</span>
          </div>
          <div className="space-y-2">
            {myAudio.map(a => (
              <ContributionItem
                key={a.id}
                id={a.id}
                type="audio"
                titre={a.titre}
                description={a.description}
                url={a.url_fichier}
                isPublic={a.is_public}
                isOwner={true}
                createdAt={a.created_at}
                onUpdate={(id, updates) => updateContrib.mutate({ table: 'marcheur_audio', id, updates })}
                onDelete={(id) => deleteContrib.mutate({ table: 'marcheur_audio', id, storageUrl: a.url_fichier })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Others audio */}
      {othersAudio.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-blue-300/60 text-[10px] uppercase tracking-wider">Des marcheurs ({othersAudio.length})</span>
          </div>
          <div className="space-y-2">
            {othersAudio.map(a => (
              <ContributionItem key={a.id} id={a.id} type="audio" titre={a.titre} url={a.url_fichier}
                isPublic={a.is_public} isOwner={false} createdAt={a.created_at} />
            ))}
          </div>
        </div>
      )}

      {!adminAudio?.length && !myAudio.length && !othersAudio.length && !showUpload && (
        <EmptyState message="Aucun enregistrement sonore" sub="Appuyez sur + Ajouter pour partager vos sons" />
      )}
    </div>
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

  const myTextes = userTextes?.filter(t => t.user_id === userId) || [];
  const othersTextes = userTextes?.filter(t => t.user_id !== userId && t.is_public) || [];

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
          <span className="text-emerald-200/40 text-[10px] uppercase tracking-wider">🌿 Kigo</span>
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
            <span className="text-amber-300/60 text-[10px] uppercase tracking-wider">Mes textes ({myTextes.length})</span>
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
                isOwner={true}
                createdAt={t.created_at}
                onUpdate={(id, updates) => updateContrib.mutate({ table: 'marcheur_textes', id, updates })}
                onDelete={(id) => deleteContrib.mutate({ table: 'marcheur_textes', id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Others texts */}
      {othersTextes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-blue-300/60 text-[10px] uppercase tracking-wider">Des marcheurs ({othersTextes.length})</span>
          </div>
          <div className="space-y-2">
            {othersTextes.map(t => (
              <ContributionItem key={t.id} id={t.id} type="texte" titre={t.titre} contenu={t.contenu}
                typeTexte={t.type_texte} isPublic={t.is_public} isOwner={false} createdAt={t.created_at} />
            ))}
          </div>
        </div>
      )}

      {!kigos?.length && !myTextes.length && !othersTextes.length && !showNew && (
        <EmptyState message="Aucun texte pour cette marche" sub="Appuyez sur + Écrire pour partager vos mots" />
      )}
    </div>
  );
};



// ─── Vivant (3 couches) ───
export const VivantTab: React.FC<{ marcheId: string; userId: string; marcheSlug?: string }> = ({ marcheId, userId, marcheSlug }) => {
  const queryClient = useQueryClient();
  const hasSyncedRef = useRef<string | null>(null);
  const [radius, setRadius] = useState(0.5);

  // Reset sync when radius changes
  useEffect(() => {
    hasSyncedRef.current = null;
  }, [radius]);

  // Fetch lat/lng for this marche
  const { data: coords } = useQuery({
    queryKey: ['marche-coords', marcheId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marches')
        .select('latitude, longitude')
        .eq('id', marcheId)
        .single();
      return data;
    },
    enabled: !!marcheId,
  });

  // Use the same hook as the web bioacoustic pages
  const { data: biodiversityData, isLoading } = useBiodiversityData({
    latitude: coords?.latitude ?? 0,
    longitude: coords?.longitude ?? 0,
    radius,
    dateFilter: 'recent',
  });

  // Silent sync to biodiversity_snapshots after live data arrives
  useEffect(() => {
    if (!biodiversityData?.species || !biodiversityData.summary || !coords || !marcheId) return;
    if (hasSyncedRef.current === marcheId) return;
    hasSyncedRef.current = marcheId;

    const syncSnapshot = async () => {
      try {
        console.log(`🔄 Syncing biodiversity snapshot for marche ${marcheId}...`);
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
          console.log(`✅ Snapshot synced for marche ${marcheId}`);
          queryClient.invalidateQueries({ queryKey: ['event-biodiversity-snapshots'] });
          queryClient.invalidateQueries({ queryKey: ['biodiversity-snapshots'] });
        } else {
          console.warn('⚠️ Snapshot sync failed:', error);
        }
      } catch (err) {
        console.warn('⚠️ Snapshot sync error (non-blocking):', err);
      }
    };

    syncSnapshot();
  }, [biodiversityData, coords, marcheId, queryClient]);

  const explorerLink = marcheSlug ? `/bioacoustique/${marcheSlug}` : null;

  if (isLoading && !biodiversityData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {explorerLink && (
        <a href={explorerLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-emerald-400/70 text-[11px] hover:text-emerald-300 transition-colors">
          <ExternalLink className="w-3 h-3" />Explorer sur le territoire
        </a>
      )}
      <RadiusSelector value={radius} onChange={setRadius} loading={isLoading} />
      {(!biodiversityData?.species || biodiversityData.species.length === 0) ? (
        <EmptyState message="Aucune donnée biodiversité disponible pour ce rayon" />
      ) : (
        <SpeciesExplorer
          species={biodiversityData.species}
          compact
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

  const tabCounts: Record<TabKey, number> = {
    voir: stats?.totalMedias || 0,
    ecouter: stats?.totalAudio || 0,
    lire: stats?.totalTextes || 0,
    vivant: 0,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0a1a0f] border-emerald-500/20 max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
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
              {activeTab === 'lire' && <LireTab userId={userId} marcheEventId={marcheEventId} activeMarcheId={activeMarcheId} />}
              {activeTab === 'vivant' && <VivantTab marcheId={activeMarcheId || ''} userId={userId} marcheSlug={activeMarcheSlug} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarcheDetailModal;
