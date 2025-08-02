import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BiodiversityData, BiodiversityQuery } from '@/types/biodiversity';

export const useBiodiversityData = (query: BiodiversityQuery) => {
  return useQuery({
    queryKey: ['biodiversity', query.latitude, query.longitude, query.radius, query.dateFilter],
    queryFn: async (): Promise<BiodiversityData> => {
      console.log('🚀 APPEL EDGE FUNCTION biodiversity-data avec query:', query);
      
      const { data, error } = await supabase.functions.invoke('biodiversity-data', {
        body: query
      });

      console.log('📡 REPONSE EDGE FUNCTION:', { data, error });

      if (error) {
        console.error('❌ Erreur lors de la récupération des données de biodiversité:', error);
        throw new Error(error.message || 'Erreur lors de la récupération des données de biodiversité');
      }

      console.log('✅ Données reçues de biodiversity-data:', {
        species: data?.species?.length || 0,
        eBirdSpecies: data?.species?.filter((s: any) => s.source === 'ebird')?.length || 0,
        eBirdWithPhotos: data?.species?.filter((s: any) => s.source === 'ebird' && s.photos?.length > 0)?.length || 0
      });

      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 heures
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 jours
    enabled: !!(query.latitude && query.longitude),
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};