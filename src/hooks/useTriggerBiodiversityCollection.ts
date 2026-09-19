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
  started?: boolean;
  marchesTotal?: number;
  message?: string;
}

/** La collecte tourne en tâche de fond côté serveur : on suit le journal. */
const waitForCollection = async (logId: string, totalSteps: number): Promise<CollectionResult> => {
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    const { data } = await supabase
      .from('data_collection_logs')
      .select('status, marches_processed, errors_count, summary_stats')
      .eq('id', logId)
      .maybeSingle();
    if (!data) continue;
    if (data.status === 'completed' || data.status === 'failed') {
      return {
        success: data.status === 'completed',
        marchesProcessed: data.marches_processed ?? 0,
        totalSpecies: (data.summary_stats as any)?.total_species_collected ?? 0,
        errors: data.errors_count ?? 0,
        logId,
        marchesTotal: totalSteps,
      };
    }
  }
  throw new Error("La collecte prend plus de temps que prévu. Elle continue en arrière-plan : rechargez la page dans quelques minutes.");
};

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
      const result = data as CollectionResult;
      if (result?.started && result.logId) {
        return await waitForCollection(result.logId, result.marchesTotal ?? 0);
      }
      return result;
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
