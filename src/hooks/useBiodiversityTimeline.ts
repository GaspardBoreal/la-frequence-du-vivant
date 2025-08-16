import { useQuery } from '@tanstack/react-query';
import { getFilteredBiodiversitySnapshots, groupBiodiversityByDate } from '@/utils/dataIntegrityUtils';

export interface TimelineDataPoint {
  date: string;
  species: number;
  count: number;
}

export const useBiodiversityTimeline = (filters?: {
  regions?: string[];
  marches?: string[];
  explorations?: string[];
  days?: number;
}) => {
  return useQuery({
    queryKey: ['biodiversity-timeline', filters],
    queryFn: async (): Promise<TimelineDataPoint[]> => {
      const days = filters?.days || 14;
      const dateRange = `${days}d`;
      
      const snapshots = await getFilteredBiodiversitySnapshots({
        dateRange,
        regions: filters?.regions,
        marches: filters?.marches,
        explorations: filters?.explorations
      });
      
      return groupBiodiversityByDate(snapshots, days);
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 heures
    retry: 2,
  });
};