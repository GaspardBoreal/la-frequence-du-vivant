import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopSpeciesData {
  name: string;
  count: number;
}

export const useBiodiversityTopSpecies = () => {
  return useQuery({
    queryKey: ['biodiversity-top-species'],
    queryFn: async (): Promise<TopSpeciesData[]> => {
      try {
        // Utiliser la fonction SQL optimisée
        const { data, error } = await supabase
          .rpc('get_top_species_optimized', { limit_count: 10 });

        if (error) throw error;
        
        return data?.map(item => ({
          name: item.name,
          count: Number(item.count)
        })) || [];
        
      } catch (error) {
        console.log('Fallback to client-side processing due to:', error);
        
        // Fallback optimisé si la fonction RPC échoue
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('biodiversity_snapshots')
          .select('species_data')
          .not('species_data', 'is', null)
          .limit(50); // Limite drastique pour la performance

        if (fallbackError) throw fallbackError;

        const speciesCount: Record<string, number> = {};
        
        fallbackData?.forEach(snapshot => {
          if (snapshot.species_data && Array.isArray(snapshot.species_data)) {
            snapshot.species_data.slice(0, 20).forEach((species: any) => { // Limite encore plus stricte
              const key = species.commonName || species.scientificName;
              if (key && typeof key === 'string') {
                speciesCount[key] = (speciesCount[key] || 0) + 1;
              }
            });
          }
        });

        return Object.entries(speciesCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));
      }
    },
    staleTime: 1000 * 60 * 60, // 1 heure - données relativement statiques
    gcTime: 1000 * 60 * 60 * 6, // 6 heures
    retry: 2,
  });
};