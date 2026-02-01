import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch the total count of photos across all marches
 */
export const usePhotosCount = () => {
  return useQuery({
    queryKey: ['photos-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('marche_photos')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
