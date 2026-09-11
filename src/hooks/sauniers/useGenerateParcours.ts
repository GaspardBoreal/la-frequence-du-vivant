import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haversineM } from '@/utils/geoDistance';
import {
  SAUNIERS_EVENT_ID,
  SAUNIERS_VILLE,
  SEGMENT_MARCHE_NOM,
  type Segment,
} from '@/content/sauniers/parcoursPropose';

export interface PointAGenerer {
  nom: string;
  lat: number;
  lng: number;
}

/** L'utilisateur courant est-il administrateur ? (les écritures restent gardées par la base) */
export function useIsAdminUser() {
  return useQuery({
    queryKey: ['sauniers-is-admin'],
    staleTime: 60_000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.rpc('check_is_admin_user', { check_user_id: user.id });
      return data === true;
    },
  });
}

/** Marches déjà créées pour l'événement, pour éviter les doublons silencieux. */
export function useMarchesExistantes() {
  return useQuery({
    queryKey: ['sauniers-marches-existantes'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marches')
        .select('id, nom_marche, created_at')
        .in('nom_marche', [SEGMENT_MARCHE_NOM.amont, SEGMENT_MARCHE_NOM.aval]);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function distanceKm(points: PointAGenerer[]): number {
  let m = 0;
  for (let i = 0; i < points.length - 1; i++) {
    m += haversineM(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
  }
  return Math.round((m / 1000) * 100) / 100;
}

interface GenerateInput {
  dateMarche: string; // ISO date
  segments: { segment: Segment; points: PointAGenerer[] }[];
  /** Supprime les marches homonymes (et leurs points) avant de recréer. */
  remplacer: boolean;
}

/**
 * Crée une marche par segment retenu, puis ses points intermédiaires rattachés
 * à l'événement Sauniers. Écritures séquentielles : à la première erreur on
 * s'arrête et on remonte le motif réel.
 */
export function useGenerateParcours() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ dateMarche, segments, remplacer }: GenerateInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté pour générer le parcours.');

      const noms = segments.map((s) => SEGMENT_MARCHE_NOM[s.segment]);

      if (remplacer && noms.length > 0) {
        const { data: anciennes, error: selErr } = await supabase
          .from('marches')
          .select('id')
          .in('nom_marche', noms);
        if (selErr) throw new Error(`Lecture des marches existantes : ${selErr.message}`);
        for (const m of anciennes ?? []) {
          const { error: wErr } = await supabase
            .from('exploration_waypoints')
            .delete()
            .eq('after_marche_id', m.id);
          if (wErr) throw new Error(`Suppression des points : ${wErr.message}`);
          const { error: mErr } = await supabase.from('marches').delete().eq('id', m.id);
          if (mErr) throw new Error(`Suppression de la marche : ${mErr.message}`);
        }
      }

      const creees: { nom: string; id: string; points: number }[] = [];

      for (const { segment, points } of segments) {
        if (points.length === 0) continue;
        const tete = points[0];

        const { data: marche, error } = await supabase
          .from('marches')
          .insert({
            nom_marche: SEGMENT_MARCHE_NOM[segment],
            ville: SAUNIERS_VILLE,
            departement: 'Charente-Maritime',
            region: 'Nouvelle-Aquitaine',
            latitude: tete.lat,
            longitude: tete.lng,
            date: dateMarche,
            distance_km: distanceKm(points),
            radius_m: 500,
            theme_principal: 'Marais salants',
            descriptif_court:
              segment === 'amont'
                ? "Les stations patrimoniales d'Ars-en-Ré, le sel raconté par le bâti."
                : 'Le marais salant : le sel, l’eau, l’argile et le vivant.',
          })
          .select('id')
          .single();
        if (error) throw new Error(`Création de la marche « ${SEGMENT_MARCHE_NOM[segment]} » : ${error.message}`);

        const suite = points.slice(1);
        if (suite.length > 0) {
          const { error: wErr } = await supabase.from('exploration_waypoints').insert(
            suite.map((p, i) => ({
              marche_event_id: SAUNIERS_EVENT_ID,
              after_marche_id: marche.id,
              ordre: i + 1,
              latitude: p.lat,
              longitude: p.lng,
              label: p.nom,
              include_in_biodiversity: true,
              created_by: user.id,
            })),
          );
          if (wErr) throw new Error(`Enregistrement des points intermédiaires : ${wErr.message}`);
        }

        creees.push({ nom: SEGMENT_MARCHE_NOM[segment], id: marche.id, points: points.length });
      }

      return creees;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sauniers-marches-existantes'] });
      qc.invalidateQueries({ queryKey: ['exploration-waypoints', SAUNIERS_EVENT_ID] });
    },
  });
}
