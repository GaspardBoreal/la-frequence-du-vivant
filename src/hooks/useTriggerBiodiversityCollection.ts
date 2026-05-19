import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-biodiversity-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-biodiversity'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marche-ids'] });
      queryClient.invalidateQueries({ queryKey: ['biodiversity-snapshots'] });
    },
  });
};
