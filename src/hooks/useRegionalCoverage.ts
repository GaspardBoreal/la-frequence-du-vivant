import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RegionalCoverage {
  region: string;
  marches_count: number;
  total_species: number;
}

/**
 * Hook to fetch marche counts by region for the territorial coverage map
 */
export const useRegionalCoverage = () => {
  return useQuery({
    queryKey: ['regional-coverage'],
    queryFn: async (): Promise<RegionalCoverage[]> => {
      // Fetch marches with regions
      const { data: marchesData, error: marchesError } = await supabase
        .from('marches')
        .select('id, region');

      if (marchesError) throw marchesError;
      if (!marchesData || marchesData.length === 0) return [];

      const marcheIds = marchesData.map(m => m.id);

      // Fetch biodiversity data
      const { data: biodiversityData, error: biodiversityError } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, total_species')
        .in('marche_id', marcheIds);

      if (biodiversityError) throw biodiversityError;

      // Create species count by marche
      const speciesByMarche: Record<string, number> = {};
      (biodiversityData || []).forEach(snapshot => {
        speciesByMarche[snapshot.marche_id] = (speciesByMarche[snapshot.marche_id] || 0) + (snapshot.total_species || 0);
      });

      // Group by region
      const regionMap: Record<string, { marches_count: number; total_species: number }> = {};
      
      marchesData.forEach(marche => {
        const region = marche.region || 'Non défini';
        if (!regionMap[region]) {
          regionMap[region] = { marches_count: 0, total_species: 0 };
        }
        regionMap[region].marches_count += 1;
        regionMap[region].total_species += speciesByMarche[marche.id] || 0;
      });

      // Convert to array and sort by marches count
      return Object.entries(regionMap)
        .filter(([region]) => region !== 'Non défini')
        .map(([region, stats]) => ({
          region,
          marches_count: stats.marches_count,
          total_species: stats.total_species
        }))
        .sort((a, b) => b.marches_count - a.marches_count);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2
  });
};

/**
 * Get unique regions count
 */
export const useRegionsCount = () => {
  return useQuery({
    queryKey: ['regions-count'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('marches')
        .select('region');

      if (error) throw error;
      if (!data) return 0;

      const uniqueRegions = new Set(
        data
          .map(m => m.region)
          .filter(r => r && r !== 'Non défini')
      );

      return uniqueRegions.size;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
