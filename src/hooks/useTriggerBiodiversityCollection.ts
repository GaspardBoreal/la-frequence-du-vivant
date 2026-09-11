import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { explorationSpeciesCountKey } from '@/hooks/useExplorationSpeciesCount';

interface CollectionResult {
  success: boolean;
  marchesProcessed: number;
  totalSpecies: number;
  errors: number;
  logId?: string;
  alreadyCollected?: boolean;
  message?: string;
}

interface TriggerArgs {
  explorationId: string;
  /** Bypass the 24h rate limit (used when rayon a changé). */
  force?: boolean;
  /** Limiter la collecte à un sous-ensemble de marches. */
  marcheIds?: string[];
}

export const useTriggerBiodiversityCollection = () => {
  const queryClient = useQueryClient();

  return useMutation<CollectionResult, Error, TriggerArgs | string>({
    mutationFn: async (arg) => {
      const body = typeof arg === 'string' ? { explorationId: arg } : arg;
      const { data, error } = await supabase.functions.invoke('collect-event-biodiversity', {
        body,
      });
      if (error) throw new Error(error.message || 'Collection failed');
      return data as CollectionResult;
    },
    onSuccess: (_data, arg) => {
      const explorationId = typeof arg === 'string' ? arg : arg?.explorationId;
      // ⚠️ Les clés doivent correspondre EXACTEMENT à celles lues par les vues :
      // react-query fait du préfixe par élément, donc 'event-biodiversity-snapshots'
      // n'invalide PAS 'event-biodiversity-snapshots-all'.
      [
        'event-biodiversity-snapshots',
        'event-biodiversity-snapshots-all',
        'event-marcheur-observations',
        'exploration-marche-ctx',
        'event-all-marches',
        'exploration-biodiversity',
        'exploration-marche-ids',
        'exploration-species-pool-rpc',
        'exploration-marcheurs-names',
        'biodiversity-snapshots',
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

      if (explorationId) {
        queryClient.invalidateQueries({
          queryKey: explorationSpeciesCountKey(explorationId),
        });
      }
    },
  });
};
