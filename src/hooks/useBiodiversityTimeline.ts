import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TimelineDataPoint {
  date: string;
  species: number;
  count: number;
}

export const useBiodiversityTimeline = () => {
  return useQuery({
    queryKey: ['biodiversity-timeline'],
    queryFn: async (): Promise<TimelineDataPoint[]> => {
      // Requête optimisée avec limite de 14 jours et colonnes spécifiques
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('biodiversity_snapshots')
        .select('snapshot_date, total_species')
        .gte('snapshot_date', fourteenDaysAgo.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Groupement optimisé par date
      const grouped = data.reduce((acc: Record<string, TimelineDataPoint>, item) => {
        const date = new Date(item.snapshot_date).toLocaleDateString('fr-FR', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (!acc[date]) {
          acc[date] = { date, species: 0, count: 0 };
        }
        
        acc[date].species += item.total_species || 0;
        acc[date].count += 1;
        
        return acc;
      }, {});

      return Object.values(grouped).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 heures
    retry: 2,
  });
};