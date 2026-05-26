import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, BookOpen, Leaf, Copy, Share2, Users, Sprout, ChevronDown, ExternalLink, Eye, Image, FileText, TrendingUp, MapPin, Bird, Flower2, TreePine, Wand2, Send, Link as LinkIcon, ArrowUpDown, Check, GripVertical, Headphones, Feather, Sparkles, Quote, ShieldCheck, Bug, AlertTriangle, ArrowDownWideNarrow, ArrowUpNarrowWide, X as XIcon, MailOpen } from 'lucide-react';
import { computeSentinelleIndex, type SentinelleResult, type SentinelleTier } from '@/lib/sentinelleIndex';
import { bucketSensibleSpecies, type SpeciesCategory } from '@/lib/speciesClassification';
import { useExplorationTestimonies, type EventTestimony } from '@/hooks/useEventTestimonies';
import { useIsCurator } from '@/hooks/useExplorationCurations';
import MediaAttributionSheet from '@/components/community/insights/curation/MediaAttributionSheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import ScoreBreakdown from '@/components/community/exploration/impact/ScoreBreakdown';
import ScoreCriterionDrawer from '@/components/community/exploration/impact/ScoreCriterionDrawer';
import { useExplorationParticipants, MarcheurWithStats, SpeciesObservation } from '@/hooks/useExplorationParticipants';
import { useFrenchSpeciesNamesAuto } from '@/hooks/useFrenchSpeciesNamesAuto';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buildAffiliateCopyMessage, buildAffiliateShareMessage, getAffiliateInviteUrl } from '@/utils/communityAffiliate';
import SortToggle from '@/components/community/contributions/SortToggle';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useReorderMarcheurObservations } from '@/hooks/useReorderMarcheurObservations';
import { useMarcheursAliasesMap } from '@/hooks/useMarcheurAliases';
import MarcheurAudioPanel from '@/components/community/audio/MarcheurAudioPanel';
import CitizenPlatformsCard from '@/components/community/exploration/impact/CitizenPlatformsCard';
import PratiquesPorteesCard from '@/components/community/exploration/impact/PratiquesPorteesCard';
import { useMarcheursPratiquesCounts } from '@/hooks/useCurationMarcheurs';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MarcheurImpactPanel from './impact/MarcheurImpactPanel';
import CitizenContributorsAggregateRow from './CitizenContributorsAggregateRow';
import { useExplorationCitizenContributors } from '@/hooks/useExplorationCitizenContributors';
import { useMarcheurInatProfile } from '@/hooks/useMarcheurInatProfile';
import { useMarcheurAttributedSpecies } from '@/hooks/useMarcheurAttributedSpecies';
import SpeciesExplorer from '@/components/biodiversity/SpeciesExplorer';
import InatUploadPrepDrawer from './InatUploadPrepDrawer';

interface MarcheursTabProps {
  explorationId?: string;
  marcheEventId?: string;
  explorationName?: string;
}

type ShareKitState = {
  url: string;
  message: string;
  generatedCount: number;
};

type MarcheurSubTab = 'observations' | 'ecoute' | 'textes' | 'temoignage' | 'contributions' | 'impact';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};

