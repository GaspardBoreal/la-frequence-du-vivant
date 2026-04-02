import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bird, TreePine, Leaf, Bug, Layers, Sparkles } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { BiodiversitySpecies } from '@/types/biodiversity';
import SpeciesExplorer from '@/components/biodiversity/SpeciesExplorer';

type SubTab = 'synthese' | 'taxons' | 'analyse';

interface SpeciesEntry {
  scientificName: string;
  commonName: string;
  kingdom: string;
  observations: number;
  family?: string;
}

interface EventBiodiversityTabProps {
  explorationId?: string;
  marcheEventId?: string;
}

const categoryConfig: Record<CategoryFilter, { label: string; icon: typeof Bird; color: string; bgColor: string }> = {
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
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

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

  // Extract species from species_data
  const allSpecies = useMemo((): SpeciesEntry[] => {
    if (!snapshots?.length) return [];
    const speciesMap = new Map<string, SpeciesEntry>();
    snapshots.forEach(snap => {
      const speciesData = snap.species_data as any[] | null;
      if (!speciesData || !Array.isArray(speciesData)) return;
      speciesData.forEach((sp: any) => {
        const key = sp.scientificName || sp.commonName || sp.id;
        if (!key) return;
        const existing = speciesMap.get(key);
        if (existing) {
          existing.observations += sp.observations || 1;
        } else {
          speciesMap.set(key, {
            scientificName: sp.scientificName || '',
            commonName: sp.commonName || sp.scientificName || '',
            kingdom: sp.kingdom || 'Other',
            observations: sp.observations || 1,
            family: sp.family,
          });
        }
      });
    });
    return Array.from(speciesMap.values()).sort((a, b) => b.observations - a.observations);
  }, [snapshots]);

  const categoryCounts = useMemo((): Record<CategoryFilter, number> => {
    const counts: Record<CategoryFilter, number> = { all: allSpecies.length, birds: 0, plants: 0, fungi: 0, others: 0 };
    allSpecies.forEach(sp => {
      if (sp.kingdom === 'Animalia') counts.birds++;
      else if (sp.kingdom === 'Plantae') counts.plants++;
      else if (sp.kingdom === 'Fungi') counts.fungi++;
      else counts.others++;
    });
    return counts;
  }, [allSpecies]);

  const filteredSpecies = useMemo(() => {
    if (categoryFilter === 'all') return allSpecies;
    const kingdomMap: Record<string, string> = { birds: 'Animalia', plants: 'Plantae', fungi: 'Fungi', others: 'Other' };
    return allSpecies.filter(s => s.kingdom === kingdomMap[categoryFilter]);
  }, [allSpecies, categoryFilter]);

  const getCategoryIcon = (kingdom: string) => {
    switch (kingdom) {
      case 'Animalia': return <Bird className="w-3.5 h-3.5 text-sky-500" />;
      case 'Plantae': return <TreePine className="w-3.5 h-3.5 text-green-500" />;
      case 'Fungi': return <Leaf className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Bug className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  // Empty state
  if (!isLoading && (!snapshots?.length)) {
    return (
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
        <div className="mt-5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Collecte à venir</span>
        </div>
      </motion.div>
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

        {/* TAXONS */}
        {activeSubTab === 'taxons' && (
          <motion.div key="taxons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Category filter */}
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {(Object.keys(categoryConfig) as CategoryFilter[]).map(cat => {
                const cfg = categoryConfig[cat];
                const Icon = cfg.icon;
                const isActive = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? `${cfg.bgColor} ${cfg.color} ring-1 ring-current/20`
                        : 'text-muted-foreground hover:text-foreground bg-muted/30'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}{categoryCounts[cat] > 0 ? ` (${categoryCounts[cat]})` : ''}
                  </button>
                );
              })}
            </div>

            {filteredSpecies.length > 0 ? (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                {filteredSpecies.map((sp, i) => (
                  <motion.div
                    key={sp.scientificName || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(sp.kingdom)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sp.commonName}</p>
                      {sp.scientificName !== sp.commonName && (
                        <p className="text-[10px] text-muted-foreground italic truncate">{sp.scientificName}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">{sp.observations}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingDown className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {allSpecies.length === 0
                    ? 'Aucune donnée espèce détaillée disponible'
                    : 'Aucune espèce dans cette catégorie'}
                </p>
              </div>
            )}
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
