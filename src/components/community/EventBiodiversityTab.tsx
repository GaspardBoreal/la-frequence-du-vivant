import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bird, TreePine, Leaf, Bug, Layers, Sparkles, BookOpenText } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { BiodiversitySpecies } from '@/types/biodiversity';
import SpeciesExplorer from '@/components/biodiversity/SpeciesExplorer';
import RadiusSelector from '@/components/biodiversity/RadiusSelector';
import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import BiodiversityRevealAnimation from '@/components/community/BiodiversityRevealAnimation';
import { useTriggerBiodiversityCollection } from '@/hooks/useTriggerBiodiversityCollection';
import { useExplorationParticipants } from '@/hooks/useExplorationParticipants';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import TextesEcritsSubTab from './exploration/TextesEcritsSubTab';
import BiodiversityEvolutionChart from './exploration/BiodiversityEvolutionChart';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';
import { useFrenchSpeciesNames } from '@/hooks/useFrenchSpeciesNames';
import { useChatTabSnapshot } from '@/hooks/useChatPageContext';
import { useSpeciesFilteredByPeriod } from '@/hooks/useSpeciesFilteredByPeriod';
import type { EvolutionPeriod, DateSource } from '@/hooks/useBiodiversityEvolution';
import { isSpeciesWithinRadius, isObservationWithinRadius, type MarcheGeoCtx } from '@/utils/speciesRadiusFilter';


import TestimoniesTab from './insights/testimonies/TestimoniesTab';
import ExplorationRadiusSummary from './exploration/ExplorationRadiusSummary';
import PackVivantButton from './PackVivantButton';
import AnalyseIAStepper from './analyse/AnalyseIAStepper';
import PreuveParLaDataCard from './exploration/PreuveParLaDataCard';

// Explorations DEVIAT « Marcher sur un sol qui respire » — affichent le bloc
// éditorial « Preuve par la data » en tête de l'onglet Synthèse.
const DEVIAT_RESPIRE_EXPLORATIONS: Record<string, string> = {
  '70fcd8d1-7f63-43c8-a2bd-2cd436523437':
    'Lors de cette marche « Éco poétique » (10 km), un petit groupe de citoyens a documenté scientifiquement les espèces réelles sur l\'exploitation. Cette data appartient à l\'agriculteur et constitue une preuve irréfutable de la richesse écologique de ses terres.',
};

type SubTab = 'synthese' | 'taxons' | 'temoignages' | 'textes' | 'analyse';