// --- Observations sub-tab: photos sorted by date ---
// Resolves the marcher's media across THREE buckets, honoring re-attribution:
//   1. marcheur_medias uploaded by them (user_id)
//   2. marcheur_medias re-attributed to their editorial card (attributed_marcheur_id)
//   3. exploration_convivialite_photos (uploaded OR re-attributed)
const ObservationsSubTab: React.FC<{
  userId?: string | null;
  crewId?: string | null;
  explorationId?: string;
  explorationEventIds?: string[];
  stats: MarcheurWithStats['stats'];
  prenom: string;
}> = ({ userId, crewId, explorationId, explorationEventIds, stats, prenom }) => {
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [manualOrder, setManualOrder] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<any[] | null>(null);
  const { user, isAdmin } = useAuth();
  const reorderMutation = useReorderMarcheurObservations();

  const queryKey = ['marcheur-observations-photos', userId, crewId, explorationId, explorationEventIds];

  const { data: items, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const out: Array<{
        id: string;
        rowId: string;
        url: string;
        titre: string | null;
        type: 'photo' | 'video';
        created_at: string;
        kind: 'media' | 'conv';
        ordre: number | null;
      }> = [];

      const belongsToMe = (row: { user_id: string | null; attributed_marcheur_id: string | null }) => {
        if (row.attributed_marcheur_id) return !!crewId && row.attributed_marcheur_id === crewId;
        return !!userId && row.user_id === userId;
      };

      if (userId || crewId) {
        const orParts: string[] = [];
        if (userId) orParts.push(`user_id.eq.${userId}`);
        if (crewId) orParts.push(`attributed_marcheur_id.eq.${crewId}`);
        let q = supabase
          .from('marcheur_medias')
          .select('id, url_fichier, external_url, titre, type_media, created_at, user_id, attributed_marcheur_id, ordre')
          .eq('is_public', true)
          .in('type_media', ['photo', 'video'])
          .or(orParts.join(','))
          .order('created_at', { ascending: false })
          .limit(200);
        if (explorationEventIds?.length) q = q.in('marche_event_id', explorationEventIds);
        const { data } = await q;
        (data || []).forEach((m: any) => {
          if (!belongsToMe(m)) return;
          const url = m.url_fichier || m.external_url;
          if (!url) return;
          out.push({
            id: `media-${m.id}`,
            rowId: m.id,
            url,
            titre: m.titre,
            type: m.type_media === 'video' ? 'video' : 'photo',
            created_at: m.created_at,
            kind: 'media',
            ordre: m.ordre ?? null,
          });
        });
      }

      if (explorationId && (userId || crewId)) {
        const orParts: string[] = [];
        if (userId) orParts.push(`user_id.eq.${userId}`);
        if (crewId) orParts.push(`attributed_marcheur_id.eq.${crewId}`);
        const { data } = await supabase
          .from('exploration_convivialite_photos')
          .select('id, url, created_at, user_id, attributed_marcheur_id, position')
          .eq('exploration_id', explorationId)
          .eq('is_hidden', false)
          .or(orParts.join(','))
          .order('created_at', { ascending: false })
          .limit(200);
        (data || []).forEach((p: any) => {
          if (!belongsToMe(p)) return;
          if (!p.url) return;
          out.push({
            id: `conv-${p.id}`,
            rowId: p.id,
            url: p.url,
            titre: null,
            type: 'photo',
            created_at: p.created_at,
            kind: 'conv',
            ordre: p.position ?? null,
          });
        });
      }

      return out;
    },
    enabled: !!(userId || crewId),
    staleTime: 60_000,
  });

  // Sort: manual ordering (asc) when no edit, else by date
  const sorted = useMemo(() => {
    if (!items) return [];
    const arr = [...items];
    if (manualOrder) {
      arr.sort((a, b) => {
        const ao = a.ordre ?? 9999;
        const bo = b.ordre ?? 9999;
        if (ao !== bo) return ao - bo;
        // Tie-break by date desc
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      arr.sort((a, b) => {
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return sort === 'desc' ? diff : -diff;
      });
    }
    return arr;
  }, [items, sort, manualOrder]);

  const displayedItems = editMode && editedItems ? editedItems : sorted;
  const photoCount = displayedItems.filter((i: any) => i.type === 'photo').length;
  const videoCount = displayedItems.filter((i: any) => i.type === 'video').length;
  const totalMedia = displayedItems.length || stats.photos + stats.videos;

  // Permissions: owner of the user account, or owner of the linked crew, or admin
  const canReorder =
    !!isAdmin ||
    (!!userId && !!user && user.id === userId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleEnterEdit = () => {
    setEditedItems([...sorted]);
    setManualOrder(true);
    setEditMode(true);
  };
  const handleCancel = () => {
    setEditedItems(null);
    setEditMode(false);
  };
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !editedItems) return;
    const oldIdx = editedItems.findIndex((p: any) => p.id === active.id);
    const newIdx = editedItems.findIndex((p: any) => p.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setEditedItems(arrayMove(editedItems, oldIdx, newIdx));
  };
  const handleSave = async () => {
    if (!editedItems) return;
    const payload = editedItems.map((it: any, idx: number) => ({
      kind: it.kind,
      id: it.rowId,
      ordre: idx + 1,
    }));
    try {
      await reorderMutation.mutateAsync({
        ownerUserId: userId ?? null,
        ownerCrewId: crewId ?? null,
        items: payload,
        invalidateKey: queryKey,
      });
      toast.success('Ordre des photos enregistré');
      setEditMode(false);
      setEditedItems(null);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Échec de la sauvegarde de l\'ordre'));
    }
  };

  return (
    <div className="px-3 pt-3 pb-3 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-foreground">{photoCount || stats.photos}</span>
          </span>
          {(videoCount > 0 || stats.videos > 0) && (
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-foreground">{videoCount || stats.videos}</span>
            </span>
          )}
          <span className="text-muted-foreground/70">· {totalMedia} média{totalMedia > 1 ? 's' : ''}</span>
        </p>
        <div className="flex items-center gap-2">
          {!editMode && (
            <SortToggle
              sort={sort}
              onToggle={() => {
                setManualOrder(false);
                setSort(s => s === 'desc' ? 'asc' : 'desc');
              }}
            />
          )}
          {canReorder && !editMode && displayedItems.length > 1 && (
            <button
              onClick={handleEnterEdit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs font-medium border border-border/60 transition"
              title="Réorganiser les photos"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Réorganiser</span>
            </button>
          )}
          {editMode && (
            <>
              <button
                onClick={handleCancel}
                disabled={reorderMutation.isPending}
                className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs font-medium border border-border/60 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={reorderMutation.isPending}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                {reorderMutation.isPending ? 'Sauvegarde…' : 'Enregistrer'}
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {displayedItems.length > 0 && !editMode && (
        <div className="grid grid-cols-3 gap-2">
          {displayedItems.map((photo: any, i: number) => {
            const dateStr = photo.created_at
              ? format(new Date(photo.created_at), 'dd MMM · HH:mm', { locale: fr })
              : '';
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="relative group"
              >
                <img
                  src={photo.url}
                  alt={photo.titre || `Photo ${i + 1}`}
                  className="aspect-square w-full rounded-xl object-cover ring-1 ring-border/50 group-hover:ring-emerald-500/40 transition-all"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {photo.kind === 'conv' && (
                  <span className="absolute top-1 right-1 text-[8px] font-medium bg-emerald-600/85 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                    Convivialité
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-white/90 truncate">{photo.titre || dateStr}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {editMode && editedItems && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={editedItems.map((p: any) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2">
              {editedItems.map((photo: any, i: number) => (
                <SortableObservationTile key={photo.id} photo={photo} index={i} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isLoading && displayedItems.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          Aucune observation visuelle partagée
        </p>
      )}
    </div>
  );
};

// Sortable tile used in edit mode
const SortableObservationTile: React.FC<{ photo: any; index: number }> = ({ photo, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <img
        src={photo.url}
        alt={photo.titre || `Photo ${index + 1}`}
        className="aspect-square w-full rounded-xl object-cover ring-2 ring-emerald-500/40"
        loading="lazy"
        draggable={false}
      />
      <span className="absolute top-1 left-1 text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
        {index + 1}
      </span>
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        title="Glisser pour déplacer"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};


// Normalize string: remove accents/diacritics, lowercase, trim
const normalizeStr = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

// --- Contributions sub-tab : réutilise <SpeciesExplorer/> factorisé ---
// Les espèces affichées sont uniquement celles attribuées au marcheur courant
// (observations directes + attributions iNat via alias). Le toggle global
// Photos marcheurs ↔ iNaturalist (SpeciesPhotoModeContext) est partagé avec
// les vues Vivant / L'Œil / Synthèse.
const ContributionsSubTab: React.FC<{
  marcheur: MarcheurWithStats;
  explorationId?: string;
  explorationMarcheIds: string[];
  explorationEventIds: string[];
  resolvedUserId: string | null;
  aliases?: string[];
}> = ({ marcheur, explorationId, explorationMarcheIds, explorationEventIds, resolvedUserId, aliases = [] }) => {
  const [onlyOwn, setOnlyOwn] = useState(false);
  const [inatDrawerOpen, setInatDrawerOpen] = useState(false);
  const { data: isCurator } = useIsCurator(explorationId);
  const crewId = marcheur.crewId || (marcheur.source === 'crew' ? marcheur.id : null);

  const { data, isLoading } = useMarcheurAttributedSpecies({
    crewId,
    resolvedUserId,
    aliases,
    explorationMarcheIds,
    explorationId,
  });

  const allSpecies = data?.species || [];
  const ownUploaded = data?.ownUploadedSciNames || new Set<string>();
  const ownCount = ownUploaded.size;

  // URLs déjà rattachées à une espèce identifiée (à exclure du pack iNat)
  const identifiedPhotoUrls = useMemo(() => {
    const s = new Set<string>();
    allSpecies.forEach((sp) => (sp.photos || []).forEach((u) => u && s.add(u)));
    return s;
  }, [allSpecies]);

  const marcheurSlug = useMemo(() => {
    const base = `${marcheur.prenom || ''}-${marcheur.nom || ''}`.trim();
    return base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'marcheur';
  }, [marcheur.prenom, marcheur.nom]);

  const speciesToShow = useMemo(() => {
    if (!onlyOwn) return allSpecies;
    return allSpecies.filter((s) => ownUploaded.has(s.scientificName.trim().toLowerCase()));
  }, [allSpecies, ownUploaded, onlyOwn]);

  if (isLoading) {
    return (
      <div className="px-3 pt-3 pb-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = allSpecies.length === 0;

  return (
    <div className="px-3 pt-3 pb-3 space-y-3">
      {/* Bandeau spécifique marcheur : compteur + filtre « Mes photos » + prep iNat */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-foreground">{allSpecies.length}</span> espèce
          {allSpecies.length > 1 ? 's' : ''} identifiée{allSpecies.length > 1 ? 's' : ''}
          {ownCount > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1">
              · {ownCount} avec photo perso
            </span>
          )}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {ownCount > 0 && (
            <button
              onClick={() => setOnlyOwn((o) => !o)}
              aria-pressed={onlyOwn}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                onlyOwn
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/50 font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted ring-1 ring-transparent'
              }`}
            >
              <Camera className="w-3 h-3" />
              Mes photos ({ownCount})
            </button>
          )}
          {isCurator && (
            <button
              onClick={() => setInatDrawerOpen(true)}
              className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 bg-muted/50 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 ring-1 ring-transparent hover:ring-emerald-500/30 transition-all"
              title="Préparer un pack ZIP pour upload sur iNaturalist"
            >
              <Sparkles className="w-3 h-3" />
              Préparer upload iNat
            </button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="px-3 py-6 text-center">
          <Leaf className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground italic">Aucune espèce identifiée pour le moment</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {isCurator
              ? 'Utilisez « Préparer upload iNat » pour envoyer les photos à identifier 🌿'
              : 'Identifiez les espèces via l\'onglet Vivant 🌿'}
          </p>
        </div>
      ) : (
        <SpeciesExplorer
          species={speciesToShow}
          compact
          explorationId={explorationId}
        />
      )}

      <InatUploadPrepDrawer
        open={inatDrawerOpen}
        onOpenChange={setInatDrawerOpen}
        marcheurPrenom={marcheur.prenom}
        marcheurNom={marcheur.nom}
        marcheurSlug={marcheurSlug}
        crewId={crewId}
        resolvedUserId={resolvedUserId}
        explorationId={explorationId}
        explorationMarcheIds={explorationMarcheIds}
        explorationEventIds={explorationEventIds}
        identifiedPhotoUrls={identifiedPhotoUrls}
      />
    </div>

  );
};


// --- Animated circular gauge SVG ---
const CircularGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 56 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score, 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  const color = score >= 70 ? 'hsl(160, 84%, 39%)' : score >= 40 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 0%, 60%)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={3} className="text-muted/30" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-xs font-bold text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
};

// --- Impact block with 3 dynamic metrics ---
const MarcheurImpactBlock: React.FC<{
  marcheur: MarcheurWithStats;
  explorationId?: string;
  explorationMarcheIds?: string[];
  totalMarchesCount?: number;
  isExpanded: boolean;
}> = ({ marcheur, explorationId, explorationMarcheIds: rawMarcheIds, totalMarchesCount: rawCount, isExpanded }) => {
  const explorationMarcheIds = rawMarcheIds || [];
  const totalMarchesCount = rawCount || 0;

  const { data: snapshotsData } = useQuery({
    queryKey: ['marcheur-impact-snapshots', explorationId],
    queryFn: async () => {
      if (!explorationMarcheIds.length) return [];
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, snapshot_date, total_species, birds_count, plants_count, fungi_count')
        .in('marche_id', explorationMarcheIds);
      return data || [];
    },
    enabled: isExpanded && !!explorationId && explorationMarcheIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const snapshots = snapshotsData || [];

  const pioneerCount = useMemo(() => {
    if (!snapshots.length && explorationMarcheIds.length > 0) {
      return Math.min(marcheur.totalContributions > 0 ? explorationMarcheIds.length : 0, explorationMarcheIds.length);
    }
    const snapshotMarcheIds = new Set(snapshots.map(s => s.marche_id));
    const marchesWithoutPriorData = explorationMarcheIds.filter(id => !snapshotMarcheIds.has(id));
    return marcheur.totalContributions > 0 ? marchesWithoutPriorData.length : 0;
  }, [snapshots, explorationMarcheIds, marcheur.totalContributions]);

  const taxonomicGroups = useMemo(() => {
    const species = marcheur.speciesObserved || [];
    const groups: Record<string, { icon: React.ElementType; label: string; color: string; count: number }> = {};
    const snapshotBirds = snapshots.reduce((s, snap) => s + (snap.birds_count || 0), 0);
    const snapshotPlants = snapshots.reduce((s, snap) => s + (snap.plants_count || 0), 0);
    const snapshotFungi = snapshots.reduce((s, snap) => s + (snap.fungi_count || 0), 0);

    if (species.length > 0 || snapshotBirds > 0) {
      groups['oiseaux'] = { icon: Bird, label: 'Oiseaux', color: 'text-sky-500', count: Math.max(species.filter(s => s.scientificName.toLowerCase().includes('aves') || s.scientificName.toLowerCase().includes('bird')).length, snapshotBirds > 0 ? 1 : 0) };
    }
    if (species.length > 0 || snapshotPlants > 0) {
      groups['plantes'] = { icon: Flower2, label: 'Plantes', color: 'text-green-500', count: Math.max(species.filter(s => s.scientificName.toLowerCase().includes('plant')).length, snapshotPlants > 0 ? 1 : 0) };
    }
    if (species.length > 0 || snapshotFungi > 0) {
      groups['champignons'] = { icon: TreePine, label: 'Champignons', color: 'text-amber-600', count: Math.max(species.filter(s => s.scientificName.toLowerCase().includes('fung')).length, snapshotFungi > 0 ? 1 : 0) };
    }
    if (species.length > 0 && Object.values(groups).every(g => g.count === 0)) {
      groups['vivant'] = { icon: Leaf, label: 'Vivant', color: 'text-emerald-500', count: species.length };
    }
    if (Object.keys(groups).length === 0 && snapshots.length > 0) {
      if (snapshotBirds > 0) groups['oiseaux'] = { icon: Bird, label: 'Oiseaux', color: 'text-sky-500', count: snapshotBirds };
      if (snapshotPlants > 0) groups['plantes'] = { icon: Flower2, label: 'Plantes', color: 'text-green-500', count: snapshotPlants };
      if (snapshotFungi > 0) groups['champignons'] = { icon: TreePine, label: 'Champignons', color: 'text-amber-600', count: snapshotFungi };
    }
    return Object.values(groups).filter(g => g.count > 0);
  }, [marcheur.speciesObserved, snapshots]);

  const { score, label: scoreLabel } = useMemo(() => {
    const coverageScore = totalMarchesCount > 0
      ? Math.min((marcheur.totalContributions > 0 ? explorationMarcheIds.length : 0) / totalMarchesCount, 1) * 40
      : 0;
    const speciesScore = Math.min((marcheur.stats.speciesCount || 0) / 20, 1) * 30;
    const mediaTypes = [marcheur.stats.photos > 0, marcheur.stats.sons > 0, marcheur.stats.textes > 0].filter(Boolean).length;
    const diversityScore = (mediaTypes / 3) * 30;
    const total = Math.round(coverageScore + speciesScore + diversityScore);
    let label = 'Explorateur curieux';
    if (total >= 80) label = 'Contributeur remarquable';
    else if (total >= 60) label = 'Explorateur engagé';
    else if (total >= 40) label = 'Marcheur attentif';
    return { score: total, label };
  }, [marcheur, explorationMarcheIds, totalMarchesCount]);

  const hasAnyData = pioneerCount > 0 || taxonomicGroups.length > 0 || score > 0;
  if (!hasAnyData) {
    return (
      <div className="px-3 py-6 text-center">
        <TrendingUp className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground italic">
          Impact en cours de calcul
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className="mx-3 my-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/10"
    >
      <div className="space-y-3">
        {pioneerCount > 0 && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {pioneerCount} territoire{pioneerCount > 1 ? 's' : ''} pionnier{pioneerCount > 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Aucune donnée biodiversité n'existait avant votre passage
              </p>
            </div>
          </motion.div>
        )}

        {taxonomicGroups.length > 0 && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">
                {taxonomicGroups.length} famille{taxonomicGroups.length > 1 ? 's' : ''} du vivant
              </p>
              <div className="flex flex-wrap gap-1.5">
                {taxonomicGroups.map((group, i) => (
                  <motion.span
                    key={group.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 dark:bg-white/5 text-[10px] font-medium"
                  >
                    <group.icon className={`w-3 h-3 ${group.color}`} />
                    <span className="text-foreground">{group.label}</span>
                    <span className="text-muted-foreground">{group.count}</span>
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {score > 0 && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="flex items-center gap-3 pt-1">
            <CircularGauge score={score} />
            <div>
              <p className="text-xs font-semibold text-foreground">Indice de contribution</p>
              <p className="text-[10px] text-muted-foreground">{scoreLabel}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// --- Sub-tab navigation pills ---
const subTabConfig: { key: MarcheurSubTab; label: string; icon: React.ElementType }[] = [
  { key: 'observations', label: 'Observations', icon: Camera },
  { key: 'ecoute', label: 'Écoute', icon: Headphones },
  { key: 'textes', label: 'Textes', icon: Feather },
  { key: 'temoignage', label: 'Témoignage', icon: Quote },
  { key: 'contributions', label: 'Contributions', icon: Leaf },
  { key: 'impact', label: 'Votre impact', icon: TrendingUp },
];

// --- Témoignage sub-tab: poetic display of marcheur's testimony ---
const TemoignageSubTab: React.FC<{ testimony: EventTestimony }> = ({ testimony }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="m-3 relative overflow-hidden rounded-2xl border border-rose-500/15 bg-gradient-to-br from-rose-500/5 via-transparent to-amber-500/5 p-6 sm:p-8"
  >
    <Quote className="absolute top-3 left-3 w-10 h-10 text-rose-400/20" strokeWidth={1.5} />
    <Quote className="absolute bottom-3 right-3 w-8 h-8 text-rose-400/10 rotate-180" strokeWidth={1.5} />
    <blockquote className="relative z-10 pt-6 px-2">
      <p className="font-serif italic text-base sm:text-lg leading-relaxed text-foreground/90 text-center">
        {testimony.quote}
      </p>
      <footer className="mt-4 text-right text-xs text-muted-foreground tracking-wide">
        — {testimony.author_name}
      </footer>
    </blockquote>
  </motion.div>
);

// --- Textes sub-tab: marcheur's written texts (own + public from others) ---
const TextesSubTab: React.FC<{
  userId?: string | null;
  crewId?: string | null;
  explorationEventIds?: string[];
  explorationId?: string;
}> = ({ userId, crewId, explorationEventIds, explorationId }) => {
  const { user: viewer } = useAuth();
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [creditTextId, setCreditTextId] = useState<string | null>(null);
  const { data: isCurator } = useIsCurator(explorationId);

  const { data: textes, isLoading } = useQuery({
    queryKey: ['marcheur-textes-exploration', userId, crewId, explorationEventIds, sort],
    queryFn: async () => {
      if (!explorationEventIds?.length) return [];
      // Pull every text in scope where this marcheur could be the effective author:
      // - typist (user_id), reattributed user (attributed_user_id), reattributed crew (attributed_marcheur_id)
      const orParts: string[] = [];
      if (userId) {
        orParts.push(`user_id.eq.${userId}`);
        orParts.push(`attributed_user_id.eq.${userId}`);
      }
      if (crewId) orParts.push(`attributed_marcheur_id.eq.${crewId}`);
      if (!orParts.length) return [];

      const { data, error } = await supabase
        .from('marcheur_textes')
        .select('*')
        .in('marche_event_id', explorationEventIds)
        .or(orParts.join(','))
        .order('created_at', { ascending: sort === 'asc' });
      if (error) throw error;
      // Effective author resolution (mirrors useExplorationParticipants):
      // - attributed_marcheur_id wins (if present)
      // - else attributed_user_id
      // - else user_id (typist)
      return (data || []).filter((t: any) => {
        if (t.attributed_marcheur_id) return crewId && t.attributed_marcheur_id === crewId;
        if (t.attributed_user_id) return userId && t.attributed_user_id === userId;
        return userId && t.user_id === userId;
      });
    },
    enabled: !!explorationEventIds?.length && (!!userId || !!crewId),
    staleTime: 60_000,
  });

  if (!userId && !crewId) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-xs text-muted-foreground italic">Textes de l'équipe non disponibles</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-xs text-muted-foreground italic">Chargement…</p>
      </div>
    );
  }

  const isOwner = !!viewer && viewer.id === userId;
  const visible = (textes || []).filter((t: any) => t.is_public || isOwner || isCurator);

  if (!visible.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Feather className="w-8 h-8 text-amber-400/40 mb-2" />
        <p className="text-xs text-muted-foreground italic">Aucun texte partagé</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Feather className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-foreground">{visible.length} texte{visible.length > 1 ? 's' : ''}</span>
        </div>
        <SortToggle sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>
      <div className="space-y-2">
        {visible.map((t: any) => (
          <article
            key={t.id}
            className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 to-transparent p-3 space-y-1.5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {t.type_texte && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                  {t.type_texte.replace('-', ' ')}
                </span>
              )}
              {t.titre && (
                <h4 className="text-[13px] font-semibold text-foreground leading-tight">{t.titre}</h4>
              )}
            </div>
            {t.contenu && (
              <p className="text-[12px] text-muted-foreground whitespace-pre-line leading-relaxed">
                {t.contenu}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground/70">
              <span>{format(new Date(t.created_at), 'dd MMM yyyy', { locale: fr })}</span>
              {!t.is_public && isOwner && (
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">Privé</span>
              )}
              {isCurator && explorationId && (
                <button
                  onClick={() => setCreditTextId(t.id)}
                  className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-amber-500/15 text-amber-400 transition-colors"
                  title="Modifier le crédit (auteur réel)"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px]">Crédit</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {creditTextId && explorationId && (
        <MediaAttributionSheet
          open={!!creditTextId}
          onOpenChange={(o) => !o && setCreditTextId(null)}
          source="texte"
          mediaId={creditTextId}
          explorationId={explorationId}
          currentAttributedId={null}
        />
      )}
    </div>
  );
};

// Hook to get real contributions count from biodiversity snapshots
const useWalkerContributionsCount = (prenom: string, nom: string, explorationMarcheIds: string[], explorationId?: string) => {
  const fullNameNorm = normalizeStr(`${prenom} ${nom}`);
  return useQuery({
    queryKey: ['walker-contributions-count', explorationId, fullNameNorm],
    queryFn: async () => {
      if (!explorationMarcheIds.length) return 0;
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', explorationMarcheIds);
      if (!data) return 0;

      const seen = new Set<string>();
      let count = 0;
      for (const snapshot of data) {
        const speciesArr = snapshot.species_data as any[];
        if (!Array.isArray(speciesArr)) continue;
        for (const sp of speciesArr) {
          const attributions = sp.attributions as any[];
          if (!Array.isArray(attributions)) continue;
          for (const attr of attributions) {
            const observerNorm = normalizeStr(attr.observerName || '');
            if (observerNorm.includes(fullNameNorm) || fullNameNorm.includes(observerNorm)) {
              const key = `${sp.scientificName}|${attr.date}|${attr.source}`;
              if (!seen.has(key)) {
                seen.add(key);
                count++;
              }
            }
          }
        }
      }
      return count;
    },
    enabled: !!explorationId && explorationMarcheIds.length > 0,
    staleTime: 60_000,
  });
};

type SentinelleBucketKey = 'bio' | 'aux' | 'eee';

const TIER_CHIP_STYLE: Record<SentinelleTier, string> = {
  aucun:     'bg-muted/40 text-muted-foreground ring-1 ring-border/40',
  eveil:     'bg-gradient-to-br from-stone-400/15 to-stone-400/5 text-stone-500 dark:text-stone-300 ring-1 ring-stone-400/25',
  curieux:   'bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/25',
  ecoute:    'bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/25',
  eclaireur: 'bg-gradient-to-br from-orange-500/15 to-orange-500/5 text-orange-600 dark:text-orange-300 ring-1 ring-orange-500/30',
  engage:    'bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-amber-400/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/40 shadow-[0_0_18px_-6px_rgba(16,185,129,0.55)]',
};

const TIER_SHORT_LABEL_LOCAL: Record<SentinelleTier, string> = {
  aucun:     '',
  eveil:     'Éveil',
  curieux:   'Curieux',
  ecoute:    'Écoute active',
  eclaireur: 'Éclaireur',
  engage:    'Engagé',
};

const SentinelleChip: React.FC<{
  sentinelle: SentinelleResult;
  onActivate: () => void;
  criterionDetails?: import('@/components/community/exploration/impact/ScoreCriterionDrawer').CriterionDetails;
}> = ({ sentinelle, onActivate, criterionDetails }) => {
  const [drawerKey, setDrawerKey] = useState<import('@/components/community/exploration/impact/ScoreCriterionDrawer').CriterionKey | null>(null);
  // Palier 0 : aucun palier affiché — invitation implicite à entrer dans la fréquence
  if (sentinelle.tier === 'aucun') return null;
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onActivate();
    }
  };
  const chip = (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onActivate(); }}
      onKeyDown={handleKey}
      aria-label={`Fréquence ${sentinelle.total} sur 100, ${sentinelle.label}. Voir le détail.`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${TIER_CHIP_STYLE[sentinelle.tier]}`}
    >
      <ShieldCheck className="w-3 h-3" />
      <span className="text-[11px] font-bold tabular-nums leading-none">{sentinelle.total}</span>
      <span className="hidden sm:inline text-[10px] font-medium leading-none opacity-90">{TIER_SHORT_LABEL_LOCAL[sentinelle.tier]}</span>
    </span>
  );
  return (
    <>
      <HoverCard openDelay={150} closeDelay={80}>
        <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
        <HoverCardContent
          side="left"
          align="start"
          className="w-[300px] p-3 bg-popover/95 backdrop-blur border-border shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-semibold">Fréquence {sentinelle.total}/100</span>
            <span className="text-xs text-muted-foreground">{sentinelle.label}</span>
          </div>
          <ScoreBreakdown
            breakdown={sentinelle.breakdown}
            total={sentinelle.total}
            onCriterionSelect={(k) => setDrawerKey(k)}
          />
          {sentinelle.nextTip?.text && (
            <p className="mt-2 text-[11px] text-muted-foreground italic border-t border-border/50 pt-2">
              💡 {sentinelle.nextTip.text}
            </p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground/80 text-center">
            Cliquez sur un critère pour comprendre le calcul.
          </p>
        </HoverCardContent>
      </HoverCard>
      <ScoreCriterionDrawer
        open={drawerKey !== null}
        onOpenChange={(v) => { if (!v) setDrawerKey(null); }}
        criterion={drawerKey}
        breakdown={sentinelle.breakdown}
        details={criterionDetails}
      />
    </>
  );
};

const MarcheurCard: React.FC<{
  marcheur: MarcheurWithStats;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  explorationEventIds: string[];
  explorationId?: string;
  explorationMarcheIds: string[];
  totalMarchesCount: number;
  testimony?: EventTestimony | null;
  contributionsCount?: number;
  sentinelle: SentinelleResult;
  highlightBuckets?: Set<SentinelleBucketKey>;
  marcheurBuckets: { bio: number; aux: number; eee: number };
  sensibleNames?: Array<{ name: string; cat: 'bio' | 'aux' | 'eee' }>;
  uncuratedSpeciesNames?: string[];
  localSpeciesCount?: number;
  onForceOpen: () => void;
  aliases?: string[];
}> = ({ marcheur, index, isExpanded, onToggle, explorationEventIds, explorationId, explorationMarcheIds, totalMarchesCount, testimony, contributionsCount = 0, sentinelle, highlightBuckets, marcheurBuckets, sensibleNames, uncuratedSpeciesNames, localSpeciesCount, onForceOpen, aliases }) => {
  const [activeSubTab, setActiveSubTab] = useState<MarcheurSubTab>('observations');
  const { data: inatProfile } = useMarcheurInatProfile(aliases, explorationMarcheIds);

  const openImpact = () => {
    setActiveSubTab('impact');
    if (!isExpanded) onForceOpen();
  };
  const { user: viewer } = useAuth();
  const initials = `${marcheur.prenom?.[0] || ''}${marcheur.nom?.[0] || ''}`.toUpperCase();
  const totalContribs = marcheur.totalContributions || 0;
  const isCommunity = marcheur.source === 'community';
  const resolvedUserId = marcheur.userId ?? (isCommunity ? marcheur.id.replace('community-', '') : null);
  const resolvedCrewId = marcheur.crewId ?? (marcheur.source === 'crew' ? marcheur.id.replace('crew-', '') : null);
  const photoCount = marcheur.stats.photos + marcheur.stats.videos;
  const audioCount = marcheur.stats.sons || 0;
  const textesCount = marcheur.stats.textes || 0;
  const hasTestimony = !!testimony;

  // Real contributions count provided by parent (single shared query)
  const realContribCount = contributionsCount;
  const hasContent = totalContribs > 0 || realContribCount > 0 || photoCount > 0 || audioCount > 0 || textesCount > 0 || hasTestimony;

  const visibleSubTabs = useMemo(
    () => subTabConfig.filter((t) => t.key !== 'temoignage' || hasTestimony),
    [hasTestimony]
  );

  const subTabCounts: Partial<Record<MarcheurSubTab, number>> = {
    observations: photoCount,
    ecoute: audioCount,
    textes: textesCount,
    temoignage: hasTestimony ? 1 : 0,
    contributions: realContribCount,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-xl bg-card border border-border hover:border-emerald-500/30 transition-colors overflow-hidden"
    >
      {/* Header row */}
      <button
        onClick={hasContent ? onToggle : undefined}
        className={`flex items-center gap-3 p-3 w-full text-left group ${hasContent ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Avatar className="w-10 h-10 ring-2 ring-offset-1 ring-offset-background" style={{ '--tw-ring-color': marcheur.couleur } as React.CSSProperties}>
          {marcheur.avatarUrl ? (
            <AvatarImage src={marcheur.avatarUrl} alt={`${marcheur.prenom} ${marcheur.nom}`} />
          ) : null}
          <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: marcheur.couleur }}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
            <span className="truncate">{marcheur.prenom} {marcheur.nom}</span>
            {inatProfile?.login && (
              <a
                href={inatProfile.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[10px] font-normal text-muted-foreground hover:text-emerald-500 transition-colors flex-shrink-0"
                title={`Profil iNaturalist : @${inatProfile.login}`}
              >
                <ExternalLink className="w-2.5 h-2.5" />
                <span>iNat</span>
              </a>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {marcheur.source === 'crew' ? marcheur.role.replace('_', ' ') : marcheur.role.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Elegant stats badges on the right */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {photoCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 dark:bg-white/5" title={`${photoCount} observation${photoCount > 1 ? 's' : ''} publique${photoCount > 1 ? 's' : ''}`}>
              <Camera className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] font-semibold text-foreground">{photoCount}</span>
            </div>
          )}
          {audioCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 dark:bg-white/5" title={`${audioCount} son${audioCount > 1 ? 's' : ''} partagé${audioCount > 1 ? 's' : ''}`}>
              <Headphones className="w-3 h-3 text-violet-500" />
              <span className="text-[11px] font-semibold text-foreground">{audioCount}</span>
            </div>
          )}
          {textesCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 dark:bg-white/5" title={`${textesCount} texte${textesCount > 1 ? 's' : ''} partagé${textesCount > 1 ? 's' : ''}`}>
              <Feather className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] font-semibold text-foreground">{textesCount}</span>
            </div>
          )}
          {hasTestimony && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20" title="A laissé un témoignage">
              <Quote className="w-3 h-3 text-rose-400" />
            </div>
          )}
          {realContribCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 dark:bg-white/5" title={`${realContribCount} espèce${realContribCount > 1 ? 's' : ''} identifiée${realContribCount > 1 ? 's' : ''}`}>
              <Leaf className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-semibold text-foreground">{realContribCount}</span>
            </div>
          )}

          {/* Bucket highlight pastilles — visible when filter is active */}
          {highlightBuckets?.has('bio') && marcheurBuckets.bio > 0 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30" title={`${marcheurBuckets.bio} bio-indicateur${marcheurBuckets.bio > 1 ? 's' : ''}`}>
              <Flower2 className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{marcheurBuckets.bio}</span>
            </div>
          )}
          {highlightBuckets?.has('aux') && marcheurBuckets.aux > 0 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30" title={`${marcheurBuckets.aux} auxiliaire${marcheurBuckets.aux > 1 ? 's' : ''}`}>
              <Bug className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{marcheurBuckets.aux}</span>
            </div>
          )}
          {highlightBuckets?.has('eee') && marcheurBuckets.eee > 0 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/15 ring-1 ring-rose-500/30" title={`${marcheurBuckets.eee} EEE`}>
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{marcheurBuckets.eee}</span>
            </div>
          )}

          {/* Sentinelle index chip */}
          <SentinelleChip
            sentinelle={sentinelle}
            onActivate={openImpact}
            criterionDetails={{
              marcheurName: `${marcheur.prenom} ${marcheur.nom}`.trim(),
              sensibleNames,
              uncuratedSpeciesNames,
              inatContributionsCount: realContribCount,
              localSpeciesCount: marcheur.stats.localSpeciesCount ?? localSpeciesCount,
              inatSpeciesCount: marcheur.stats.inatSpeciesCount || 0,
              inatPhotosCount: marcheur.stats.inatPhotos || 0,
              localPhotosCount: photoCount,
              pillarsMissing: sentinelle.breakdown.pillars.missing,
            }}
          />
        </div>

        {hasContent && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </button>

      {/* Expanded content with sub-tabs */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-emerald-500/10"
          >
            {/* Sub-tab pills */}
            <div className="flex gap-1 p-2 px-3">
              {visibleSubTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.key;
                const count = subTabCounts[tab.key];
                const showCount = typeof count === 'number' && count > 0;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSubTab(tab.key)}
                    aria-label={showCount ? `${tab.label}, ${count} élément${count! > 1 ? 's' : ''}` : tab.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                    {showCount && (
                      <span
                        className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold tabular-nums transition-colors ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-muted/70 text-muted-foreground'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {activeSubTab === 'observations' && (
                <motion.div key="obs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {(resolvedUserId || resolvedCrewId) ? (
                    <ObservationsSubTab
                      userId={resolvedUserId}
                      crewId={resolvedCrewId}
                      explorationId={explorationId}
                      explorationEventIds={explorationEventIds}
                      stats={marcheur.stats}
                      prenom={marcheur.prenom}
                    />
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground italic">Observations de l'équipe</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSubTab === 'ecoute' && (
                <motion.div key="ecoute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MarcheurAudioPanel
                    ownerUserId={resolvedUserId}
                    ownerCrewId={resolvedCrewId}
                    marcheIds={explorationMarcheIds}
                    marcheEventIds={explorationEventIds}
                    canUpload={!!viewer && !!resolvedUserId && viewer.id === resolvedUserId}
                    viewerUserId={viewer?.id ?? null}
                    variant="inline"
                  />
                </motion.div>
              )}

              {activeSubTab === 'textes' && (
                <motion.div key="textes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TextesSubTab userId={resolvedUserId} crewId={resolvedCrewId} explorationEventIds={explorationEventIds} explorationId={explorationId} />
                </motion.div>
              )}

              {activeSubTab === 'temoignage' && testimony && (
                <motion.div key="temoignage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TemoignageSubTab testimony={testimony} />
                </motion.div>
              )}

              {activeSubTab === 'contributions' && (
                <motion.div key="contribs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ContributionsSubTab marcheur={marcheur} explorationId={explorationId} explorationMarcheIds={explorationMarcheIds} explorationEventIds={explorationEventIds} resolvedUserId={resolvedUserId} aliases={aliases} />
                </motion.div>
              )}

              {activeSubTab === 'impact' && (
                <motion.div key="impact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MarcheurImpactPanel
                    marcheur={marcheur}
                    explorationId={explorationId}
                    explorationMarcheIds={explorationMarcheIds}
                    totalMarchesCount={totalMarchesCount}
                    isExpanded={isExpanded}
                    hasTemoignage={hasTestimony}
                  />
                  <CitizenPlatformsCard
                    marcheur={{ prenom: marcheur.prenom, nom: marcheur.nom, userId: resolvedUserId }}
                    explorationId={explorationId}
                    explorationMarcheIds={explorationMarcheIds}
                  />
                  <PratiquesPorteesCard
                    marcheurId={resolvedCrewId}
                    prenom={marcheur.prenom}
                    explorationId={explorationId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

type SortMode = 'sentinelle-desc' | 'sentinelle-asc' | 'alpha';

const MarcheursTab: React.FC<MarcheursTabProps> = ({ explorationId, marcheEventId, explorationName }) => {
  const { data: marcheurs, isLoading } = useExplorationParticipants(explorationId, marcheEventId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareKit, setShareKit] = useState<ShareKitState | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('sentinelle-desc');
  const [activeBuckets, setActiveBuckets] = useState<Set<SentinelleBucketKey>>(new Set());

  const { data: explorationMarchesData } = useQuery({
    queryKey: ['exploration-marche-ids', explorationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId!);
      return data?.map(d => d.marche_id) || [];
    },
    enabled: !!explorationId,
    staleTime: 10 * 60_000,
  });

  // Fetch all marche_event IDs for this exploration (for media queries)
  const { data: explorationEventIdsData } = useQuery({
    queryKey: ['exploration-event-ids', explorationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_events')
        .select('id')
        .eq('exploration_id', explorationId!);
      return data?.map(e => e.id) || [];
    },
    enabled: !!explorationId,
    staleTime: 10 * 60_000,
  });

  const explorationMarcheIds = explorationMarchesData || [];
  const explorationEventIds = explorationEventIdsData || [];
  const totalContributions = marcheurs?.reduce((sum, m) => sum + m.totalContributions, 0) || 0;

  // === Invités en attente (event_invited_readers non promus) ===
  const knownParticipantUserIds = useMemo(() => {
    const set = new Set<string>();
    (marcheurs || []).forEach(m => { if (m.userId) set.add(m.userId); });
    return set;
  }, [marcheurs]);

  const { data: pendingInvitees = [] } = useQuery({
    queryKey: ['exploration-pending-invitees', explorationId, explorationEventIds],
    enabled: !!explorationId && explorationEventIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: invs } = await supabase
        .from('event_invited_readers')
        .select('user_id, event_id, invite_source, created_at, marche_events!inner(id, title, date_marche)')
        .in('event_id', explorationEventIds)
        .is('promoted_to_participant_at', null);
      const rows = (invs || []) as any[];
      if (rows.length === 0) return [];
      const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
      const { data: profs } = await supabase
        .from('community_profiles')
        .select('user_id, prenom, nom, avatar_url')
        .in('user_id', userIds);
      const profMap = new Map<string, any>();
      (profs || []).forEach((p: any) => profMap.set(p.user_id, p));
      // Dedup by user_id, garder l'invitation la plus récente
      const byUser = new Map<string, any>();
      rows.forEach((r: any) => {
        const prev = byUser.get(r.user_id);
        if (!prev || new Date(r.created_at) > new Date(prev.created_at)) byUser.set(r.user_id, r);
      });
      return Array.from(byUser.values()).map((r: any) => ({
        user_id: r.user_id as string,
        event: r.marche_events,
        invite_source: r.invite_source as string,
        profile: profMap.get(r.user_id) || null,
      }));
    },
  });

  const visiblePendingInvitees = useMemo(
    () => pendingInvitees.filter(i => !knownParticipantUserIds.has(i.user_id)),
    [pendingInvitees, knownParticipantUserIds],
  );


  // Index testimonies by user_id for fast lookup per marcheur card
  const { data: testimonies } = useExplorationTestimonies(explorationId);
  const testimoniesByUser = useMemo(() => {
    const m = new Map<string, EventTestimony>();
    (testimonies || []).forEach((t) => { if (t.user_id) m.set(t.user_id, t); });
    return m;
  }, [testimonies]);

  // Batch alias map (nom + logins iNat/GBIF/eBird) for all marcheurs
  const { data: aliasesByMarcheurId } = useMarcheursAliasesMap(marcheurs);

  // Aggregate set of all known LMDV walker aliases — used to exclude them
  // from the citizen-contributors aggregate row below the list.
  const knownAliases = useMemo(() => {
    const set = new Set<string>();
    aliasesByMarcheurId?.forEach((aliases) => {
      aliases.forEach((a) => set.add(a));
    });
    return set;
  }, [aliasesByMarcheurId]);

  const { data: citizenContributors } = useExplorationCitizenContributors(explorationId, knownAliases);

  // Authoritative editorial curations from L'œil — single query for all marcheurs
  const { data: curationsData } = useQuery({
    queryKey: ['exploration-curations-species-categories', explorationId],
    queryFn: async () => {
      if (!explorationId) return [] as Array<{ entity_id: string | null; category: string | null }>;
      const { data, error } = await supabase
        .from('exploration_curations')
        .select('entity_id, category')
        .eq('exploration_id', explorationId)
        .eq('sense', 'oeil')
        .eq('entity_type', 'species');
      if (error) throw error;
      return data || [];
    },
    enabled: !!explorationId,
    staleTime: 60_000,
  });

  const curationByName = useMemo(() => {
    const map = new Map<string, SpeciesCategory | string | null>();
    (curationsData || []).forEach((c: any) => {
      if (c?.entity_id && c?.category) map.set(c.entity_id, c.category);
    });
    return map;
  }, [curationsData]);

  // Pratiques emblématiques associées par marcheur (sense='main')
  // IMPORTANT : on doit envoyer l'identifiant base (exploration_marcheurs.id = crewId),
  // jamais l'ID UI synthétique (community-…/crew-…).
  const marcheurIdsList = useMemo(
    () => (marcheurs || []).map(m => m.crewId).filter((v): v is string => !!v),
    [marcheurs],
  );
  const { data: pratiquesCountsByMarcheur } = useMarcheursPratiquesCounts(explorationId, marcheurIdsList);

  // Per-marcheur Sentinelle index + sensible buckets — computed once for sort/filter/display
  type Metrics = {
    sentinelle: SentinelleResult;
    buckets: { bio: number; aux: number; eee: number };
    sensibleNames: Array<{ name: string; cat: 'bio' | 'aux' | 'eee' }>;
    uncuratedSpeciesNames: string[];
    localSpeciesCount: number;
  };
  const metricsById = useMemo(() => {
    const map = new Map<string, Metrics>();
    (marcheurs || []).forEach((m) => {
      const names = (m.speciesObserved || []).map(s => s.scientificName).filter(Boolean);
      const buckets = bucketSensibleSpecies(names, curationByName);
      const sensibleNames: Array<{ name: string; cat: 'bio' | 'aux' | 'eee' }> = [
        ...buckets.bioIndicateurs.map(n => ({ name: n, cat: 'bio' as const })),
        ...buckets.auxiliaires.map(n => ({ name: n, cat: 'aux' as const })),
        ...buckets.eee.map(n => ({ name: n, cat: 'eee' as const })),
      ];
      const sensibleSet = new Set(sensibleNames.map(s => s.name));
      const uncuratedSpeciesNames = names.filter(n => !sensibleSet.has(n));
      const inatPhotos = m.stats.inatPhotos || 0;
      const sentinelle = computeSentinelleIndex({
        // Les photos iNat (avec photoUrl) comptent comme contribution photo : active le pilier
        // "photo" et alimente le Volume, sans modifier la formule existante.
        photos: m.stats.photos + m.stats.videos + inatPhotos,
        sons: m.stats.sons || 0,
        textes: m.stats.textes || 0,
        hasTemoignage: !!(m.userId && testimoniesByUser.has(m.userId)),
        speciesCount: m.stats.speciesCount || 0,
        bioCount: buckets.bioIndicateurs.length,
        auxCount: buckets.auxiliaires.length,
        eeeCount: buckets.eee.length,
        pratiquesCount: m.crewId ? (pratiquesCountsByMarcheur?.get(m.crewId) || 0) : 0,
      });
      map.set(m.id, {
        sentinelle,
        buckets: {
          bio: buckets.bioIndicateurs.length,
          aux: buckets.auxiliaires.length,
          eee: buckets.eee.length,
        },
        sensibleNames,
        uncuratedSpeciesNames,
        localSpeciesCount: (m.stats.localSpeciesCount ?? m.stats.speciesCount) || 0,
      });
    });
    return map;
  }, [marcheurs, curationByName, testimoniesByUser, pratiquesCountsByMarcheur]);

  // Bucket counters: how many marcheurs have ≥1 species in each bucket
  const bucketCounts = useMemo(() => {
    let bio = 0, aux = 0, eee = 0;
    metricsById.forEach((m) => {
      if (m.buckets.bio > 0) bio++;
      if (m.buckets.aux > 0) aux++;
      if (m.buckets.eee > 0) eee++;
    });
    return { bio, aux, eee };
  }, [metricsById]);

  const hasAnySensible = bucketCounts.bio + bucketCounts.aux + bucketCounts.eee > 0;

  const toggleBucket = (k: SentinelleBucketKey) => {
    setActiveBuckets(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  // Set of userIds qui sont uniquement invités (non promus, sans contribution)
  // → on les retire de la liste principale pour ne les laisser que dans le bloc « Invités en attente »
  const pendingInviteesUserIds = useMemo(() => {
    const s = new Set<string>();
    (pendingInvitees || []).forEach((i: any) => { if (i.user_id) s.add(i.user_id); });
    return s;
  }, [pendingInvitees]);

  // Sort + filter
  const sortedMarcheurs = useMemo(() => {
    if (!marcheurs?.length) return marcheurs ?? [];
    const collator = new Intl.Collator('fr', { sensitivity: 'base', usage: 'sort' });

    let list = [...marcheurs];

    // Retirer les invités fantômes (crew rows auto-créées au signup, 0 contribution)
    list = list.filter((m) => {
      if (!m.userId) return true;
      if (!pendingInviteesUserIds.has(m.userId)) return true;
      return (m.totalContributions || 0) > 0;
    });

    if (activeBuckets.size > 0) {
      list = list.filter((m) => {
        const b = metricsById.get(m.id)?.buckets;
        if (!b) return false;
        if (activeBuckets.has('bio') && b.bio > 0) return true;
        if (activeBuckets.has('aux') && b.aux > 0) return true;
        if (activeBuckets.has('eee') && b.eee > 0) return true;
        return false;
      });
    }

    const alphaCmp = (a: MarcheurWithStats, b: MarcheurWithStats) => {
      const p = collator.compare(a.prenom || '', b.prenom || '');
      if (p !== 0) return p;
      return collator.compare(a.nom || '', b.nom || '');
    };

    if (sortMode === 'alpha') {
      list.sort(alphaCmp);
    } else {
      const dir = sortMode === 'sentinelle-desc' ? -1 : 1;
      list.sort((a, b) => {
        const sa = metricsById.get(a.id)?.sentinelle.total ?? 0;
        const sb = metricsById.get(b.id)?.sentinelle.total ?? 0;
        const diff = (sa - sb) * dir;
        if (diff !== 0) return diff;
        return alphaCmp(a, b);
      });
    }

    return list;
  }, [marcheurs, metricsById, sortMode, activeBuckets, pendingInviteesUserIds]);

  const createAffiliateLink = async (channel: 'copy' | 'share') => {
    if (!explorationId) {
      toast.error('Exploration introuvable pour générer le lien');
      return null;
    }
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      toast.error(`Authentification indisponible : ${getErrorMessage(authError, 'erreur inconnue')}`);
      return null;
    }
    if (!authData.user) {
      toast.error('Connectez-vous pour inviter un marcheur');
      return null;
    }
    try {
      const { data, error } = await supabase.rpc('generate_community_affiliate_link', {
        _exploration_id: explorationId,
        _channel: channel,
        _marche_event_id: marcheEventId ?? null,
      });
      if (error) {
        toast.error(`Impossible de générer le lien d'invitation : ${getErrorMessage(error, 'erreur inconnue')}`);
        return null;
      }
      const row = Array.isArray(data) ? data[0] : null;
      if (!row?.share_token) {
        toast.error("Lien d'invitation indisponible : aucune donnée renvoyée");
        return null;
      }
      return { url: getAffiliateInviteUrl(row.share_token), generatedCount: row.generated_count ?? 1 };
    } catch (error) {
      toast.error(`Impossible de générer le lien d'invitation : ${getErrorMessage(error, 'erreur inconnue')}`);
      return null;
    }
  };

  const handleShare = async () => {
    const link = await createAffiliateLink('share');
    if (!link) return;
    const text = buildAffiliateShareMessage({ explorationName, inviteUrl: link.url });
    setShareKit({ url: link.url, message: text, generatedCount: link.generatedCount });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Marches du Vivant', text, url: link.url });
        toast.success('Kit partage prêt et lien transmis');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Message de partage copié');
    } catch (error) {
      toast.error(`Lien généré, mais copie impossible : ${getErrorMessage(error, "autorisez l'accès au presse-papier")}`);
    }
  };

  const handleCopyLink = async () => {
    const link = await createAffiliateLink('copy');
    if (!link) return;
    const message = buildAffiliateCopyMessage({ explorationName, inviteUrl: link.url });
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Invitation complète copiée dans le presse-papier');
    } catch (error) {
      toast.error(`Lien généré, mais copie impossible : ${getErrorMessage(error, "autorisez l'accès au presse-papier")}`);
    }
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-28" />
              <div className="h-2.5 bg-muted rounded w-16" />
            </div>
            <div className="flex gap-1">
              <div className="w-10 h-6 bg-muted rounded-full" />
              <div className="w-10 h-6 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  if (!marcheurs?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/15 flex items-center justify-center mb-4">
          <Sprout className="w-7 h-7 text-emerald-400/60" />
        </div>
        <h3 className="text-foreground text-sm font-semibold mb-1">
          Soyez le premier à documenter
        </h3>
        <p className="text-muted-foreground text-xs max-w-xs mb-4">
          Cette exploration attend ses premiers récits. Partagez vos photos, sons et observations pour enrichir le vivant.
        </p>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="w-3.5 h-3.5" />
          Inviter un marcheur
        </Button>
      </motion.div>
    );
  }

  const sortBtn = (mode: SortMode, label: string, icon: React.ReactNode, ariaLabel: string) => {
    const active = sortMode === mode;
    return (
      <button
        type="button"
        onClick={() => setSortMode(mode)}
        aria-pressed={active}
        aria-label={ariaLabel}
        className={`inline-flex items-center gap-1 h-7 px-2 rounded-full text-[11px] font-medium transition-colors ${
          active
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  const bucketChip = (key: SentinelleBucketKey, count: number, label: string, Icon: React.ComponentType<{ className?: string }>, palette: { active: string; idle: string }) => {
    const active = activeBuckets.has(key);
    return (
      <button
        type="button"
        onClick={() => toggleBucket(key)}
        aria-pressed={active}
        aria-label={`Filtrer : marcheurs ayant identifié ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium transition-all ${active ? palette.active : palette.idle}`}
      >
        <Icon className="w-3 h-3" />
        <span>{label}</span>
        <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-background/60 text-[10px] font-semibold tabular-nums">{count}</span>
      </button>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Summary + sort */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-1">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">{sortedMarcheurs.length}{activeBuckets.size > 0 ? ` / ${marcheurs.length}` : ''} marcheur{marcheurs.length > 1 ? 's' : ''}</span>
        </div>
        {totalContributions > 0 && (
          <span className="text-muted-foreground text-xs">
            · {totalContributions} observation{totalContributions > 1 ? 's' : ''} publique{totalContributions > 1 ? 's' : ''}
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1 rounded-full bg-muted/40 dark:bg-white/5 p-0.5" role="group" aria-label="Trier les marcheurs">
          {sortBtn('sentinelle-desc', '', <><ShieldCheck className="w-3 h-3" /><ArrowDownWideNarrow className="w-3 h-3" /></>, 'Trier par Fréquence décroissante')}
          {sortBtn('sentinelle-asc',  '', <><ShieldCheck className="w-3 h-3" /><ArrowUpNarrowWide className="w-3 h-3" /></>, 'Trier par Fréquence croissante')}
          {sortBtn('alpha', 'A→Z', null, 'Trier par ordre alphabétique')}
        </div>
      </div>

      {/* Sensible-species filter chips */}
      {hasAnySensible && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mr-0.5">Espèces remarquables</span>
          {bucketCounts.bio > 0 && bucketChip('bio', bucketCounts.bio, 'Bio', Flower2, {
            active: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40',
            idle: 'bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70 hover:bg-emerald-500/10',
          })}
          {bucketCounts.aux > 0 && bucketChip('aux', bucketCounts.aux, 'Auxiliaire', Bug, {
            active: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40',
            idle: 'bg-amber-500/5 text-amber-600/70 dark:text-amber-400/70 hover:bg-amber-500/10',
          })}
          {bucketCounts.eee > 0 && bucketChip('eee', bucketCounts.eee, 'EEE', AlertTriangle, {
            active: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/40',
            idle: 'bg-rose-500/5 text-rose-600/70 dark:text-rose-400/70 hover:bg-rose-500/10',
          })}
          {activeBuckets.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveBuckets(new Set())}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Effacer les filtres d'espèces remarquables"
            >
              <XIcon className="w-3 h-3" />
              Tout
            </button>
          )}
        </div>
      )}

      {/* Cards — all closed by default */}
      {sortedMarcheurs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border bg-muted/20">
          <Sprout className="w-6 h-6 text-muted-foreground/60 mb-2" />
          <p className="text-xs text-muted-foreground max-w-xs">
            Aucun marcheur ne correspond à ces filtres pour l'instant.
          </p>
          <button
            type="button"
            onClick={() => setActiveBuckets(new Set())}
            className="mt-3 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Voir tous les marcheurs
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedMarcheurs.map((m, i) => {
            const metrics = metricsById.get(m.id)!;
            return (
              <MarcheurCard
                key={m.id}
                marcheur={m}
                index={i}
                isExpanded={expandedId === m.id}
                onToggle={() => setExpandedId(prev => prev === m.id ? null : m.id)}
                onForceOpen={() => setExpandedId(m.id)}
                explorationEventIds={explorationEventIds}
                explorationId={explorationId}
                explorationMarcheIds={explorationMarcheIds}
                totalMarchesCount={explorationMarcheIds.length}
                testimony={m.userId ? testimoniesByUser.get(m.userId) ?? null : null}
                contributionsCount={m.stats.speciesCount || 0}
                sentinelle={metrics.sentinelle}
                marcheurBuckets={metrics.buckets}
                sensibleNames={metrics.sensibleNames}
                uncuratedSpeciesNames={metrics.uncuratedSpeciesNames}
                localSpeciesCount={metrics.localSpeciesCount}
                highlightBuckets={activeBuckets}
                aliases={aliasesByMarcheurId?.get(m.id)}
              />
            );
          })}
          {citizenContributors && citizenContributors.contributors.length > 0 && (
            <CitizenContributorsAggregateRow contributors={citizenContributors.contributors} totalUniqueSpecies={citizenContributors.totalUniqueSpecies} />
          )}
        </div>
      )}

      {/* Invités en attente — hors total marcheurs */}
      {visiblePendingInvitees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50/40 dark:border-amber-400/20 dark:bg-amber-500/5 p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <MailOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              Invités en attente · {visiblePendingInvitees.length}
            </span>
            <span className="text-[11px] text-muted-foreground">(non comptés dans le total)</span>
          </div>
          <ul className="space-y-1.5">
            {visiblePendingInvitees.map((inv) => {
              const p = inv.profile;
              const display = p ? `${p.prenom || ''} ${p.nom || ''}`.trim() || 'Marcheur invité' : 'Marcheur invité';
              const initials = p?.prenom?.[0]?.toUpperCase() || '?';
              return (
                <li key={inv.user_id} className="flex items-center gap-2.5 rounded-lg bg-background/60 dark:bg-white/[0.02] px-2.5 py-1.5">
                  <Avatar className="h-7 w-7 ring-1 ring-amber-400/40">
                    {p?.avatar_url ? <AvatarImage src={p.avatar_url} alt={display} /> : null}
                    <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{display}</p>
                    {inv.event?.title && (
                      <p className="text-[10px] text-muted-foreground truncate">Invité pour « {inv.event.title} »</p>
                    )}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    En attente
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}

      {/* Engagement block */}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-amber-500/5 border border-emerald-500/15"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sprout className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-0.5">Invitez un marcheur</p>
            <p className="text-xs text-muted-foreground mb-3">
              Chaque marcheur enrichit le récit collectif du vivant. Partagez cette exploration !
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs h-8">
                <Copy className="w-3 h-3" />
                Copier le lien
              </Button>
              <Button size="sm" onClick={handleShare} className="gap-1.5 text-xs h-8">
                <Share2 className="w-3 h-3" />
                Partager
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={!!shareKit} onOpenChange={(open) => !open && setShareKit(null)}>
        <DialogContent className="max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-card-foreground">
              <Wand2 className="h-5 w-5 text-primary" />
              Kit partage prêt
            </DialogTitle>
            <DialogDescription>
              Une page publique dédiée, une URL trackée et un suivi d'impact pour vos invitations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Livrable 1</p>
                <p className="text-sm font-medium text-foreground">Message prêt à partager</p>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border/50 bg-card p-3 text-sm leading-relaxed text-foreground">
                {shareKit?.message}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!shareKit) return;
                    await navigator.clipboard.writeText(shareKit.message);
                    toast.success('Message copié');
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Copier le message
                </Button>
                <Button size="sm" asChild>
                  <a href={shareKit?.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ouvrir la landing
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Livrables 2 & 3</p>
                <p className="text-sm font-medium text-foreground">URL affiliée + suivi</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-3">
                <p className="mb-2 text-xs text-muted-foreground">URL de partage</p>
                <p className="break-all text-sm text-foreground">{shareKit?.url}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-card p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Liens générés</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{shareKit?.generatedCount ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Mesure activée</p>
                  <p className="mt-1 text-sm font-medium text-foreground">clics, vues et comptes créés</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  if (!shareKit) return;
                  await navigator.clipboard.writeText(shareKit.url);
                  toast.success('URL trackée copiée');
                }}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copier uniquement l'URL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MarcheursTab;
