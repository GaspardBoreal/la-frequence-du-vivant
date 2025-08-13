import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DataCollectionLog } from '@/types/snapshots';

interface ProgressState {
  log: DataCollectionLog | null;
  isLoading: boolean;
  progress: number;
  currentMarcheName: string;
  estimatedTimeRemaining: number | null;
  isCompleted: boolean;
  error: string | null;
}

export const useCollectionProgress = (logId: string | null) => {
  const [state, setState] = useState<ProgressState>({
    log: null,
    isLoading: false,
    progress: 0,
    currentMarcheName: '',
    estimatedTimeRemaining: null,
    isCompleted: false,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<Date>();

  const fetchProgress = async () => {
    if (!logId) return;

    try {
      const { data, error } = await supabase
        .from('data_collection_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (error) {
        setState(prev => ({ ...prev, error: error.message }));
        return;
      }

      if (!data) return;

      const processed = data.marches_processed || 0;
      const total = data.marches_total || 0;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

      // Calculate estimated time remaining
      let estimatedTimeRemaining: number | null = null;
      if (processed > 0 && data.status === 'running' && startTimeRef.current) {
        const elapsedMs = Date.now() - startTimeRef.current.getTime();
        const avgTimePerMarche = elapsedMs / processed;
        const remainingMarches = total - processed;
        estimatedTimeRemaining = Math.ceil((remainingMarches * avgTimePerMarche) / 1000);
      }

      // Extract current marche name from summary_stats if available
      const summaryStats = data.summary_stats as any;
      const currentMarcheName = summaryStats?.current_marche_name || 
        (processed < total ? `Marche ${processed + 1}/${total}` : 'Finalisation...');

      const isCompleted = data.status === 'completed' || data.status === 'failed';

      setState(prev => ({
        ...prev,
        log: data as DataCollectionLog,
        progress,
        currentMarcheName,
        estimatedTimeRemaining,
        isCompleted,
        error: null,
      }));

      // Stop polling when completed
      if (isCompleted && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };

  useEffect(() => {
    if (!logId) {
      setState({
        log: null,
        isLoading: false,
        progress: 0,
        currentMarcheName: '',
        estimatedTimeRemaining: null,
        isCompleted: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    startTimeRef.current = new Date();

    // Initial fetch
    fetchProgress();

    // Start polling every 2 seconds
    intervalRef.current = setInterval(fetchProgress, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [logId]);

  return state;
};