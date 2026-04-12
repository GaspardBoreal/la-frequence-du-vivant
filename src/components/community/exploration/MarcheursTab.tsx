import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, BookOpen, Leaf, Copy, Share2, Users, Sprout, ChevronDown, ExternalLink, Eye, Image, FileText, TrendingUp, MapPin, Bird, Flower2, TreePine, Wand2, Send, Link as LinkIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useExplorationParticipants, MarcheurWithStats, SpeciesObservation } from '@/hooks/useExplorationParticipants';
import { useSpeciesTranslationBatch } from '@/hooks/useSpeciesTranslation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buildAffiliateCopyMessage, buildAffiliateShareMessage, getAffiliateInviteUrl } from '@/utils/communityAffiliate';
import SortToggle from '@/components/community/contributions/SortToggle';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

type MarcheurSubTab = 'observations' | 'contributions' | 'impact';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};

// --- Observations sub-tab: photos sorted by date ---
const ObservationsSubTab: React.FC<{ userId: string; explorationEventIds?: string[]; stats: MarcheurWithStats['stats']; prenom: string }> = ({ userId, explorationEventIds, stats, prenom }) => {
  const [sort, setSort] = useState<'desc' | 'asc'>('asc');

  const { data: photos, isLoading } = useQuery({
    queryKey: ['marcheur-observations-photos', userId, explorationEventIds],
    queryFn: async () => {
      let query = supabase
        .from('marcheur_medias')
        .select('id, url_fichier, external_url, titre, type_media, created_at')
        .eq('user_id', userId)
        .eq('is_public', true)
        .in('type_media', ['photo', 'video'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (explorationEventIds?.length) query = query.in('marche_event_id', explorationEventIds);
      const { data } = await query;
      return data || [];
    },
    staleTime: 60_000,
  });

  const sorted = useMemo(() => {
    if (!photos) return [];
    const items = [...photos];
    items.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === 'desc' ? diff : -diff;
    });
    return items;
  }, [photos, sort]);

  const totalMedia = stats.photos + stats.videos;

  return (
    <div className="px-3 pt-3 pb-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-foreground">{totalMedia}</span> photo{totalMedia > 1 ? 's' : ''}
        </p>
        <SortToggle sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {sorted.map((photo, i) => {
            const url = photo.url_fichier || photo.external_url;
            if (!url) return null;
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
                  src={url}
                  alt={photo.titre || `Photo ${i + 1}`}
                  className="aspect-square w-full rounded-xl object-cover ring-1 ring-border/50 group-hover:ring-emerald-500/40 transition-all"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-white/90 truncate">{photo.titre || dateStr}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          Aucune observation visuelle partagée
        </p>
      )}
    </div>
  );
};

// Normalize string: remove accents/diacritics, lowercase, trim
const normalizeStr = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

// --- Contributions sub-tab: species from biodiversity snapshots ---
const ContributionsSubTab: React.FC<{ marcheur: MarcheurWithStats; explorationId?: string; explorationMarcheIds: string[] }> = ({ marcheur, explorationId, explorationMarcheIds }) => {
  const [sort, setSort] = useState<'desc' | 'asc'>('asc');
  const fullNameNorm = normalizeStr(`${marcheur.prenom} ${marcheur.nom}`);

  const { data: speciesFromSnapshots, isLoading } = useQuery({
    queryKey: ['marcheur-contributions-species', explorationId, fullNameNorm],
    queryFn: async () => {
      if (!explorationMarcheIds.length) return [];
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', explorationMarcheIds);
      if (!data) return [];

      const results: Array<{
        scientificName: string;
        commonName: string;
        kingdom: string;
        photoUrl: string | null;
        date: string;
        source: string;
        originalUrl: string | null;
      }> = [];

      for (const snapshot of data) {
        const speciesArr = snapshot.species_data as any[];
        if (!Array.isArray(speciesArr)) continue;
        for (const sp of speciesArr) {
          const attributions = sp.attributions as any[];
          if (!Array.isArray(attributions)) continue;
          for (const attr of attributions) {
            const observerNorm = normalizeStr(attr.observerName || '');
            if (observerNorm.includes(fullNameNorm) || fullNameNorm.includes(observerNorm)) {
              const photoUrl = sp.photoData?.url || (Array.isArray(sp.photos) && sp.photos.length > 0 ? sp.photos[0] : null);
              results.push({
                scientificName: sp.scientificName || '',
                commonName: sp.commonName || '',
                kingdom: sp.kingdom || '',
                photoUrl,
                date: attr.date || '',
                source: attr.source || '',
                originalUrl: attr.originalUrl || null,
              });
            }
          }
        }
      }

      // Deduplicate by scientificName+date+source to avoid exact duplicates across snapshots
      const seen = new Set<string>();
      return results.filter(r => {
        const key = `${r.scientificName}|${r.date}|${r.source}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: !!explorationId && explorationMarcheIds.length > 0,
    staleTime: 60_000,
  });

  const species = speciesFromSnapshots || [];
  const speciesForTranslation = species.map(s => ({ scientificName: s.scientificName, commonName: s.commonName }));
  const { data: translations } = useSpeciesTranslationBatch(speciesForTranslation);
  const translationMap = new Map(translations?.map(t => [t.scientificName, t]) || []);

  const getKingdomInfo = (kingdom: string) => {
    if (kingdom === 'Animalia') return { icon: Bird, color: 'text-sky-500', bgColor: 'bg-sky-500/10', label: 'Faune' };
    if (kingdom === 'Plantae') return { icon: Flower2, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Flore' };
    if (kingdom === 'Fungi') return { icon: TreePine, color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Champignon' };
    return { icon: Leaf, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Vivant' };
  };

  const sourceLabel = (src: string) => {
    if (src === 'inaturalist') return 'iNat';
    if (src === 'ebird') return 'eBird';
    if (src === 'gbif') return 'GBIF';
    return src;
  };

  const sorted = useMemo(() => {
    const items = [...species];
    items.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === 'desc' ? diff : -diff;
    });
    return items;
  }, [species, sort]);

  if (isLoading) {
    return (
      <div className="px-3 pt-3 pb-3 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 bg-muted rounded w-16" />
              <div className="h-3 bg-muted rounded w-32" />
              <div className="h-2.5 bg-muted rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <Leaf className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground italic">
          Aucune espèce identifiée pour le moment
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Identifiez les espèces via l'onglet Vivant 🌿
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-foreground">{sorted.length}</span> espèce{sorted.length > 1 ? 's' : ''} identifiée{sorted.length > 1 ? 's' : ''}
        </p>
        <SortToggle sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>

      <div className="space-y-2">
        {sorted.map((obs, i) => {
          const translation = translationMap.get(obs.scientificName);
          const frenchName = translation?.commonName || obs.commonName;
          const kingdomInfo = getKingdomInfo(obs.kingdom);
          const KingdomIcon = kingdomInfo.icon;
          const dateStr = obs.date
            ? format(new Date(obs.date), 'd MMM', { locale: fr })
            : '';

          return (
            <motion.a
              key={`${obs.scientificName}-${i}`}
              href={obs.originalUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 dark:bg-white/[0.03] border border-border/50 hover:border-emerald-500/20 transition-colors block"
            >
              {obs.photoUrl ? (
                <img
                  src={obs.photoUrl}
                  alt={obs.scientificName}
                  className="w-11 h-11 rounded-xl object-cover ring-1 ring-emerald-500/20 flex-shrink-0"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className={`w-11 h-11 rounded-xl ${kingdomInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <KingdomIcon className={`w-5 h-5 ${kingdomInfo.color}/60`} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <KingdomIcon className={`w-3 h-3 flex-shrink-0 ${kingdomInfo.color}`} />
                  <span className={`text-[9px] font-medium ${kingdomInfo.color} uppercase tracking-wider`}>
                    {kingdomInfo.label}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate italic mt-0.5">
                  {obs.scientificName}
                </p>
                {frenchName && frenchName !== obs.scientificName && (
                  <p className="text-[10px] text-muted-foreground truncate capitalize">
                    {frenchName}
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                {dateStr && (
                  <p className="text-[10px] text-muted-foreground/70">{dateStr}</p>
                )}
                {obs.source && (
                  <p className="text-[9px] text-muted-foreground/50">{sourceLabel(obs.source)}</p>
                )}
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
};

// CTA Science block (shared)
const CitizenScienceCTA: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
    className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-emerald-500/5 to-amber-500/5 border border-emerald-500/15"
  >
    <p className="text-[11px] font-medium text-foreground mb-1">
      🔬 Devenez contributeur citoyen !
    </p>
    <p className="text-[10px] text-muted-foreground mb-2.5 leading-relaxed">
      Chaque observation nourrit la connaissance du vivant. Créez un compte pour que vos découvertes comptent dans la science mondiale.
    </p>
    <div className="flex gap-2">
      <a
        href="https://www.inaturalist.org/signup"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 transition-colors"
      >
        iNaturalist <ExternalLink className="w-2.5 h-2.5" />
      </a>
      <a
        href="https://ebird.org/register"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 transition-colors"
      >
        eBird <ExternalLink className="w-2.5 h-2.5" />
      </a>
    </div>
  </motion.div>
);

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
  { key: 'contributions', label: 'Contributions', icon: Leaf },
  { key: 'impact', label: 'Votre impact', icon: TrendingUp },
];

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

const MarcheurCard: React.FC<{
  marcheur: MarcheurWithStats;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  explorationEventIds: string[];
  explorationId?: string;
  explorationMarcheIds: string[];
  totalMarchesCount: number;
}> = ({ marcheur, index, isExpanded, onToggle, explorationEventIds, explorationId, explorationMarcheIds, totalMarchesCount }) => {
  const [activeSubTab, setActiveSubTab] = useState<MarcheurSubTab>('observations');
  const initials = `${marcheur.prenom?.[0] || ''}${marcheur.nom?.[0] || ''}`.toUpperCase();
  const totalContribs = marcheur.totalContributions || 0;
  const isCommunity = marcheur.source === 'community';
  const userId = isCommunity ? marcheur.id.replace('community-', '') : null;
  const photoCount = marcheur.stats.photos + marcheur.stats.videos;
  
  // Real contributions count from biodiversity snapshots
  const { data: contributionsCount } = useWalkerContributionsCount(marcheur.prenom, marcheur.nom, explorationMarcheIds, explorationId);
  const realContribCount = contributionsCount || 0;
  const hasContent = totalContribs > 0 || realContribCount > 0;

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
          <p className="text-sm font-semibold text-foreground truncate">
            {marcheur.prenom} {marcheur.nom}
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
          {realContribCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 dark:bg-white/5" title={`${realContribCount} espèce${realContribCount > 1 ? 's' : ''} identifiée${realContribCount > 1 ? 's' : ''}`}>
              <Leaf className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-semibold text-foreground">{realContribCount}</span>
            </div>
          )}
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
              {subTabConfig.map(tab => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSubTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {activeSubTab === 'observations' && (
                <motion.div key="obs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {isCommunity && userId ? (
                    <ObservationsSubTab userId={userId} explorationEventIds={explorationEventIds} stats={marcheur.stats} prenom={marcheur.prenom} />
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground italic">Observations de l'équipe</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSubTab === 'contributions' && (
                <motion.div key="contribs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ContributionsSubTab marcheur={marcheur} explorationId={explorationId} explorationMarcheIds={explorationMarcheIds} />
                </motion.div>
              )}

              {activeSubTab === 'impact' && (
                <motion.div key="impact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MarcheurImpactBlock
                    marcheur={marcheur}
                    explorationId={explorationId}
                    explorationMarcheIds={explorationMarcheIds}
                    totalMarchesCount={totalMarchesCount}
                    isExpanded={isExpanded}
                  />
                  <CitizenScienceCTA />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MarcheursTab: React.FC<MarcheursTabProps> = ({ explorationId, marcheEventId, explorationName }) => {
  const { data: marcheurs, isLoading } = useExplorationParticipants(explorationId, marcheEventId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareKit, setShareKit] = useState<ShareKitState | null>(null);

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">{marcheurs.length} marcheur{marcheurs.length > 1 ? 's' : ''}</span>
        </div>
        {totalContributions > 0 && (
          <span className="text-muted-foreground text-xs">
            · {totalContributions} observation{totalContributions > 1 ? 's' : ''} publique{totalContributions > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Cards — all closed by default */}
      <div className="space-y-2">
        {marcheurs.map((m, i) => (
          <MarcheurCard
            key={m.id}
            marcheur={m}
            index={i}
            isExpanded={expandedId === m.id}
            onToggle={() => setExpandedId(prev => prev === m.id ? null : m.id)}
            explorationEventIds={explorationEventIds}
            explorationId={explorationId}
            explorationMarcheIds={explorationMarcheIds}
            totalMarchesCount={explorationMarcheIds.length}
          />
        ))}
      </div>

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
