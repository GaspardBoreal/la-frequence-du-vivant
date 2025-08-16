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
  marches: string[];
  explorations: string[];
}

export const useInsightsMetrics = (filters: InsightsFilters) => {
  return useQuery({
    queryKey: ['insights-metrics', filters],
    queryFn: async () => {
      // 1. Get valid marche data (start with all valid marches)
      const validMarches = await getValidMarcheIds();
      
      // 2. Calculate allowed marches based on filters
      let allowedMarches = validMarches;
      
      // Apply region filter to marches
      if (filters.regions && filters.regions.length > 0) {
        allowedMarches = allowedMarches.filter(marche => 
          filters.regions.includes(marche.region || '')
        );
      }
      
      // Apply marche filter if specified
      if (filters.marches && filters.marches.length > 0) {
        const marcheIds = new Set(filters.marches);
        allowedMarches = allowedMarches.filter(marche => marcheIds.has(marche.id));
      }
      
      // Apply exploration filter if specified
      if (filters.explorations && filters.explorations.length > 0) {
        const { data: explorationMarches } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .in('exploration_id', filters.explorations);

        if (explorationMarches) {
          const explorationMarcheIds = new Set(explorationMarches.map(em => em.marche_id));
          allowedMarches = allowedMarches.filter(marche => explorationMarcheIds.has(marche.id));
        }
      }

      const allowedMarcheIds = new Set(allowedMarches.map(m => m.id));
      const totalMarchesInSelection = allowedMarcheIds.size;

      // Calculate date filter
      let dateFilter = '';
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange.replace('d', ''));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        dateFilter = cutoffDate.toISOString().split('T')[0];
      }

      // Build query for snapshots with marche filter for performance
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

      // Apply marche filter to queries for performance if we have a limited set
      if (allowedMarcheIds.size > 0 && allowedMarcheIds.size < 100) {
        biodiversityQuery = biodiversityQuery.in('marche_id', [...allowedMarcheIds]);
        weatherQuery = weatherQuery.in('marche_id', [...allowedMarcheIds]);
      }

      // Apply date filter to queries
      if (dateFilter) {
        biodiversityQuery = biodiversityQuery.gte('snapshot_date', dateFilter);
        weatherQuery = weatherQuery.gte('snapshot_date', dateFilter);
      }

      const [biodiversityData, weatherData] = await Promise.all([
        biodiversityQuery,
        weatherQuery
      ]);

      // Filter snapshots to only allowed marches
      let filteredBiodiversity = (biodiversityData.data || []).filter(item => 
        allowedMarcheIds.has(item.marche_id)
      ) as BiodiversitySnapshot[];
      
      let filteredWeather = (weatherData.data || []).filter(item => 
        allowedMarcheIds.has(item.marche_id)
      ) as WeatherSnapshot[];

      // Calculate metrics using centralized logic with the correct total
      return calculateDataMetrics(
        filteredBiodiversity,
        filteredWeather,
        totalMarchesInSelection
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};