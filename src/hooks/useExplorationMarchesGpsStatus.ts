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

      // Source de vérité : exploration_marches → marches
      const { data: em, error } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches(id, nom_marche, ville, latitude, longitude)')
        .eq('exploration_id', explorationId);
      if (error) throw error;

      const marches = (em || [])
        .map((x: any) => x.marches)
        .filter((m: any) => m && m.id);

      const total = marches.length;
      const withGps = marches.filter(
        (m: any) => m.latitude != null && m.longitude != null
      ).length;
      const marchesMissingGps = marches
        .filter((m: any) => m.latitude == null || m.longitude == null)
        .map((m: any) => ({ id: m.id, title: m.nom_marche || m.ville || null }));

      let withSnapshots = 0;
      if (total > 0) {
        const { data: snaps } = await supabase
          .from('biodiversity_snapshots')
          .select('marche_id')
          .in('marche_id', marches.map((m: any) => m.id));
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
