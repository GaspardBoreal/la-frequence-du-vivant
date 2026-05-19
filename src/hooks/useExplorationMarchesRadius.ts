import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_RADIUS_M } from '@/utils/marcheRadius';

export interface MarcheRadiusRow {
  marcheId: string;
  ordre: number;
  nom: string;
  ville: string | null;
  date: string | null;
  radius_m: number | null;
  resolvedRadiusM: number;
  isOverride: boolean;
}

export interface ExplorationMarchesRadiusData {
  rows: MarcheRadiusRow[];
  defaultRadiusM: number | null;
  count: number;
  avgM: number;
  minM: number;
  maxM: number;
}

/**
 * Charge la liste des marches d'une exploration avec leurs rayons paramétrés
 * et les statistiques agrégées (moyenne, min, max) pour le bandeau résumé.
 */
export function useExplorationMarchesRadius(explorationId?: string | null) {
  return useQuery({
    queryKey: ['exploration-marches-radius', explorationId],
    enabled: !!explorationId,
    queryFn: async (): Promise<ExplorationMarchesRadiusData> => {
      if (!explorationId) {
        return { rows: [], defaultRadiusM: null, count: 0, avgM: 0, minM: 0, maxM: 0 };
      }

      const [{ data: explo }, { data: em }] = await Promise.all([
        supabase
          .from('explorations')
          .select('default_radius_m')
          .eq('id', explorationId)
          .maybeSingle(),
        supabase
          .from('exploration_marches')
          .select('ordre, marche_id, marches (id, nom_marche, ville, date, radius_m)')
          .eq('exploration_id', explorationId)
          .in('publication_status', ['published', 'published_public'])
          .order('ordre'),
      ]);

      const defaultRadiusM = (explo as any)?.default_radius_m ?? null;
      const fallback = defaultRadiusM ?? DEFAULT_RADIUS_M;

      const rows: MarcheRadiusRow[] = (em || [])
        .filter((r: any) => r.marches?.id)
        .map((r: any) => {
          const radius = r.marches?.radius_m ?? null;
          return {
            marcheId: r.marches.id,
            ordre: r.ordre ?? 0,
            nom: r.marches?.nom_marche || r.marches?.ville || 'Marche',
            ville: r.marches?.ville || null,
            date: r.marches?.date || null,
            radius_m: radius,
            resolvedRadiusM: radius ?? fallback,
            isOverride: radius != null,
          };
        });

      const count = rows.length;
      const values = rows.map(r => r.resolvedRadiusM);
      const avgM = count > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / count) : 0;
      const minM = count > 0 ? Math.min(...values) : 0;
      const maxM = count > 0 ? Math.max(...values) : 0;

      return { rows, defaultRadiusM, count, avgM, minM, maxM };
    },
    staleTime: 1000 * 60,
  });
}
