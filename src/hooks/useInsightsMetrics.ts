import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  getValidMarcheIds, 
  filterValidSnapshots, 
  applyRegionFilter, 
  calculateDataMetrics,
  applyDateFilter,
  type BiodiversitySnapshot,
  type WeatherSnapshot
} from '@/utils/dataIntegrityUtils';

interface InsightsFilters {
  dateRange: string;
  regions: string[];
  dataTypes: string[];
}

export const useInsightsMetrics = (filters: InsightsFilters) => {
  return useQuery({
    queryKey: ['insights-metrics', filters],
    queryFn: async () => {
      // 1. Get total marches count and valid marche data
      const [{ count: totalMarches }, validMarches] = await Promise.all([
        supabase.from('marches').select('*', { count: 'exact', head: true }),
        getValidMarcheIds()
      ]);

      // Calculate date filter
      let dateFilter = '';
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange.replace('d', ''));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        dateFilter = cutoffDate.toISOString().split('T')[0];
      }

      // Build query for snapshots
      let biodiversityQuery = supabase
        .from('biodiversity_snapshots')
        .select(`
          marche_id,
          total_species,
          snapshot_date
        `);

      let weatherQuery = supabase
        .from('weather_snapshots')
        .select(`
          marche_id,
          snapshot_date
        `);

      // Apply date filter to queries
      if (dateFilter) {
        biodiversityQuery = biodiversityQuery.gte('snapshot_date', dateFilter);
        weatherQuery = weatherQuery.gte('snapshot_date', dateFilter);
      }

      const [biodiversityData, weatherData] = await Promise.all([
        biodiversityQuery,
        weatherQuery
      ]);

      // Filter out orphan snapshots first
      const validMarcheIds = new Set(validMarches.map(m => m.id));
      let filteredBiodiversity = filterValidSnapshots(
        biodiversityData.data || [], 
        validMarcheIds
      ) as BiodiversitySnapshot[];
      let filteredWeather = filterValidSnapshots(
        weatherData.data || [], 
        validMarcheIds
      ) as WeatherSnapshot[];

      // Apply region filter
      filteredBiodiversity = applyRegionFilter(filteredBiodiversity, validMarches, filters.regions);
      filteredWeather = applyRegionFilter(filteredWeather, validMarches, filters.regions);

      // Calculate metrics using centralized logic
      return calculateDataMetrics(
        filteredBiodiversity,
        filteredWeather,
        totalMarches || 0
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};