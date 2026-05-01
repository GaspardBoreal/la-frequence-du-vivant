import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExplorationAiAnalysis {
  id: string;
  exploration_id: string;
  analyzed_at: string;
  model: string;
  species_analyzed_count: number;
  summary: any;
}

const STALE_DAYS = 7;

/** Récupère la dernière analyse IA pour une exploration */
export const useLatestAiAnalysis = (explorationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['exploration-ai-analysis', explorationId],
    queryFn: async (): Promise<ExplorationAiAnalysis | null> => {
      if (!explorationId) return null;
      const { data, error } = await supabase
        .from('exploration_ai_analyses')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        // table may be empty / no rights → silent
        return null;
      }
      return data as ExplorationAiAnalysis | null;
    },
    enabled: !!explorationId,
    staleTime: 60 * 1000,
  });
};

export const isAnalysisStale = (a: ExplorationAiAnalysis | null | undefined) => {
  if (!a) return true;
  const ageMs = Date.now() - new Date(a.analyzed_at).getTime();
  return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;
};

/** Mutation : déclenche l'analyse IA pour une exploration */
export const useTriggerAiAnalysis = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (explorationId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-exploration-species', {
        body: { explorationId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { analyzed: number; model: string };
    },
    onSuccess: (data, explorationId) => {
      qc.invalidateQueries({ queryKey: ['exploration-ai-analysis', explorationId] });
      qc.invalidateQueries({ queryKey: ['exploration-curations', explorationId] });
      toast.success(`Analyse IA terminée — ${data.analyzed} espèces caractérisées`);
    },
    onError: (e: any) => {
      const msg = e?.message || 'Échec de l’analyse IA';
      toast.error(msg);
    },
  });
};
