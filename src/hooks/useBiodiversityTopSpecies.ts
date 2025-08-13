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
      // Utiliser directement la requête optimisée sans RPC pour éviter les erreurs TypeScript
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .not('species_data', 'is', null)
        .limit(100); // Limite pour éviter de surcharger

      if (fallbackError) throw fallbackError;

      const speciesCount: Record<string, number> = {};
      
      fallbackData?.forEach(snapshot => {
        if (snapshot.species_data && Array.isArray(snapshot.species_data)) {
          snapshot.species_data.slice(0, 50).forEach((species: any) => { // Limite par snapshot
            const key = species.commonName || species.scientificName;
            if (key) {
              speciesCount[key] = (speciesCount[key] || 0) + 1;
            }
          });
        }
      });

      return Object.entries(speciesCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
    },
    staleTime: 1000 * 60 * 60, // 1 heure - données relativement statiques
    gcTime: 1000 * 60 * 60 * 6, // 6 heures
    retry: 2,
  });
};