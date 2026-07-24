import { useMemo } from 'react';
import { usePropertySpeciesPool } from './usePropertySpeciesPool';
import { matchPlantsWithPool } from '@/lib/plantIndicatorMatcher';

/**
 * Croise le KB des 40 bio-indicatrices avec le pool d'espèces
 * agrégées des marches liées à la propriété.
 */
export function usePropertyFloraMatched(proprieteId: string | undefined) {
  const { species, isLoading, explorationIds } = usePropertySpeciesPool(proprieteId);

  const { matches, stats } = useMemo(() => matchPlantsWithPool(species), [species]);

  const hasWalkerData = explorationIds.length > 0 && species.length > 0;

  return { matches, stats, isLoading, hasWalkerData, explorationIds };
}
