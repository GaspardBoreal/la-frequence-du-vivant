import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExplorationPage {
  id: string;
  exploration_id: string;
  type: string;
  ordre: number;
  nom: string;
  description?: string;
  config?: any;
  created_at: string;
  updated_at: string;
}

// Hook pour récupérer les pages spécifiques d'une exploration
export const useExplorationPages = (explorationId: string) => {
  return useQuery({
    queryKey: ['exploration-pages', explorationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_exploration_pages', {
        exploration_id_param: explorationId
      });
      
      if (error) throw error;
      return data as ExplorationPage[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationId,
  });
};