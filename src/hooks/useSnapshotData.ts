import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BiodiversitySnapshot, WeatherSnapshot, RealEstateSnapshot, DataCollectionLog } from '@/types/snapshots';

export const useBiodiversitySnapshots = (marcheId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['biodiversity-snapshots', marcheId, limit],
    queryFn: async (): Promise<BiodiversitySnapshot[]> => {
      const { data, error } = await supabase
        .from('biodiversity_snapshots')
        .select('*')
        .eq('marche_id', marcheId)
        .order('snapshot_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch biodiversity snapshots: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!marcheId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useWeatherSnapshots = (marcheId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['weather-snapshots', marcheId, limit],
    queryFn: async (): Promise<WeatherSnapshot[]> => {
      const { data, error } = await supabase
        .from('weather_snapshots')
        .select('*')
        .eq('marche_id', marcheId)
        .order('snapshot_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch weather snapshots: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!marcheId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useRealEstateSnapshots = (marcheId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['real-estate-snapshots', marcheId, limit],
    queryFn: async (): Promise<RealEstateSnapshot[]> => {
      const { data, error } = await supabase
        .from('real_estate_snapshots')
        .select('*')
        .eq('marche_id', marcheId)
        .order('snapshot_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch real estate snapshots: ${error.message}`);
      }

      return (data || []) as RealEstateSnapshot[];
    },
    enabled: !!marcheId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useLatestSnapshotsForMarche = (marcheId: string) => {
  return useQuery({
    queryKey: ['latest-snapshots', marcheId],
    queryFn: async () => {
      const [biodiversityResult, weatherResult, realEstateResult] = await Promise.allSettled([
        supabase
          .from('biodiversity_snapshots')
          .select('*')
          .eq('marche_id', marcheId)
          .order('snapshot_date', { ascending: false })
          .limit(1),
        supabase
          .from('weather_snapshots')
          .select('*')
          .eq('marche_id', marcheId)
          .order('snapshot_date', { ascending: false })
          .limit(1),
        supabase
          .from('real_estate_snapshots')
          .select('*')
          .eq('marche_id', marcheId)
          .order('snapshot_date', { ascending: false })
          .limit(1)
      ]);

      return {
        biodiversity: biodiversityResult.status === 'fulfilled' ? biodiversityResult.value.data?.[0] : null,
        weather: weatherResult.status === 'fulfilled' ? weatherResult.value.data?.[0] : null,
        realEstate: realEstateResult.status === 'fulfilled' ? realEstateResult.value.data?.[0] : null,
      };
    },
    enabled: !!marcheId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useDataCollectionLogs = (limit: number = 20) => {
  return useQuery({
    queryKey: ['data-collection-logs', limit],
    queryFn: async (): Promise<DataCollectionLog[]> => {
      const { data, error } = await supabase
        .from('data_collection_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch collection logs: ${error.message}`);
      }

      return (data || []) as DataCollectionLog[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTriggerBatchCollection = () => {
  return async (request: { collectionTypes: ('biodiversity' | 'weather' | 'real_estate')[], mode: 'manual' | 'scheduled' }) => {
    const { data, error } = await supabase.functions.invoke('batch-data-collector', {
      body: request
    });

    if (error) {
      throw new Error(`Failed to trigger batch collection: ${error.message}`);
    }

    return data;
  };
};