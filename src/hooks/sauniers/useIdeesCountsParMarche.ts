import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IdeesCountEntry {
  waypointId: string;
  lieu: number;
  vivant: number;
}

/**
 * Comptes d'idées d'animation par marche (une seule requête pour toute la carte).
 * Le lien passe par le waypoint ancré à la marche (`after_marche_id`).
 */
export function useIdeesCountsParMarche(marcheIds: string[]) {
  const cle = [...marcheIds].sort().join(',');

  return useQuery({
    queryKey: ['idees-counts-par-marche', cle],
    enabled: marcheIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, IdeesCountEntry>> => {
      const { data: waypoints, error: wErr } = await supabase
        .from('exploration_waypoints')
        .select('id, after_marche_id')
        .in('after_marche_id', marcheIds);
      if (wErr) throw new Error(wErr.message);

      const wps = waypoints ?? [];
      if (wps.length === 0) return {};

      const { data: idees, error: iErr } = await supabase
        .from('marche_animation_idees')
        .select('waypoint_id, groupe')
        .in(
          'waypoint_id',
          wps.map((w) => w.id),
        );
      if (iErr) throw new Error(iErr.message);

      const parWaypoint = new Map<string, { lieu: number; vivant: number }>();
      for (const i of idees ?? []) {
        const e = parWaypoint.get(i.waypoint_id) ?? { lieu: 0, vivant: 0 };
        if (i.groupe === 'lieu') e.lieu += 1;
        else if (i.groupe === 'vivant') e.vivant += 1;
        parWaypoint.set(i.waypoint_id, e);
      }

      const out: Record<string, IdeesCountEntry> = {};
      for (const w of wps) {
        const c = parWaypoint.get(w.id);
        if (!c || c.lieu + c.vivant === 0) continue;
        const marcheId = w.after_marche_id as string;
        // Une marche = un waypoint dans ce modèle ; on cumule par sécurité.
        const prev = out[marcheId];
        out[marcheId] = prev
          ? { waypointId: prev.waypointId, lieu: prev.lieu + c.lieu, vivant: prev.vivant + c.vivant }
          : { waypointId: w.id, lieu: c.lieu, vivant: c.vivant };
      }
      return out;
    },
  });
}

export default useIdeesCountsParMarche;
