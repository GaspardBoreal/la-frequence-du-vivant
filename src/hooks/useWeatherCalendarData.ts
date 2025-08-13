import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useWeatherCalendarData = (month: string, location?: string | null) => {
  return useQuery({
    queryKey: ['weather-calendar', month, location],
    queryFn: async () => {
      let query = supabase
        .from('weather_snapshots')
        .select(`
          *,
          marches!inner(
            id,
            nom_marche,
            ville,
            region,
            latitude,
            longitude
          )
        `)
        .gte('snapshot_date', `${month}-01`)
        .lt('snapshot_date', `${month.split('-')[0]}-${(parseInt(month.split('-')[1]) + 1).toString().padStart(2, '0')}-01`)
        .order('snapshot_date', { ascending: true });

      // Apply location filter if specified
      if (location && location !== 'all') {
        if (location === 'france') {
          query = query.eq('marches.region', 'France');
        } else if (location === 'europe') {
          query = query.neq('marches.region', 'France');
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching weather calendar data:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!month,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useWeatherTimelineData = (startDate: string, endDate: string, location?: string | null) => {
  return useQuery({
    queryKey: ['weather-timeline', startDate, endDate, location],
    queryFn: async () => {
      let query = supabase
        .from('weather_snapshots')
        .select(`
          *,
          marches!inner(
            id,
            nom_marche,
            ville,
            region
          )
        `)
        .gte('snapshot_date', startDate)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: true });

      if (location && location !== 'all') {
        if (location === 'france') {
          query = query.eq('marches.region', 'France');
        } else if (location === 'europe') {
          query = query.neq('marches.region', 'France');
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching weather timeline data:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 30,
  });
};

export const useWeatherComparisonData = (dates: string[], location?: string | null) => {
  return useQuery({
    queryKey: ['weather-comparison', dates, location],
    queryFn: async () => {
      if (dates.length === 0) return [];

      let query = supabase
        .from('weather_snapshots')
        .select(`
          *,
          marches!inner(
            id,
            nom_marche,
            ville,
            region
          )
        `)
        .in('snapshot_date', dates)
        .order('snapshot_date', { ascending: true });

      if (location && location !== 'all') {
        if (location === 'france') {
          query = query.eq('marches.region', 'France');
        } else if (location === 'europe') {
          query = query.neq('marches.region', 'France');
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching weather comparison data:', error);
        throw error;
      }

      return data || [];
    },
    enabled: dates.length > 0,
    staleTime: 1000 * 60 * 30,
  });
};

export const useWeatherSearchData = (searchQuery: string) => {
  return useQuery({
    queryKey: ['weather-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('weather_snapshots')
        .select(`
          *,
          marches!inner(
            id,
            nom_marche,
            ville,
            region
          )
        `)
        .or(`snapshot_date.ilike.%${searchQuery}%,marches.ville.ilike.%${searchQuery}%,marches.nom_marche.ilike.%${searchQuery}%`)
        .order('snapshot_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching weather data:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes for search results
  });
};