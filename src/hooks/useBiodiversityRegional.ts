import { useQuery } from '@tanstack/react-query';
import { getFilteredBiodiversitySnapshots, groupBiodiversityByRegion } from '@/utils/dataIntegrityUtils';

export interface RegionalDataPoint {
  region: string;
  species: number;
  marches: number;
  observations: number;
}

export const useBiodiversityRegional = (filters?: {
  dateRange?: string;
  marches?: string[];
  explorations?: string[];
}) => {
  return useQuery({
    queryKey: ['biodiversity-regional', filters],
    queryFn: async (): Promise<RegionalDataPoint[]> => {
      const snapshots = await getFilteredBiodiversitySnapshots({
        dateRange: filters?.dateRange,
        marches: filters?.marches,
        explorations: filters?.explorations
      });
      return await groupBiodiversityByRegion(snapshots);
    },
    staleTime: 1000 * 60 * 20, // 20 minutes
    gcTime: 1000 * 60 * 60 * 3, // 3 heures
    retry: 2,
  });
};