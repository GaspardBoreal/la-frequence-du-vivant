import { useQuery } from '@tanstack/react-query';
import { getFilteredBiodiversitySnapshots, calculateBiodiversityStats } from '@/utils/dataIntegrityUtils';

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

export const useBiodiversityStats = (filters?: {
  dateRange?: string;
  regions?: string[];
  marches?: string[];
  explorations?: string[];
}) => {
  return useQuery({
    queryKey: ['biodiversity-stats', filters],
    queryFn: async (): Promise<BiodiversityStats> => {
      const snapshots = await getFilteredBiodiversitySnapshots(filters);
      return calculateBiodiversityStats(snapshots);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - données relativement statiques
    gcTime: 1000 * 60 * 60 * 4, // 4 heures
    retry: 2,
  });
};