import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFilteredBiodiversitySnapshots } from '@/utils/dataIntegrityUtils';

export interface TopSpeciesData {
  name: string;
  count: number;
}

export const useBiodiversityTopSpecies = (filters?: {
  dateRange?: string;
  regions?: string[];
  marches?: string[];
  explorations?: string[];
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['biodiversity-top-species', filters],
    queryFn: async (): Promise<TopSpeciesData[]> => {
      const limit = filters?.limit || 10;
      
      try {
        // Utiliser la fonction SQL optimisée
        const { data, error } = await supabase
          .rpc('get_top_species_optimized', { limit_count: limit });

        if (error) throw error;
        
        return data?.map(item => ({
          name: item.name,
          count: Number(item.count)
        })) || [];
        
      } catch (error) {
        console.log('Fallback to filtered client-side processing due to:', error);
        
        // Fallback avec filtrage des données orphelines
        const snapshots = await getFilteredBiodiversitySnapshots(filters);
        
        const speciesCount: Record<string, number> = {};
        
        snapshots.forEach(snapshot => {
          if (snapshot.species_data && Array.isArray(snapshot.species_data)) {
            snapshot.species_data.slice(0, 20).forEach((species: any) => {
              const key = species.commonName || species.scientificName;
              if (key && typeof key === 'string') {
                speciesCount[key] = (speciesCount[key] || 0) + 1;
              }
            });
          }
        });

        return Object.entries(speciesCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, limit)
          .map(([name, count]) => ({ name, count }));
      }
    },
    staleTime: 1000 * 60 * 60, // 1 heure - données relativement statiques
    gcTime: 1000 * 60 * 60 * 6, // 6 heures
    retry: 2,
  });
};