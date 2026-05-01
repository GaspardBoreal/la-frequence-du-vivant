import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExplorationMarchesGpsStatus {
  total: number;
  withGps: number;
  withoutGps: number;
  withSnapshots: number;
  marchesMissingGps: { id: string; title: string | null }[];
}

/**
 * Diagnostic des marches d'une exploration côté GPS / snapshot biodiversité.
 * Sert à expliquer précisément à l'utilisateur pourquoi l'analyse IA ne peut pas (ou peut) tourner.
 */
export const useExplorationMarchesGpsStatus = (explorationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['exploration-marches-gps-status', explorationId],
    queryFn: async (): Promise<ExplorationMarchesGpsStatus> => {
      if (!explorationId) {
        return { total: 0, withGps: 0, withoutGps: 0, withSnapshots: 0, marchesMissingGps: [] };
      }

      const { data: events, error } = await supabase
        .from('marche_events')
        .select('id, title, latitude, longitude')
        .eq('exploration_id', explorationId);
      if (error) throw error;

      const total = events?.length || 0;
      const withGps = (events || []).filter(e => e.latitude != null && e.longitude != null).length;
      const marchesMissingGps = (events || [])
        .filter(e => e.latitude == null || e.longitude == null)
        .map(e => ({ id: e.id, title: e.title ?? null }));

      let withSnapshots = 0;
      if (total > 0) {
        const { data: snaps } = await supabase
          .from('biodiversity_snapshots')
          .select('marche_id')
          .in('marche_id', (events || []).map(e => e.id));
        withSnapshots = new Set((snaps || []).map((s: any) => s.marche_id)).size;
      }

      return {
        total,
        withGps,
        withoutGps: total - withGps,
        withSnapshots,
        marchesMissingGps,
      };
    },
    enabled: !!explorationId,
    staleTime: 60 * 1000,
  });
};
