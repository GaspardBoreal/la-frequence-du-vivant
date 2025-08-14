import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DataCollectionLog } from '@/types/snapshots';

// Estimation des temps par type de collecte (en secondes par marche)
const COLLECTION_TIME_ESTIMATES = {
  biodiversity: 4, // 4 secondes par marche pour la biodiversité
  weather: 2,      // 2 secondes par marche pour la météo
  real_estate: 3   // 3 secondes par marche pour l'immobilier
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
        console.error('❌ Error fetching progress:', error.message);
        setState(prev => ({ ...prev, error: error.message }));
        return;
      }

      if (!data) {
        console.warn('⚠️ No data returned for logId:', logId);
        return;
      }

      console.log('📊 Progress data fetched:', {
        logId,
        status: data.status,
        processed: data.marches_processed,
        total: data.marches_total,
        summary_stats: data.summary_stats,
        last_ping: data.last_ping,
        timestamp: new Date().toISOString()
      });

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
        
        console.log('⏰ Time estimation:', {
          elapsed: elapsedMs,
          avgPerMarche: avgTimePerMarche,
          remaining: remainingMarches,
          estimatedSeconds: estimatedTimeRemaining
        });
      }

      // Extract current status from summary_stats
      const summaryStats = data.summary_stats as any;
      console.log('📋 Summary stats:', summaryStats);
      
      const currentMarcheName = summaryStats?.current_marche_name || 
        summaryStats?.next_marche ||
        (processed < total ? `Marche ${processed + 1}/${total}` : 'Finalisation...');
      
      // Déterminer le type de donnée en cours de traitement avec plus de détails
      let currentDataType = '';
      if (summaryStats?.current_data_type) {
        currentDataType = summaryStats.current_data_type;
      } else if (data.status === 'running') {
        currentDataType = processed === 0 ? 'Initialisation...' : 'Collecte en cours...';
      } else if (data.status === 'completed') {
        currentDataType = 'Collecte terminée ✅';
      } else if (data.status === 'failed') {
        currentDataType = 'Erreur ❌';
      } else {
        currentDataType = `Status: ${data.status}`;
      }

      console.log('🎯 Current status:', {
        currentMarcheName,
        currentDataType,
        progress,
        estimatedTimeRemaining
      });

      const isCompleted = data.status === 'completed' || data.status === 'failed';
      
      // Calculer l'estimation initiale si pas encore fait
      let initialEstimate = state.initialEstimate;
      if (!initialEstimate && total > 0 && collectionTypes.length > 0) {
        initialEstimate = calculateInitialEstimate(total, collectionTypes);
        console.log('📈 Initial estimate calculated:', initialEstimate, 'seconds');
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
        console.log('🛑 Stopping polling - collection completed');
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }

    } catch (error) {
      console.error('❌ Exception in fetchProgress:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };

  useEffect(() => {
    if (!logId) {
      console.log('🔄 Resetting progress state - no logId');
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

    console.log('🚀 Starting progress tracking for logId:', logId);
    setState(prev => ({ ...prev, isLoading: true }));
    startTimeRef.current = new Date();

    // Initial fetch
    fetchProgress();

    // Start polling every 500ms for maximum responsiveness
    intervalRef.current = setInterval(() => {
      console.log('🔄 Polling progress...');
      fetchProgress();
    }, 500);

    return () => {
      if (intervalRef.current) {
        console.log('🛑 Cleaning up progress polling');
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [logId]);

  return state;
};