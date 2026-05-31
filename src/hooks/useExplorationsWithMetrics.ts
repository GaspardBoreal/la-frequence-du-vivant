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
      const [explorationsResult, explorationMarchesResult] = await Promise.all([
        supabase.from('explorations').select('id, name').eq('published', true),
        supabase.from('exploration_marches').select('exploration_id, marche_id'),
      ]);

      if (explorationsResult.error) throw explorationsResult.error;
      if (explorationMarchesResult.error) throw explorationMarchesResult.error;

      const explorations = explorationsResult.data || [];
      const explorationMarches = explorationMarchesResult.data || [];

      const marchesByExploration = explorationMarches.reduce((acc, em) => {
        if (!acc[em.exploration_id]) acc[em.exploration_id] = [];
        acc[em.exploration_id].push(em.marche_id);
        return acc;
      }, {} as Record<string, string[]>);

      // ✅ Canonical per-exploration species count via RPC
      // (respects each marche's radius_m override or exploration default)
      const counts = await Promise.all(
        explorations.map(async (exp) => {
          const { data, error } = await supabase.rpc('get_exploration_species_count', {
            p_exploration_id: exp.id,
          });
          if (error) return 0;
          return (data as any)?.total ?? 0;
        })
      );

      return explorations
        .map((exploration, idx) => {
          const marcheIds = marchesByExploration[exploration.id] || [];
          const totalSpecies = counts[idx];
          return {
            id: exploration.id,
            name: exploration.name,
            total_species: totalSpecies,
            marches_count: marcheIds.length,
            display_name: `${exploration.name} (${totalSpecies} espèces, ${marcheIds.length} marches)`,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
};
