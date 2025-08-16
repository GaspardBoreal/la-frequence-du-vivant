import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExplorationWithMetrics {
  id: string;
  name: string;
  total_species: number;
  marches_count: number;
  display_name: string;
}

export const useExplorationsWithMetrics = () => {
  return useQuery({
    queryKey: ['explorations-with-metrics'],
    queryFn: async (): Promise<ExplorationWithMetrics[]> => {
      // Get explorations and calculate metrics
      const [explorationsResult, explorationMarchesResult, biodiversityResult] = await Promise.all([
        supabase.from('explorations').select('id, name').eq('published', true),
        supabase.from('exploration_marches').select('exploration_id, marche_id'),
        supabase.from('biodiversity_snapshots').select('marche_id, total_species')
      ]);

      if (explorationsResult.error) throw explorationsResult.error;
      if (explorationMarchesResult.error) throw explorationMarchesResult.error;
      if (biodiversityResult.error) throw biodiversityResult.error;

      const explorations = explorationsResult.data || [];
      const explorationMarches = explorationMarchesResult.data || [];
      const biodiversityData = biodiversityResult.data || [];

      // Calculate species count per marche
      const speciesCountByMarche = biodiversityData.reduce((acc, snapshot) => {
        if (!acc[snapshot.marche_id]) {
          acc[snapshot.marche_id] = 0;
        }
        acc[snapshot.marche_id] += snapshot.total_species || 0;
        return acc;
      }, {} as Record<string, number>);

      // Group marches by exploration
      const marchesByExploration = explorationMarches.reduce((acc, em) => {
        if (!acc[em.exploration_id]) {
          acc[em.exploration_id] = [];
        }
        acc[em.exploration_id].push(em.marche_id);
        return acc;
      }, {} as Record<string, string[]>);

      return explorations.map(exploration => {
        const marcheIds = marchesByExploration[exploration.id] || [];
        const totalSpecies = marcheIds.reduce((sum, marcheId) => {
          return sum + (speciesCountByMarche[marcheId] || 0);
        }, 0);

        return {
          id: exploration.id,
          name: exploration.name,
          total_species: totalSpecies,
          marches_count: marcheIds.length,
          display_name: `${exploration.name} (${totalSpecies} espèces, ${marcheIds.length} marches)`
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2,
  });
};