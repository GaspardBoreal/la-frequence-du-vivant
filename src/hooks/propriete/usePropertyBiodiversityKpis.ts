import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeKingdom, type KingdomKey } from '@/lib/kingdomLabels';
import {
  ECO_FUNCTIONS,
  computeFertilityScore,
  type EcoFunction,
} from '@/lib/ecologicalFunctions';
import { resolveEcoFunctions } from '@/lib/ecoFunctionsCascade';

/**
 * Deux indicateurs de biodiversité d'un jardin, calculés à partir des
 * événements de marche qui lui sont rattachés :
 *  1. le vivant recensé (espèces distinctes, par règne) ;
 *  2. les alliés du jardin (espèces portant au moins une fonction écologique).
 *
 * Aucune donnée n'est inventée : si aucun événement n'est rattaché, tout vaut
 * zéro et `hasEvents` est faux — l'écran affiche alors un état vide explicite.
 */

export interface PropertyBiodiversityKpis {
  hasEvents: boolean;
  explorationIds: string[];
  eventCount: number;
  totalSpecies: number;
  byKingdom: Record<KingdomKey, number>;
  kingdomsPresent: number;
  /** Espèces portant au moins une fonction écologique. */
  alliesCount: number;
  /** Part des alliés dans le total, en pourcentage entier. */
  alliesShare: number;
  /** Compte d'espèces par fonction écologique. */
  functionCounts: Record<EcoFunction, number>;
  /** Trois fonctions dominantes, décroissant. */
  topFunctions: Array<{ value: EcoFunction; count: number }>;
  fertilityScore: number;
  /** Provenance des étiquettes. */
  sources: { curated: number; kb: number; auto: number };
  /** Espèces fusionnées, pour le détail (triées par nombre d'observations). */
  species: Array<{
    scientificName: string | null;
    kingdom: KingdomKey;
    functions: EcoFunction[];
    count: number;
  }>;
  isLoading: boolean;
  error: Error | null;
}

const normSci = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

interface MergedSpecies {
  scientificName: string | null;
  group: string | null;
  family: string | null;
  count: number;
}

