import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BiodiversityData, BiodiversityQuery } from '@/types/biodiversity';

export const useBiodiversityData = (query: BiodiversityQuery) => {
  return useQuery({
    queryKey: ['biodiversity', query.latitude, query.longitude, query.radius, query.dateFilter],
    queryFn: async (): Promise<BiodiversityData> => {
      const { data, error } = await supabase.functions.invoke('biodiversity-data', {
        body: query
      });

      if (error) {
        console.error('Erreur lors de la récupération des données de biodiversité:', error);
        throw new Error(error.message || 'Erreur lors de la récupération des données de biodiversité');
      }

      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 heures
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 jours
    enabled: !!(query.latitude && query.longitude),
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};