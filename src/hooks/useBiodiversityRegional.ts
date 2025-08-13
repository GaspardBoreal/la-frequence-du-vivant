import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RegionalDataPoint {
  region: string;
  species: number;
  marches: number;
  observations: number;
}

export const useBiodiversityRegional = () => {
  return useQuery({
    queryKey: ['biodiversity-regional'],
    queryFn: async (): Promise<RegionalDataPoint[]> => {
      // Requête optimisée avec JOIN SQL pour éviter le traitement côté client
      const { data, error } = await supabase
        .from('biodiversity_snapshots')
        .select(`
          total_species,
          recent_observations,
          marches!inner(region)
        `);

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Groupement optimisé par région
      const grouped = data.reduce((acc: Record<string, RegionalDataPoint>, item) => {
        const region = (item.marches as any)?.region || 'Non défini';
        
        if (!acc[region]) {
          acc[region] = { region, species: 0, marches: 0, observations: 0 };
        }
        
        acc[region].species += item.total_species || 0;
        acc[region].marches += 1;
        acc[region].observations += item.recent_observations || 0;
        
        return acc;
      }, {});

      return Object.values(grouped).sort((a, b) => b.species - a.species);
    },
    staleTime: 1000 * 60 * 20, // 20 minutes
    gcTime: 1000 * 60 * 60 * 3, // 3 heures
    retry: 2,
  });
};