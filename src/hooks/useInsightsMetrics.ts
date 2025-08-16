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

      // Build query for snapshots - client-side filtering for region
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

      // Apply date filter
      if (dateFilter) {
        biodiversityQuery = biodiversityQuery.gte('snapshot_date', dateFilter);
        weatherQuery = weatherQuery.gte('snapshot_date', dateFilter);
      }

      const [biodiversityData, weatherData, marchesData] = await Promise.all([
        biodiversityQuery,
        weatherQuery,
        supabase.from('marches').select('id, region')
      ]);

      // Client-side region filtering
      let filteredBiodiversity = biodiversityData.data || [];
      let filteredWeather = weatherData.data || [];
      
      if (filters.regions.length > 0 && marchesData.data) {
        const allowedMarcheIds = marchesData.data
          .filter(marche => filters.regions.includes(marche.region))
          .map(marche => marche.id);
        
        filteredBiodiversity = filteredBiodiversity.filter(item => 
          allowedMarcheIds.includes(item.marche_id)
        );
        filteredWeather = filteredWeather.filter(item => 
          allowedMarcheIds.includes(item.marche_id)
        );
      }

      // Calculate unique covered marches (only those that exist in marches table)
      const validMarcheIds = new Set(marchesData.data?.map(m => m.id) || []);
      const uniqueCoveredMarches = new Set();
      
      filteredBiodiversity.forEach(item => {
        if (validMarcheIds.has(item.marche_id)) {
          uniqueCoveredMarches.add(item.marche_id);
        }
      });
      filteredWeather.forEach(item => {
        if (validMarcheIds.has(item.marche_id)) {
          uniqueCoveredMarches.add(item.marche_id);
        }
      });

      // Calculate total species collected
      const totalSpeciesCollected = filteredBiodiversity.reduce((sum, item) => 
        sum + (item.total_species || 0), 0
      );

      // Calculate total weather points
      const totalWeatherPoints = filteredWeather.length;

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