interface EventBiodiversityTabProps {
  explorationId?: string;
  marcheEventId?: string;
  eventType?: string | null;
  onNavigateToMarche?: (marcheId: string) => void;
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

const EventBiodiversityTab: React.FC<EventBiodiversityTabProps> = ({ explorationId, marcheEventId, eventType, onNavigateToMarche }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('synthese');
  const [revealActive, setRevealActive] = useState(false);
  const [taxonsPeriod, setTaxonsPeriod] = useState<EvolutionPeriod>('all');
  const [taxonsCustomRange, setTaxonsCustomRange] = useState<{ from?: string; to?: string }>({});
  const [taxonsDateSource, setTaxonsDateSource] = useState<DateSource>('observation');

  // Deep-link from global search: switch sub-tab based on `lfdv:focus` event.
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind?: string; sub?: string };
      const allowed: SubTab[] = ['synthese', 'taxons', 'temoignages', 'textes', 'analyse'];
      if (detail?.sub && (allowed as string[]).includes(detail.sub)) {
        setActiveSubTab(detail.sub as SubTab);
        return;
      }
      if (detail?.kind === 'species') setActiveSubTab('taxons');
      else if (detail?.kind === 'testimony') setActiveSubTab('temoignages');
      else if (detail?.kind === 'text') setActiveSubTab('textes');
    };
    window.addEventListener('lfdv:focus', handler as EventListener);
    return () => window.removeEventListener('lfdv:focus', handler as EventListener);
  }, []);

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

  // Get marche IDs + per-marche geo context (lat/lon + resolved radius_m) for radius filtering
  const { data: marcheCtxData } = useQuery({
    queryKey: ['exploration-marche-ctx', explorationId],
    queryFn: async () => {
      if (!explorationId) return { ids: [] as string[], ctxById: new Map<string, MarcheGeoCtx>() };
      const { data } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches(latitude, longitude, radius_m), explorations(default_radius_m)')
        .eq('exploration_id', explorationId);
      const ids: string[] = [];
      const ctxById = new Map<string, MarcheGeoCtx>();
      (data || []).forEach((row: any) => {
        if (!row.marche_id) return;
        ids.push(row.marche_id);
        const m = row.marches || {};
        const e = row.explorations || {};
        ctxById.set(row.marche_id, {
          latitude: m.latitude ?? null,
          longitude: m.longitude ?? null,
          radius_m: m.radius_m ?? e.default_radius_m ?? 500,
        });
      });
      return { ids, ctxById };
    },
    enabled: !!explorationId,
  });
  const marcheIds = marcheCtxData?.ids;
  const marcheCtxById = marcheCtxData?.ctxById;


  // Fetch ALL biodiversity snapshots for these marches.
  // Aligné avec la RPC unifiée `get_exploration_species_count` (Carnet/Carte):
  // l'union de tous les snapshots ∪ marcheur_observations donne le comptage
  // canonique. La dédup finale se fait par scientificName normalisé dans le
  // builder de pool plus bas, donc lister tous les snapshots ne double-compte
  // jamais une espèce.
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['event-biodiversity-snapshots-all', marcheIds],
    queryFn: async () => {
      if (!marcheIds?.length) return [];
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('*')
        .in('marche_id', marcheIds)
        .order('snapshot_date', { ascending: false });
      return data || [];
    },
    enabled: !!marcheIds?.length,
  });

  // Filtrer côté lecture le species_data de chaque snapshot par le rayon résolu
  // de sa marche (override marches.radius_m → exploration.default_radius_m).
  // Aligne la courbe « Pouls du vivant » avec Carte/L'Œil/compteur header.
  const filteredSnapshots = useMemo(() => {
    if (!snapshots?.length || !marcheCtxById) return snapshots;
    return snapshots.map((snap: any) => {
      const ctx = marcheCtxById.get(snap.marche_id);
      if (!ctx) return snap;
      const geoCtx: MarcheGeoCtx = {
        latitude: ctx.latitude,
        longitude: ctx.longitude,
        radius_m: ctx.radius_m,
        snapshot_radius_m: snap.radius_meters,
      };
      const filteredSp = (snap.species_data || []).filter((sp: any) =>
        isSpeciesWithinRadius(sp, geoCtx),
      );
      return { ...snap, species_data: filteredSp };
    });
  }, [snapshots, marcheCtxById]);





  // Fetch marcheur observations (incl. iNat backfill) for these marches.
  // Source de vérité complémentaire des snapshots : permet d'intégrer dans
  // le simulateur et la carte les observations rattachées aux marcheurs avec
  // leurs GPS exacts iNaturalist.
  const { data: marcheurObs } = useQuery({
    queryKey: ['event-marcheur-observations', marcheIds],
    queryFn: async () => {
      if (!marcheIds?.length) return [];
      // ⚠️ Pas de !inner : on doit aussi récupérer les obs iNat backfill
      // dont le marcheur n'a pas (encore) de ligne exploration_marcheurs.
      // Sinon le pool fusionné perd 8 espèces vs la Carte.
      const { data } = await supabase
        .from('marcheur_observations')
        .select(`
          id, marche_id, marcheur_id, species_scientific_name,
          observation_date, photo_url, inaturalist_observation_id,
          latitude, longitude,
          exploration_marcheurs(prenom, nom)
        `)
        .in('marche_id', marcheIds)
        .not('species_scientific_name', 'is', null);
      return data || [];
    },
    enabled: !!marcheIds?.length,
  });

  // Filtre par rayon les marcheur_observations brutes (avant injection dans
  // le « Pouls du vivant »). Même règle que le RPC unifié : pas de GPS →
  // conservée (fallback legacy), sinon haversine ≤ radius_m.
  const filteredMarcheurObsForTimeline = useMemo(() => {
    if (!marcheCtxById || !marcheurObs) return marcheurObs;
    return marcheurObs.filter((o: any) => {
      const ctx = marcheCtxById.get(o.marche_id);
      if (!ctx) return true;
      return isObservationWithinRadius(o, ctx);
    });
  }, [marcheurObs, marcheCtxById]);
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

  // Marches count (from snapshots, source of analysis units)
  const marchesCount = snapshots?.length || 0;

  // Transform species_data into BiodiversitySpecies[] for SpeciesExplorer.
  // Fusionne snapshots iNat + marcheur_observations (avec leurs GPS exacts)
  // pour que le simulateur et la carte voient la donnée la plus complète.
  const allSpeciesAsBiodiversity = useMemo((): BiodiversitySpecies[] => {
    if (!snapshots?.length && !marcheurObs?.length) return [];
    const speciesMap = new Map<string, BiodiversitySpecies>();

    // Normalisation NFD + lowercase pour aligner snapshots et marcheur_observations
    // (même stratégie que useExplorationBiodiversitySummary côté Carte).
    const normKey = (s: string | null | undefined) =>
      (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

    // Dedupe par originalUrl (= URL iNat) si dispo, sinon par observerName+source+date.
    // Évite de compter deux fois une même observation iNat présente à la fois
    // dans biodiversity_snapshots et dans marcheur_observations.
    const dedupeAttributions = (attrs: any[]): any[] => {
      const seen = new Set<string>();
      return attrs.filter(a => {
        const url = (a.originalUrl || '').toString().trim();
        const name = (a.observerName || '').trim();
        if (!name && !url) return false;
        const key = url || `${name}|${a.source || ''}|${a.date || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const computeLastSeen = (attrs: any[], fallback: string): string => {
      let maxTs = -Infinity;
      let maxIso = '';
      (attrs || []).forEach((a) => {
        const d = a?.date;
        if (!d) return;
        const ts = new Date(d).getTime();
        if (!Number.isFinite(ts)) return;
        if (ts > maxTs) {
          maxTs = ts;
          maxIso = typeof d === 'string' ? d : new Date(d).toISOString();
        }
      });
      return maxIso || fallback || '';
    };

    const maxIsoDate = (a: string, b: string): string => {
      const ta = a ? new Date(a).getTime() : -Infinity;
      const tb = b ? new Date(b).getTime() : -Infinity;
      if (!Number.isFinite(ta) && !Number.isFinite(tb)) return a || b || '';
      return tb > ta ? b : a;
    };

    // 1. Snapshots iNat — filtre par rayon résolu de chaque marche
    (snapshots || []).forEach(snap => {
      const speciesData = snap.species_data as any[] | null;
      if (!speciesData || !Array.isArray(speciesData)) return;
      const ctx = marcheCtxById?.get(snap.marche_id);
      const snapR = (snap as any).radius_meters ?? null;
      speciesData.forEach((sp: any) => {
        if (ctx && !isSpeciesWithinRadius(sp, { ...ctx, snapshot_radius_m: snapR })) return;
        const key = normKey(sp.scientificName || sp.commonName || sp.id);
        if (!key) return;

        const spAttributions = Array.isArray(sp.attributions) ? sp.attributions : [];
        const computedLastSeen = computeLastSeen(spAttributions, snap.snapshot_date || '');
        const existing = speciesMap.get(key);
        if (existing) {
          existing.observations += sp.observations || 1;
          existing.attributions = dedupeAttributions([
            ...(existing.attributions || []),
            ...spAttributions,
          ]);
          existing.lastSeen = maxIsoDate(existing.lastSeen, computedLastSeen);
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
            iconicTaxon: sp.iconicTaxon || sp.iconic_taxon_name || undefined,
            observations: sp.observations || 1,
            lastSeen: computedLastSeen,
            source: (sp.source as BiodiversitySpecies['source']) || 'inaturalist',
            attributions: dedupeAttributions(spAttributions),
          });
        }
      });
    });

    // 2. marcheur_observations — chaque ligne = 1 attribution (avec GPS exact iNat)
    //    Filtre par rayon résolu de la marche (si GPS dispo).
    (marcheurObs || []).forEach((o: any) => {
      const ctx = marcheCtxById?.get(o.marche_id);
      if (ctx && !isObservationWithinRadius(o, ctx)) return;
      const sciName = o.species_scientific_name;
      const key = normKey(sciName);
      if (!key) return;

      const crew = o.exploration_marcheurs;
      const observerName = `${crew?.prenom || ''} ${crew?.nom || ''}`.trim() || 'Contributeur iNaturalist';
      const inatId = o.inaturalist_observation_id;
      const attribution: any = {
        observerName,
        source: inatId ? 'inaturalist' : 'marcheur',
        date: o.observation_date,
        exactLatitude: typeof o.latitude === 'number' ? o.latitude : null,
        exactLongitude: typeof o.longitude === 'number' ? o.longitude : null,
        photoUrl: o.photo_url || undefined,
        originalUrl: inatId ? `https://www.inaturalist.org/observations/${inatId}` : undefined,
        observerInstitution: inatId ? 'iNaturalist Community' : 'Marcheur',
      };
      const existing = speciesMap.get(key);
      const lastSeen = o.observation_date || '';
      if (existing) {
        const merged = dedupeAttributions([...(existing.attributions || []), attribution]);
        // N'incrémenter que si l'attribution n'était pas déjà déduplicquée
        if (merged.length > (existing.attributions?.length || 0)) {
          existing.observations += 1;
          existing.attributions = merged;
        }
        existing.lastSeen = maxIsoDate(existing.lastSeen, lastSeen);
      } else {
        speciesMap.set(key, {
          id: key,
          scientificName: sciName,
          commonName: sciName,
          kingdom: 'Other' as BiodiversitySpecies['kingdom'],
          family: '',
          observations: 1,
          lastSeen,
          source: 'inaturalist',
          attributions: [attribution],
        });
      }
    });

    return Array.from(speciesMap.values()).sort((a, b) => b.observations - a.observations);
  }, [snapshots, marcheurObs, marcheCtxById]);

  // Resolve French names once at the source, before passing to SpeciesExplorer.
  // Mirrors the strategy used by useExplorationSpeciesPool / Bioacoustique view.
  const { data: frNamesMap } = useFrenchSpeciesNames(
    allSpeciesAsBiodiversity.map(s => ({
      scientificName: s.scientificName,
      commonName: s.commonName,
    }))
  );

  const allSpeciesWithFrNames = useMemo((): BiodiversitySpecies[] => {
    if (!frNamesMap || frNamesMap.size === 0) return allSpeciesAsBiodiversity;
    return allSpeciesAsBiodiversity.map(sp => {
      const fr = sp.scientificName ? frNamesMap.get(sp.scientificName) : undefined;
      return fr?.displayName ? { ...sp, commonName: fr.displayName } : sp;
    });
  }, [allSpeciesAsBiodiversity, frNamesMap]);

  // Unified stats — derived from the union pool (snapshots ∪ marcheur_observations).
  // Single source of truth: Carte, Synthèse, Pouls header all show this value.
  const stats = useMemo(() => {
    let birds = 0, plants = 0, fungi = 0, others = 0;
    allSpeciesAsBiodiversity.forEach(sp => {
      if (sp.kingdom === 'Animalia') birds++;
      else if (sp.kingdom === 'Plantae') plants++;
      else if (sp.kingdom === 'Fungi') fungi++;
      else others++;
    });
    return { total: allSpeciesAsBiodiversity.length, birds, plants, fungi, others, marchesCount };
  }, [allSpeciesAsBiodiversity, marchesCount]);

  // Publie le snapshot exact affiché à l'écran pour que le chatbot voie la même
  // chose que l'utilisateur (priorité absolue sur les agrégats globaux du RPC).
  useChatTabSnapshot('synthese.stats', {
    total: stats.total,
    faune: stats.birds,
    flore: stats.plants,
    champignons: stats.fungi,
    autres: stats.others,
    marches_count: marchesCount,
    source: 'snapshots ∪ marcheur_observations',
  });

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
    { key: 'temoignages', label: 'Témoignages' },
    ...(eventType === 'eco_poetique' ? [{ key: 'textes' as SubTab, label: 'Textes écrits' }] : []),
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
            {explorationId && DEVIAT_RESPIRE_EXPLORATIONS[explorationId] && (
              <div className="mb-6">
                <PreuveParLaDataCard
                  explorationId={explorationId}
                  description={DEVIAT_RESPIRE_EXPLORATIONS[explorationId]}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-3">
              {stats.marchesCount} étape{stats.marchesCount > 1 ? 's' : ''} analysée{stats.marchesCount > 1 ? 's' : ''}
            </p>
            <ExplorationRadiusSummary
              explorationId={explorationId}
              userRole={userProfile?.role}
            />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <AnimatedStat value={stats.total} label="Espèces totales" icon={Layers} color={categoryConfig.all.color} bgColor={categoryConfig.all.bgColor} delay={0} />
              <AnimatedStat value={stats.birds} label="Faune" icon={Bird} color={categoryConfig.birds.color} bgColor={categoryConfig.birds.bgColor} delay={100} />
              <AnimatedStat value={stats.plants} label="Flore" icon={TreePine} color={categoryConfig.plants.color} bgColor={categoryConfig.plants.bgColor} delay={200} />
              <AnimatedStat value={stats.fungi} label="Champignons" icon={Leaf} color={categoryConfig.fungi.color} bgColor={categoryConfig.fungi.bgColor} delay={300} />
              <AnimatedStat value={stats.others} label="Autre" icon={Bug} color={categoryConfig.others.color} bgColor={categoryConfig.others.bgColor} delay={400} />
            </div>
            

            {explorationId && (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Pack Vivant — Téléchargez toutes les espèces
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Rapport illustré + classeur Excel + coordonnées GPS + cartographie (GeoJSON · KML).
                      Prêt pour l'analyse, la documentation et le partage.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <PackVivantButton explorationId={explorationId} level="walker" variant="default" size="sm" />
                    <PackVivantButton explorationId={explorationId} level="organizer" variant="outline" size="sm" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAXONS — via SpeciesExplorer unifié */}
        {activeSubTab === 'taxons' && (
          <TaxonsSubTab
            snapshots={filteredSnapshots}
            marcheurObs={filteredMarcheurObsForTimeline}
            allSpeciesWithFrNames={allSpeciesWithFrNames}
            allEventMarchesData={allEventMarchesData}
            eventParticipants={eventParticipants}
            explorationId={explorationId}
            onNavigateToMarche={onNavigateToMarche}
            period={taxonsPeriod}
            customRange={taxonsCustomRange}
            dateSource={taxonsDateSource}
            onPeriodChange={setTaxonsPeriod}
            onCustomRangeChange={setTaxonsCustomRange}
            onDateSourceChange={setTaxonsDateSource}
          />
        )}


        {/* TÉMOIGNAGES */}
        {activeSubTab === 'temoignages' && (
          <motion.div key="temoignages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TestimoniesTab explorationId={explorationId} />
          </motion.div>
        )}

        {/* TEXTES ÉCRITS (eco_poetique only) */}
        {activeSubTab === 'textes' && (
          <motion.div key="textes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TextesEcritsSubTab explorationId={explorationId} marcheEventId={marcheEventId} onNavigateToMarche={onNavigateToMarche} />
          </motion.div>
        )}

        {/* ANALYSE IA — Stepper immersif (Découverte → Trophique → Indicateurs) */}
        {activeSubTab === 'analyse' && (
          <motion.div
            key="analyse"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AnalyseIAStepper
              explorationId={explorationId}
              species={allSpeciesWithFrNames}
              totalSpecies={stats.total}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

interface TaxonsSubTabProps {
  snapshots: any[] | undefined;
  marcheurObs?: any[] | undefined;
  allSpeciesWithFrNames: BiodiversitySpecies[];
  allEventMarchesData: SpeciesMarcheData[] | undefined;
  eventParticipants: Array<{ name: string; source: 'community' | 'crew' }>;
  explorationId?: string;
  onNavigateToMarche?: (marcheId: string) => void;
  period: EvolutionPeriod;
  customRange: { from?: string; to?: string };
  dateSource: DateSource;
  onPeriodChange: (p: EvolutionPeriod) => void;
  onCustomRangeChange: (r: { from?: string; to?: string }) => void;
  onDateSourceChange: (s: DateSource) => void;
}

const TaxonsSubTab: React.FC<TaxonsSubTabProps> = ({
  snapshots, marcheurObs, allSpeciesWithFrNames, allEventMarchesData, eventParticipants,
  explorationId, onNavigateToMarche,
  period, customRange, dateSource,
  onPeriodChange, onCustomRangeChange, onDateSourceChange,
}) => {
  const speciesFiltered = useSpeciesFilteredByPeriod(allSpeciesWithFrNames, {
    period, customRange, dateSource,
  });

  return (
    <motion.div key="taxons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <BiodiversityEvolutionChart
        snapshots={snapshots}
        marcheurObs={marcheurObs}


        overrideTotalSpecies={speciesFiltered.length}
        marchesById={new Map(
          (allEventMarchesData || []).map(m => [
            m.marcheId,
            { name: m.marcheName, ville: m.ville, latitude: m.latitude, longitude: m.longitude },
          ])
        )}
        onNavigateToMarche={onNavigateToMarche}
        explorationId={explorationId}
        allEventMarches={allEventMarchesData}
        period={period}
        onPeriodChange={onPeriodChange}
        customRange={customRange}
        onCustomRangeChange={onCustomRangeChange}
        dateSource={dateSource}
        onDateSourceChange={onDateSourceChange}
      />
      <SpeciesExplorer
        species={speciesFiltered}
        compact
        explorationId={explorationId}
        allEventMarches={allEventMarchesData}
        eventParticipants={eventParticipants}
        trophicPool={allSpeciesWithFrNames}
      />
    </motion.div>
  );
};

export default EventBiodiversityTab;

