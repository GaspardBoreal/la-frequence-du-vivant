import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bird, TreePine, Leaf, Bug, Layers, Sparkles } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { BiodiversitySpecies } from '@/types/biodiversity';
import SpeciesExplorer from '@/components/biodiversity/SpeciesExplorer';
import InsightCardBanner from '@/components/community/insights/InsightCardBanner';
import { useInsightCards } from '@/hooks/useInsightCards';
import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import BiodiversityRevealAnimation from '@/components/community/BiodiversityRevealAnimation';
import { useTriggerBiodiversityCollection } from '@/hooks/useTriggerBiodiversityCollection';
import { useExplorationParticipants } from '@/hooks/useExplorationParticipants';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';

type SubTab = 'synthese' | 'taxons' | 'analyse';


interface EventBiodiversityTabProps {
  explorationId?: string;
  marcheEventId?: string;
}

type SynthCategory = 'all' | 'birds' | 'plants' | 'fungi' | 'others';

const categoryConfig: Record<SynthCategory, { label: string; icon: typeof Bird; color: string; bgColor: string }> = {
  all: { label: 'Tous', icon: Layers, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  birds: { label: 'Faune', icon: Bird, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-500/10' },
  plants: { label: 'Flore', icon: TreePine, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
  fungi: { label: 'Champignons', icon: Leaf, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  others: { label: 'Autre', icon: Bug, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
};

const AnimatedStat: React.FC<{ value: number; label: string; icon: typeof Bird; color: string; bgColor: string; delay: number }> = ({
  value, label, icon: Icon, color, bgColor, delay,
}) => {
  const animatedValue = useAnimatedCounter(value, 1200, delay);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-2"
    >
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className={`text-2xl font-bold ${color}`}>{animatedValue}</span>
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
    </motion.div>
  );
};

const EventBiodiversityTab: React.FC<EventBiodiversityTabProps> = ({ explorationId, marcheEventId }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('synthese');
  const [revealActive, setRevealActive] = useState(false);

  const collectionMutation = useTriggerBiodiversityCollection();

  // Fetch crew + community participants for contributor filter
  const { data: participants } = useExplorationParticipants(explorationId, marcheEventId);
  const { data: marcheurs } = useExplorationMarcheurs(explorationId);

  const eventParticipants = useMemo(() => {
    const list: Array<{ name: string; source: 'community' | 'crew' }> = [];
    const seen = new Set<string>();
    (participants || []).forEach(p => {
      const name = `${p.prenom} ${p.nom}`.trim();
      const key = name.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ name, source: p.source });
      }
    });
    (marcheurs || []).forEach(m => {
      const name = `${m.prenom} ${m.nom}`.trim();
      const key = name.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ name, source: 'crew' });
      }
    });
    return list;
  }, [participants, marcheurs]);

  // Check current user's community role
  const { data: userProfile } = useQuery({
    queryKey: ['current-user-community-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('community_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  const canReveal = userProfile?.role === 'ambassadeur' || userProfile?.role === 'sentinelle';
  const userLevel = (userProfile?.role as CommunityRoleKey) || 'marcheur';

  // Insight cards for contextual banners
  const { cards: insightCards } = useInsightCards({
    userLevel,
    eventType: null,
    angle: 'biodiversite',
    view: 'empreinte',
    displayMode: 'card',
  });

  const handleReveal = useCallback(async () => {
    if (!explorationId || revealActive) return;
    setRevealActive(true);
    try {
      await collectionMutation.mutateAsync(explorationId);
    } catch (err) {
      console.error('Collection failed:', err);
    }
  }, [explorationId, revealActive, collectionMutation]);

  const handleRevealComplete = useCallback(() => {
    setRevealActive(false);
  }, []);

  // Get marche IDs linked to this exploration
  const { data: marcheIds } = useQuery({
    queryKey: ['exploration-marche-ids', explorationId],
    queryFn: async () => {
      if (!explorationId) return [];
      const { data } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);
      return data?.map(d => d.marche_id) || [];
    },
    enabled: !!explorationId,
  });

  // Fetch biodiversity snapshots for these marches
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['event-biodiversity-snapshots', marcheIds],
    queryFn: async () => {
      if (!marcheIds?.length) return [];
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('*')
        .in('marche_id', marcheIds)
        .order('snapshot_date', { ascending: false });
      // Keep only most recent snapshot per marche
      const seen = new Set<string>();
      return (data || []).filter(s => {
        if (seen.has(s.marche_id)) return false;
        seen.add(s.marche_id);
        return true;
      });
    },
    enabled: !!marcheIds?.length,
  });
  // Fetch all event marches with coordinates for the mini-map
  const { data: allEventMarchesData } = useQuery({
    queryKey: ['event-all-marches', explorationId],
    queryFn: async (): Promise<SpeciesMarcheData[]> => {
      if (!explorationId) return [];
      const { data } = await supabase
        .from('exploration_marches')
        .select(`ordre, marche_id, marches (id, nom_marche, ville, latitude, longitude)`)
        .eq('exploration_id', explorationId)
        .in('publication_status', ['published', 'published_public']);
      if (!data) return [];
      return data.map((em: any) => ({
        marcheId: em.marche_id,
        marcheName: em.marches?.nom_marche || em.marches?.ville || '',
        ville: em.marches?.ville || '',
        order: em.ordre ?? 0,
        observationCount: 0,
        latitude: em.marches?.latitude,
        longitude: em.marches?.longitude,
      })).sort((a: SpeciesMarcheData, b: SpeciesMarcheData) => a.order - b.order);
    },
    enabled: !!explorationId,
  });

  // Aggregate stats
  const stats = useMemo(() => {
    if (!snapshots?.length) return { total: 0, birds: 0, plants: 0, fungi: 0, others: 0, marchesCount: 0 };
    // Compute from species_data (source of truth) instead of summary columns
    const speciesMap = new Map<string, string>();
    snapshots.forEach(snap => {
      const sd = snap.species_data as any[] | null;
      if (!sd || !Array.isArray(sd)) return;
      sd.forEach((sp: any) => {
        const key = sp.scientificName || sp.commonName || sp.id;
        if (key && !speciesMap.has(key)) {
          speciesMap.set(key, sp.kingdom || 'Other');
        }
      });
    });
    let birds = 0, plants = 0, fungi = 0, others = 0;
    speciesMap.forEach(kingdom => {
      if (kingdom === 'Animalia') birds++;
      else if (kingdom === 'Plantae') plants++;
      else if (kingdom === 'Fungi') fungi++;
      else others++;
    });
    return { total: speciesMap.size, birds, plants, fungi, others, marchesCount: snapshots.length };
  }, [snapshots]);

  // Transform species_data into BiodiversitySpecies[] for SpeciesExplorer
  const allSpeciesAsBiodiversity = useMemo((): BiodiversitySpecies[] => {
    if (!snapshots?.length) return [];
    const speciesMap = new Map<string, BiodiversitySpecies>();

    // Helper to deduplicate attributions by observerName+source
    const dedupeAttributions = (attrs: any[]): any[] => {
      const seen = new Set<string>();
      return attrs.filter(a => {
        const name = (a.observerName || '').trim();
        if (!name) return false;
        const key = `${name}|${a.source || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    snapshots.forEach(snap => {
      const speciesData = snap.species_data as any[] | null;
      if (!speciesData || !Array.isArray(speciesData)) return;
      speciesData.forEach((sp: any) => {
        const key = sp.scientificName || sp.commonName || sp.id;
        if (!key) return;
        const spAttributions = Array.isArray(sp.attributions) ? sp.attributions : [];
        const existing = speciesMap.get(key);
        if (existing) {
          existing.observations += sp.observations || 1;
          // Merge and deduplicate attributions
          existing.attributions = dedupeAttributions([
            ...(existing.attributions || []),
            ...spAttributions,
          ]);
        } else {
          const kingdom = sp.kingdom === 'Animalia' ? 'Animalia'
            : sp.kingdom === 'Plantae' ? 'Plantae'
            : sp.kingdom === 'Fungi' ? 'Fungi'
            : 'Other';
          speciesMap.set(key, {
            id: key,
            scientificName: sp.scientificName || '',
            commonName: sp.commonName || sp.scientificName || '',
            kingdom: kingdom as BiodiversitySpecies['kingdom'],
            family: sp.family?.toString() || '',
            observations: sp.observations || 1,
            lastSeen: snap.snapshot_date || '',
            source: (sp.source as BiodiversitySpecies['source']) || 'inaturalist',
            attributions: dedupeAttributions(spAttributions),
          });
        }
      });
    });
    return Array.from(speciesMap.values()).sort((a, b) => b.observations - a.observations);
  }, [snapshots]);

  // Empty state
  if (!isLoading && (!snapshots?.length)) {
    return (
      <>
        <BiodiversityRevealAnimation
          isActive={revealActive}
          onComplete={handleRevealComplete}
          result={collectionMutation.data ? {
            marchesProcessed: collectionMutation.data.marchesProcessed,
            totalSpecies: collectionMutation.data.totalSpecies,
            alreadyCollected: collectionMutation.data.alreadyCollected,
          } : null}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center px-4"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/15 flex items-center justify-center mb-5">
            <Leaf className="w-9 h-9 text-emerald-400/60" />
          </div>
          <h3 className="text-foreground text-base font-semibold mb-2">Empreinte en attente</h3>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
            La biodiversité de cet événement n'a pas encore été collectée. Les données apparaîtront ici dès qu'une analyse des territoires traversés sera lancée.
          </p>
          {canReveal && (
            <button
              onClick={handleReveal}
              disabled={revealActive || collectionMutation.isPending}
              className="mt-6 group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-amber-500/5 px-6 py-3 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-emerald-500 group-hover:animate-pulse" />
                </div>
                <div className="text-left">
                  <span className="block text-foreground text-sm font-semibold">
                    Révéler l'empreinte vivante
                  </span>
                  <span className="block text-muted-foreground text-[11px]">
                    Collecter la biodiversité de toutes les étapes
                  </span>
                </div>
              </div>
            </button>
          )}
          {!canReveal && (
            <div className="mt-5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Collecte à venir</span>
            </div>
          )}
        </motion.div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-muted mx-auto mb-2" />
              <div className="h-6 bg-muted rounded w-12 mx-auto mb-1" />
              <div className="h-3 bg-muted rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'synthese', label: 'Synthèse' },
    { key: 'taxons', label: 'Taxons observés' },
    { key: 'analyse', label: 'Analyse IA' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-navigation pills */}
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl w-fit">
        {subTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* SYNTHÈSE */}
        {activeSubTab === 'synthese' && (
          <motion.div key="synthese" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs text-muted-foreground mb-3">
              {stats.marchesCount} étape{stats.marchesCount > 1 ? 's' : ''} analysée{stats.marchesCount > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <AnimatedStat value={stats.total} label="Espèces totales" icon={Layers} color={categoryConfig.all.color} bgColor={categoryConfig.all.bgColor} delay={0} />
              <AnimatedStat value={stats.birds} label="Faune" icon={Bird} color={categoryConfig.birds.color} bgColor={categoryConfig.birds.bgColor} delay={100} />
              <AnimatedStat value={stats.plants} label="Flore" icon={TreePine} color={categoryConfig.plants.color} bgColor={categoryConfig.plants.bgColor} delay={200} />
              <AnimatedStat value={stats.fungi} label="Champignons" icon={Leaf} color={categoryConfig.fungi.color} bgColor={categoryConfig.fungi.bgColor} delay={300} />
              <AnimatedStat value={stats.others} label="Autre" icon={Bug} color={categoryConfig.others.color} bgColor={categoryConfig.others.bgColor} delay={400} />
            </div>
          </motion.div>
        )}

        {/* TAXONS — via SpeciesExplorer unifié */}
        {activeSubTab === 'taxons' && (
          <motion.div key="taxons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SpeciesExplorer
              species={allSpeciesAsBiodiversity}
              compact
              explorationId={explorationId}
              allEventMarches={allEventMarchesData}
              eventParticipants={eventParticipants}
            />
          </motion.div>
        )}

        {/* ANALYSE IA */}
        {activeSubTab === 'analyse' && (
          <motion.div
            key="analyse"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-emerald-500/5 border border-violet-500/15 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-violet-400/60" />
            </div>
            <h3 className="text-foreground text-sm font-semibold mb-1">Analyse écologique IA</h3>
            <p className="text-muted-foreground text-xs max-w-xs leading-relaxed">
              L'intelligence artificielle analysera bientôt la richesse écologique de cet événement : indices de diversité, espèces remarquables, corridors biologiques et recommandations.
            </p>
            <div className="mt-4 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
              <span className="text-violet-600 dark:text-violet-400 text-[10px] font-medium">Bientôt disponible</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventBiodiversityTab;
