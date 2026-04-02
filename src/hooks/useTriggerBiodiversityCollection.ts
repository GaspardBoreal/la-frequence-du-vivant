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

export const useTriggerBiodiversityCollection = () => {
  const queryClient = useQueryClient();

  return useMutation<CollectionResult, Error, string>({
    mutationFn: async (explorationId: string) => {
      const { data, error } = await supabase.functions.invoke('collect-event-biodiversity', {
        body: { explorationId },
      });
      if (error) throw new Error(error.message || 'Collection failed');
      return data as CollectionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-biodiversity-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-biodiversity'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marche-ids'] });
    },
  });
};
