import { useMemo } from 'react';
import { useExplorationSpeciesPool, type ExplorationSpecies } from './useExplorationSpeciesPool';
import { classifyFunctions } from '@/lib/ecologicalFunctionsClassification';
import { ECO_FUNCTIONS, type EcoFunction, computeFertilityScore } from '@/lib/ecologicalFunctions';

export interface SpeciesWithFunctions extends ExplorationSpecies {
  functions: EcoFunction[];
}

export interface EcoFunctionsResult {
  buckets: Record<EcoFunction, SpeciesWithFunctions[]>;
  counts: Record<EcoFunction, number>;
  fertilityScore: number;
  totalSpecies: number;
  isLoading: boolean;
}

/**
 * Calcule en mémoire les fonctions écologiques de chaque espèce du pool d'une
 * exploration et renvoie les buckets `{tag → species[]}` + le score de fertilité.
 *
 * Recalculé automatiquement à chaque invalidation de `useExplorationSpeciesPool`
 * (nouvelles observations marcheurs ou snapshots iNat).
 */
export function useEcologicalFunctions(
  explorationId: string | null | undefined,
): EcoFunctionsResult {
  const { data: pool, isLoading } = useExplorationSpeciesPool(explorationId);

  return useMemo(() => {
    const buckets = ECO_FUNCTIONS.reduce((acc, f) => {
      acc[f.value] = [] as SpeciesWithFunctions[];
      return acc;
    }, {} as Record<EcoFunction, SpeciesWithFunctions[]>);

    (pool || []).forEach(sp => {
      const fns = classifyFunctions({
        scientificName: sp.scientificName,
        // group can be either kingdom or iconic — try both
        kingdom: sp.group,
        iconicTaxon: sp.group,
        family: null,
      });
      if (fns.length === 0) return;
      const enriched: SpeciesWithFunctions = { ...sp, functions: fns };
      fns.forEach(f => buckets[f].push(enriched));
    });

    const counts = ECO_FUNCTIONS.reduce((acc, f) => {
      acc[f.value] = buckets[f.value].length;
      return acc;
    }, {} as Record<EcoFunction, number>);

    return {
      buckets,
      counts,
      fertilityScore: computeFertilityScore(buckets),
      totalSpecies: pool?.length || 0,
      isLoading,
    };
  }, [pool, isLoading]);
}
