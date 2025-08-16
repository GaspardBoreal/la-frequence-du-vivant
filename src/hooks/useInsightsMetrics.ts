import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InsightsFilters {
  dateRange: string;
  regions: string[];
  dataTypes: string[];
}

export const useInsightsMetrics = (filters: InsightsFilters) => {
  return useQuery({
    queryKey: ['insights-metrics', filters],
    queryFn: async () => {
      // 1. Get total marches count
      const { count: totalMarches } = await supabase
        .from('marches')
        .select('*', { count: 'exact', head: true });

      // Calculate date filter
      let dateFilter = '';
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange.replace('d', ''));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        dateFilter = cutoffDate.toISOString().split('T')[0];
      }

      // Build query for snapshots with marches join to exclude orphans
      let biodiversityQuery = supabase
        .from('biodiversity_snapshots')
        .select(`
          marche_id,
          total_species,
          snapshot_date,
          marches!inner(id, region)
        `);

      let weatherQuery = supabase
        .from('weather_snapshots')
        .select(`
          marche_id,
          snapshot_date,
          marches!inner(id, region)
        `);

      // Apply date filter
      if (dateFilter) {
        biodiversityQuery = biodiversityQuery.gte('snapshot_date', dateFilter);
        weatherQuery = weatherQuery.gte('snapshot_date', dateFilter);
      }

      // Apply region filter
      if (filters.regions.length > 0) {
        biodiversityQuery = biodiversityQuery.in('marches.region', filters.regions);
        weatherQuery = weatherQuery.in('marches.region', filters.regions);
      }

      const [biodiversityData, weatherData] = await Promise.all([
        biodiversityQuery,
        weatherQuery
      ]);

      // Calculate unique covered marches (existing in marches table)
      const uniqueCoveredMarches = new Set();
      
      if (biodiversityData.data) {
        biodiversityData.data.forEach(item => uniqueCoveredMarches.add(item.marche_id));
      }
      
      if (weatherData.data) {
        weatherData.data.forEach(item => uniqueCoveredMarches.add(item.marche_id));
      }

      // Calculate total species collected
      const totalSpeciesCollected = biodiversityData.data?.reduce((sum, item) => 
        sum + (item.total_species || 0), 0
      ) || 0;

      // Calculate total weather points
      const totalWeatherPoints = weatherData.data?.length || 0;

      return {
        totalMarches: totalMarches || 0,
        marchesCouvertes: uniqueCoveredMarches.size,
        totalSpeciesCollected,
        totalWeatherPoints,
        // For debugging - count orphan data
        orphanBiodiversity: 0, // Already filtered out by inner join
        orphanWeather: 0, // Already filtered out by inner join
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};