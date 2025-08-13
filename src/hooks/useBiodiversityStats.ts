import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BiodiversityStats {
  totalSnapshots: number;
  totalSpecies: number;
  averageSpecies: number;
  totalBirds: number;
  totalPlants: number;
  totalFungi: number;
  totalOthers: number;
  recentCollections: number;
  hotspots: number;
}

export const useBiodiversityStats = () => {
  return useQuery({
    queryKey: ['biodiversity-stats'],
    queryFn: async (): Promise<BiodiversityStats> => {
      // Requête optimisée avec agrégation SQL
      const { data, error } = await supabase
        .from('biodiversity_snapshots')
        .select(`
          total_species,
          birds_count,
          plants_count,
          fungi_count,
          others_count,
          created_at
        `);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalSnapshots: 0,
          totalSpecies: 0,
          averageSpecies: 0,
          totalBirds: 0,
          totalPlants: 0,
          totalFungi: 0,
          totalOthers: 0,
          recentCollections: 0,
          hotspots: 0
        };
      }

      // Calculs optimisés côté client avec une seule passe
      const totalSnapshots = data.length;
      const totalSpecies = data.reduce((sum, item) => sum + (item.total_species || 0), 0);
      const totalBirds = data.reduce((sum, item) => sum + (item.birds_count || 0), 0);
      const totalPlants = data.reduce((sum, item) => sum + (item.plants_count || 0), 0);
      const totalFungi = data.reduce((sum, item) => sum + (item.fungi_count || 0), 0);
      const totalOthers = data.reduce((sum, item) => sum + (item.others_count || 0), 0);
      
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentCollections = data.filter(d => 
        new Date(d.created_at) > lastWeek
      ).length;
      
      const hotspots = data.filter(d => (d.total_species || 0) > 100).length;

      return {
        totalSnapshots,
        totalSpecies,
        averageSpecies: totalSnapshots > 0 ? Math.round(totalSpecies / totalSnapshots) : 0,
        totalBirds,
        totalPlants,
        totalFungi,
        totalOthers,
        recentCollections,
        hotspots
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - données relativement statiques
    gcTime: 1000 * 60 * 60 * 4, // 4 heures
    retry: 2,
  });
};