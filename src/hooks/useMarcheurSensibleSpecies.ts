import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bucketSensibleSpecies, type SensibleBuckets, type SpeciesCategory } from '@/lib/speciesClassification';
import type { SpeciesObservation } from '@/hooks/useExplorationParticipants';

/**
 * Classifies a marcheur's observations into ecological-sensitivity buckets.
 * Source of truth: editorial curations from L'œil (`exploration_curations`,
 * sense='oeil', entity_type='species'), with KB fallback when uncurated.
 *
 * Each species is bucketed under a single primary category — aligned with
 * the unique pastille shown in L'œil — preventing any double-counting.
 */
export function useMarcheurSensibleSpecies(
  speciesObserved: SpeciesObservation[] | undefined,
  explorationId?: string | null,
): SensibleBuckets {
  const { data: curations } = useQuery({
    queryKey: ['exploration-curations-species-categories', explorationId],
    queryFn: async () => {
      if (!explorationId) return [] as Array<{ entity_id: string | null; category: string | null }>;
      const { data, error } = await supabase
        .from('exploration_curations')
        .select('entity_id, category')
        .eq('exploration_id', explorationId)
        .eq('sense', 'oeil')
        .eq('entity_type', 'species');
      if (error) throw error;
      return data || [];
    },
    enabled: !!explorationId,
    staleTime: 60 * 1000,
  });

  const curationByName = useMemo(() => {
    const map = new Map<string, SpeciesCategory | string | null>();
    (curations || []).forEach((c: any) => {
      if (!c?.entity_id || !c?.category) return;
      // Tolerate legacy composite alias keys "Sci | Sci | Common | n" by indexing
      // on the canonical scientific name (1st segment) so curation always wins.
      const canonical = String(c.entity_id).includes(' | ')
        ? String(c.entity_id).split(' | ')[0].trim()
        : c.entity_id;
      map.set(canonical, c.category);
    });
    return map;
  }, [curations]);

  return useMemo(() => {
    const names = (speciesObserved || []).map(s => s.scientificName).filter(Boolean);
    return bucketSensibleSpecies(names, curationByName);
  }, [speciesObserved, curationByName]);
}
