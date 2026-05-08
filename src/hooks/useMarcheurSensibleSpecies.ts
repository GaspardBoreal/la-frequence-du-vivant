import { useMemo } from 'react';
import { bucketSensibleSpecies, type SensibleBuckets } from '@/lib/speciesClassification';
import type { SpeciesObservation } from '@/hooks/useExplorationParticipants';

/** Classifies a marcheur's observations into ecological-sensitivity buckets. */
export function useMarcheurSensibleSpecies(speciesObserved: SpeciesObservation[] | undefined): SensibleBuckets {
  return useMemo(() => {
    const names = (speciesObserved || []).map(s => s.scientificName).filter(Boolean);
    return bucketSensibleSpecies(names);
  }, [speciesObserved]);
}
