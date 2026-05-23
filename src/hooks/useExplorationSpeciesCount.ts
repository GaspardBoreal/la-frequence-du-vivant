import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unified species count for an exploration — single source of truth.
 *
 * Powered by the SQL RPC `get_exploration_species_count`, which unions:
 *  - all biodiversity_snapshots.species_data for the exploration's marches
 *  - all marcheur_observations on those marches
 * deduplicated by `lower(unaccent(trim(scientific_name)))`.
 *
 * Carnet, Carte, Synthèse, and Chatbot all consume this hook so their
 * counts are guaranteed to match.
 *
 * Freshness: react-query invalidation (called from mutations) + optional
 * Realtime subscription (`realtime: true`) for changes from other clients
 * or background edge-function resyncs.
 */
export interface ExplorationSpeciesCount {
  total: number;
  by_kingdom: { animalia: number; plantae: number; fungi: number; others: number };
  by_source: { snapshots_only: number; marcheur_only: number; both: number };
  species: Array<{ sci: string; kingdom: string; in_snapshot: boolean; in_marcheur: boolean }>;
}

export const explorationSpeciesCountKey = (id: string | null | undefined) =>
  ['exploration-species-count', id] as const;

export const useExplorationSpeciesCount = (
  explorationId: string | null | undefined,
  options?: { realtime?: boolean },
) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: explorationSpeciesCountKey(explorationId),
    enabled: !!explorationId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    queryFn: async (): Promise<ExplorationSpeciesCount> => {
      const { data, error } = await supabase.rpc('get_exploration_species_count', {
        p_exploration_id: explorationId!,
      });
      if (error) throw error;
      const r = (data as any) || {};
      // eslint-disable-next-line no-console
      console.log('[species-count] exploration=%s total=%s source=rpc', explorationId, r.total);
      return {
        total: r.total ?? 0,
        by_kingdom: r.by_kingdom ?? { animalia: 0, plantae: 0, fungi: 0, others: 0 },
        by_source: r.by_source ?? { snapshots_only: 0, marcheur_only: 0, both: 0 },
        species: r.species ?? [],
      };
    },
  });

  // Optional Realtime subscription — invalidates the query on any change
  // to marcheur_observations / biodiversity_snapshots tied to this exploration.
  useEffect(() => {
    if (!options?.realtime || !explorationId) return;
    const channel = supabase
      .channel(`exploration-species-${explorationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'marcheur_observations' },
        () => qc.invalidateQueries({ queryKey: explorationSpeciesCountKey(explorationId) }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'biodiversity_snapshots' },
        () => qc.invalidateQueries({ queryKey: explorationSpeciesCountKey(explorationId) }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [explorationId, options?.realtime, qc]);

  return query;
};

/** Helper used by mutations (add/remove obs, resync) to refresh the count. */
export const invalidateExplorationSpeciesCount = (
  qc: ReturnType<typeof useQueryClient>,
  explorationId: string | null | undefined,
) => {
  qc.invalidateQueries({ queryKey: explorationSpeciesCountKey(explorationId) });
};