export function usePropertyBiodiversityKpis(
  proprieteId?: string,
): PropertyBiodiversityKpis {
  // 1. Explorations rattachées via les événements du jardin
  const idsQuery = useQuery({
    queryKey: ['propriete-exploration-ids', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_marche_events')
        .select('marche_events!inner(exploration_id)')
        .eq('propriete_id', proprieteId!);
      if (error) throw error;
      return (data || [])
        .map((r: any) => r.marche_events?.exploration_id)
        .filter((v: any): v is string => !!v);
    },
  });

  const eventExplorationIds = useMemo(() => idsQuery.data || [], [idsQuery.data]);
  const explorationIds = useMemo(
    () => Array.from(new Set(eventExplorationIds)),
    [eventExplorationIds],
  );

  // 2. Pool d'espèces par exploration — même clé de cache que la vue marcheur
  const pools = useQueries({
    queries: explorationIds.map((id) => ({
      queryKey: ['exploration-species-pool-rpc', id, 'v5-unified'],
      staleTime: 60 * 1000,
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_exploration_species_pool', {
          p_exploration_id: id,
        });
        if (error) throw error;
        return ((data as any)?.species as any[]) || [];
      },
    })),
  });

  // 3. Corrections éditoriales des fonctions (curation « L'Œil »)
  const curationsQuery = useQuery({
    queryKey: ['propriete-eco-curations', explorationIds],
    enabled: explorationIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exploration_curations')
        .select('entity_id, entity_type, functions')
        .in('exploration_id', explorationIds)
        .eq('entity_type', 'species');
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  // 4. Espèces fusionnées (dédoublonnage strict par nom scientifique)
  const merged = useMemo(() => {
    const map = new Map<string, MergedSpecies>();
    for (const q of pools) {
      const list: any[] = (q.data as any[]) || [];
      for (const sp of list) {
        const key = normSci(sp?.scientific_name) || normSci(sp?.common_name);
        if (!key) continue;
        const prev = map.get(key);
        if (prev) {
          prev.count += sp.observations || 0;
          if (!prev.group && sp.kingdom) prev.group = sp.kingdom;
          if (!prev.family && sp.family) prev.family = sp.family;
          continue;
        }
        map.set(key, {
          scientificName: sp.scientific_name ?? null,
          group: sp.kingdom || sp.iconic_taxon || null,
          family: sp.family ?? null,
          count: sp.observations || 0,
        });
      }
    }
    return Array.from(map.values());
  }, [pools]);

  const names = useMemo(
    () =>
      Array.from(
        new Set(merged.map((s) => s.scientificName).filter((n): n is string => !!n)),
      ).sort(),
    [merged],
  );

  // 5. Base de connaissances partagée
  const kbQuery = useQuery({
    queryKey: ['species-eco-tags-kb', names],
    enabled: names.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('species_eco_tags_kb' as any)
        .select('scientific_name, tags, confidence')
        .in('scientific_name', names);
      if (error) throw error;
      const m = new Map<string, { tags: EcoFunction[]; confidence: number }>();
      ((data as any[]) || []).forEach((r) =>
        m.set(r.scientific_name, { tags: r.tags || [], confidence: r.confidence ?? 0 }),
      );
      return m;
    },
  });

  const isLoading =
    idsQuery.isLoading ||
    pools.some((q) => q.isLoading) ||
    curationsQuery.isLoading ||
    kbQuery.isLoading;

  const error =
    (idsQuery.error as Error | null) ||
    ((pools.find((q) => q.error)?.error as Error | undefined) ?? null) ||
    (curationsQuery.error as Error | null) ||
    (kbQuery.error as Error | null);

  return useMemo(() => {
    const overrides = new Map<string, EcoFunction[]>();
    (curationsQuery.data || []).forEach((c: any) => {
      if (!c.entity_id || !Array.isArray(c.functions)) return;
      overrides.set(normSci(String(c.entity_id)), c.functions as EcoFunction[]);
    });

    const byKingdom: Record<KingdomKey, number> = {
      plantae: 0, animalia: 0, fungi: 0, others: 0,
    };
    const functionCounts = ECO_FUNCTIONS.reduce((acc, f) => {
      acc[f.value] = 0;
      return acc;
    }, {} as Record<EcoFunction, number>);
    const buckets = ECO_FUNCTIONS.reduce((acc, f) => {
      acc[f.value] = [] as unknown[];
      return acc;
    }, {} as Record<EcoFunction, unknown[]>);

    const sources = { curated: 0, kb: 0, auto: 0 };
    let alliesCount = 0;
    const species: PropertyBiodiversityKpis['species'] = [];

    merged.forEach((sp) => {
      const kingdom = normalizeKingdom(sp.group);
      byKingdom[kingdom] += 1;
      const key = normSci(sp.scientificName);
      const res = resolveEcoFunctions(sp, {
        override: overrides.has(key) ? overrides.get(key)! : undefined,
        kb: kbQuery.data?.get(sp.scientificName || '') ?? null,
      });
      if (res.functions.length > 0) {
        alliesCount += 1;
        if (res.isCurated) sources.curated += 1;
        else if (res.isFromKb) sources.kb += 1;
        else sources.auto += 1;
      }
      res.functions.forEach((f) => {
        functionCounts[f] += 1;
        buckets[f].push(sp);
      });
      species.push({
        scientificName: sp.scientificName,
        kingdom,
        functions: res.functions,
        count: sp.count,
      });
    });
    species.sort((a, b) => b.count - a.count);

    const totalSpecies = merged.length;
    const topFunctions = ECO_FUNCTIONS.map((f) => ({
      value: f.value,
      count: functionCounts[f.value],
    }))
      .filter((f) => f.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      hasEvents: eventExplorationIds.length > 0,
      explorationIds,
      eventCount: eventExplorationIds.length,
      totalSpecies,
      byKingdom,
      kingdomsPresent: (Object.values(byKingdom) as number[]).filter((v) => v > 0).length,
      alliesCount,
      alliesShare: totalSpecies ? Math.round((alliesCount / totalSpecies) * 100) : 0,
      functionCounts,
      topFunctions,
      fertilityScore: computeFertilityScore(buckets),
      sources,
      isLoading,
      error,
    };
  }, [
    merged, curationsQuery.data, kbQuery.data, eventExplorationIds,
    explorationIds, isLoading, error,
  ]);
}
