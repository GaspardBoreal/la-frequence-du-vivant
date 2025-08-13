import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DataCollectionStats {
  totalCollections: number;
  recentActivity: number;
  isLoading: boolean;
  error: string | null;
}

export const useDataCollectionStats = () => {
  const [stats, setStats] = useState<DataCollectionStats>({
    totalCollections: 0,
    recentActivity: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Get total collections count
        const { count: totalCount, error: totalError } = await supabase
          .from('data_collection_logs')
          .select('*', { count: 'exact', head: true });

        if (totalError) {
          throw totalError;
        }

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentCount, error: recentError } = await supabase
          .from('data_collection_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        if (recentError) {
          throw recentError;
        }

        setStats({
          totalCollections: totalCount || 0,
          recentActivity: recentCount || 0,
          isLoading: false,
          error: null,
        });

      } catch (error) {
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};