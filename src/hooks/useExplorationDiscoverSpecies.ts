import { useMemo } from 'react';
import { useExplorationSpeciesPool } from './useExplorationSpeciesPool';
import type { BiodiversitySpecies } from '@/types/biodiversity';

/**
 * Adapter: maps the unified exploration species pool to the BiodiversitySpecies[]
 * shape expected by <DiscoverFullscreen /> (modes Enfant / Immersif / Prospectif 2100).
 */
export const useExplorationDiscoverSpecies = (explorationId: string | null | undefined) => {
  const query = useExplorationSpeciesPool(explorationId);

  const species = useMemo<BiodiversitySpecies[]>(() => {
    const pool = query.data || [];
    return pool.map((s): BiodiversitySpecies => {
      const kingdomRaw = (s.group || '').toLowerCase();
      let kingdom: BiodiversitySpecies['kingdom'] = 'Other';
      if (kingdomRaw.includes('plant')) kingdom = 'Plantae';
      else if (kingdomRaw.includes('animal') || kingdomRaw.includes('aves') || kingdomRaw.includes('insect') || kingdomRaw.includes('mamm')) kingdom = 'Animalia';
      else if (kingdomRaw.includes('fungi')) kingdom = 'Fungi';

      return {
        id: s.key,
        scientificName: s.scientificName || s.key,
        commonName: s.displayName || s.commonName || s.scientificName || '',
        family: s.family || '',
        kingdom,
        iconicTaxon: s.group || undefined,
        observations: s.count || 0,
        lastSeen: '',
        photos: s.imageUrl ? [s.imageUrl] : [],
        source: 'inaturalist',
        attributions: [],
      };
    });
  }, [query.data]);

  return { ...query, species };
};
