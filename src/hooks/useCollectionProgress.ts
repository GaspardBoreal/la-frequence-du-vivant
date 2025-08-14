import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DataCollectionLog } from '@/types/snapshots';

// Estimation des temps par type de collecte (en secondes par marché)
const COLLECTION_TIME_ESTIMATES = {
  biodiversity: 4, // 4 secondes par marché pour la biodiversité
  weather: 2,      // 2 secondes par marché pour la météo
  real_estate: 3   // 3 secondes par marché pour l'immobilier
};

interface ProgressState {
  log: DataCollectionLog | null;
  isLoading: boolean;
  progress: number;
  currentMarcheName: string;
  currentDataType: string;
  estimatedTimeRemaining: number | null;
  initialEstimate: number | null;
  isCompleted: boolean;
  error: string | null;
}

export const useCollectionProgress = (logId: string | null, collectionTypes: string[] = []) => {
  const [state, setState] = useState<ProgressState>({
    log: null,
    isLoading: false,
    progress: 0,
    currentMarcheName: '',
    currentDataType: '',
    estimatedTimeRemaining: null,
    initialEstimate: null,
    isCompleted: false,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<Date>();

  // Calculer l'estimation initiale basée sur les types de collecte
  const calculateInitialEstimate = (totalMarches: number, types: string[]) => {
    if (!totalMarches || !types.length) return null;
    
    const avgTimePerMarche = types.reduce((sum, type) => {
      return sum + (COLLECTION_TIME_ESTIMATES[type as keyof typeof COLLECTION_TIME_ESTIMATES] || 3);
    }, 0) / types.length;
    
    return Math.ceil(totalMarches * avgTimePerMarche);
  };

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

      // Extract current status from summary_stats
      const summaryStats = data.summary_stats as any;
      const currentMarcheName = summaryStats?.current_marche_name || 
        (processed < total ? `Marche ${processed + 1}/${total}` : 'Finalisation...');
      
      // Déterminer le type de donnée en cours de traitement
      const currentDataType = summaryStats?.current_data_type || 
        (data.status === 'running' ? 'Collecte en cours...' : '');

      const isCompleted = data.status === 'completed' || data.status === 'failed';
      
      // Calculer l'estimation initiale si pas encore fait
      let initialEstimate = state.initialEstimate;
      if (!initialEstimate && total > 0 && collectionTypes.length > 0) {
        initialEstimate = calculateInitialEstimate(total, collectionTypes);
      }

      setState(prev => ({
        ...prev,
        log: data as DataCollectionLog,
        progress,
        currentMarcheName,
        currentDataType,
        estimatedTimeRemaining,
        initialEstimate,
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
        currentDataType: '',
        estimatedTimeRemaining: null,
        initialEstimate: null,
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