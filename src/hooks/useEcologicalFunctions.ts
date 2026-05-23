import { useMemo } from 'react';
import { useExplorationSpeciesPool, type ExplorationSpecies } from './useExplorationSpeciesPool';
import { classifyFunctions } from '@/lib/ecologicalFunctionsClassification';
import { ECO_FUNCTIONS, type EcoFunction, computeFertilityScore } from '@/lib/ecologicalFunctions';
import { resolveStrate, type PlantStrate } from '@/lib/plantStrate';

export interface SpeciesWithFunctions extends ExplorationSpecies {
  functions: EcoFunction[];
}

export interface EcoFunctionsResult {
  buckets: Record<EcoFunction, SpeciesWithFunctions[]>;
  counts: Record<EcoFunction, number>;
  /** Sous-découpage du bucket `mellifere` par strate végétale. */
  mellifereByStrate: Record<PlantStrate, SpeciesWithFunctions[]>;
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
      const fns = new Set(
        classifyFunctions({
          scientificName: sp.scientificName,
          // group can be either kingdom or iconic — try both
          kingdom: sp.group,
          iconicTaxon: sp.group,
          family: (sp as any).family ?? null,
        }),
      );

      // Pont strate → fonction écologique :
      // Si la strate du genre/espèce est "arbre" ou "arbuste", on tague
      // automatiquement "arbre" (et "haie_bocage" pour les arbustes).
      // Source de vérité partagée avec plantStrate.ts → couvre Marronnier,
      // Platane, Pin, Cèdre, etc. sans dupliquer la connaissance.
      const groupLc = (sp.group || '').toLowerCase();
      const isNonPlant =
        groupLc &&
        !['plantae', 'plants', 'plant', 'fungi', ''].includes(groupLc) &&
        ['animalia', 'mammalia', 'aves', 'insecta', 'arachnida', 'reptilia', 'amphibia', 'mollusca'].includes(groupLc);
      if (sp.scientificName && !isNonPlant) {
        const strate = resolveStrate({ scientificName: sp.scientificName });
        if (strate === 'arbre') fns.add('arbre');
        if (strate === 'arbuste') fns.add('haie_bocage');
      }

      if (fns.size === 0) return;
      const enriched: SpeciesWithFunctions = { ...sp, functions: Array.from(fns) };
      fns.forEach(f => buckets[f].push(enriched));
    });


    const counts = ECO_FUNCTIONS.reduce((acc, f) => {
      acc[f.value] = buckets[f.value].length;
      return acc;
    }, {} as Record<EcoFunction, number>);

    // Découpage du bucket mellifère par strate
    const mellifereByStrate: Record<PlantStrate, SpeciesWithFunctions[]> = {
      arbre: [],
      arbuste: [],
      herbacee: [],
    };
    buckets.mellifere.forEach(sp => {
      const strate = resolveStrate({ scientificName: sp.scientificName });
      mellifereByStrate[strate].push(sp);
    });

    return {
      buckets,
      counts,
      mellifereByStrate,
      fertilityScore: computeFertilityScore(buckets),
      totalSpecies: pool?.length || 0,
      isLoading,
    };
  }, [pool, isLoading]);
}
