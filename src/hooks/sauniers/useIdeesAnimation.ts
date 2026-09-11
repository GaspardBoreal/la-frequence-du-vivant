import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fallbackIdees } from '@/content/sauniers/animationsFallback';
import { SAUNIERS_EVENT_ID, type Segment } from '@/content/sauniers/parcoursPropose';

export type GroupeIdee = 'lieu' | 'vivant';

export interface IdeeEnregistree {
  id: string;
  waypoint_id: string;
  groupe: GroupeIdee;
  ordre: number;
  titre: string;
  description: string;
  duree: string;
  materiel: string;
  source: 'assistant' | 'humain';
  created_at?: string;
}

export interface ContextePoint {
  nom: string;
  sous: string;
  texte: string;
  segment: Segment;
}

export const CHAMPS_IDEE =
  'id, waypoint_id, groupe, ordre, titre, description, duree, materiel, source, created_at';

/**
 * Génère puis enregistre les six idées d'un arrêt.
 * Logique partagée entre la fiche d'un arrêt et la génération globale.
 */
export async function genererIdeesPourArret(params: {
  waypointId: string;
  point: ContextePoint;
  remplacer: boolean;
  userId: string;
}): Promise<{ secours: boolean }> {
  const { waypointId, point, remplacer, userId } = params;

  const secoursIdees = fallbackIdees(point.nom, point.segment);
  let lieu = secoursIdees.lieu;
  let vivant = secoursIdees.vivant;
  let secours = true;

  try {
    const { data, error } = await supabase.functions.invoke('sauniers-animation-ideas', {
      body: point,
    });
    const res = data as any;
    if (error || !res || res.error || !res.lieu?.length || !res.vivant?.length) {
      throw new Error(res?.error ?? error?.message ?? 'Assistant indisponible');
    }
    lieu = res.lieu.slice(0, 3);
    vivant = res.vivant.slice(0, 3);
    secours = false;
  } catch {
    secours = true;
  }

  if (remplacer) {
    const { error: dErr } = await supabase
      .from('marche_animation_idees')
      .delete()
      .eq('waypoint_id', waypointId)
      .eq('source', 'assistant');
    if (dErr) throw new Error(dErr.message);
  }

  const lignes = [
    ...lieu.map((i, n) => ({ ...i, groupe: 'lieu' as GroupeIdee, ordre: n + 1 })),
    ...vivant.map((i, n) => ({ ...i, groupe: 'vivant' as GroupeIdee, ordre: n + 1 })),
  ].map((i) => ({
    marche_event_id: SAUNIERS_EVENT_ID,
    waypoint_id: waypointId,
    groupe: i.groupe,
    ordre: i.ordre,
    titre: i.titre,
    description: i.description,
    duree: i.duree,
    materiel: i.materiel,
    source: 'assistant',
    created_by: userId,
  }));

  const { error: iErr } = await supabase.from('marche_animation_idees').insert(lignes);
  if (iErr) throw new Error(iErr.message);

  return { secours };
}


/** Idées enregistrées pour un arrêt (lecture publique). */
export function useIdeesArret(waypointId: string | null) {
  const qc = useQueryClient();
  const cle = ['sauniers-idees', waypointId] as const;

  const requete = useQuery({
    queryKey: cle,
    enabled: !!waypointId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_animation_idees')
        .select(CHAMPS_IDEE)
        .eq('waypoint_id', waypointId!)
        .order('groupe', { ascending: true })
        .order('ordre', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as IdeeEnregistree[];
    },
  });

  const rafraichir = () => qc.invalidateQueries({ queryKey: cle });

  /** Demande six propositions à l'Assistant et les enregistre. */
  const generer = useMutation({
    mutationFn: async ({
      point,
      remplacer,
    }: {
      point: ContextePoint;
      remplacer: boolean;
    }): Promise<{ secours: boolean }> => {
      if (!waypointId) throw new Error('Aucun arrêt sélectionné.');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté pour enregistrer des idées.');

      let lieu = fallbackIdees(point.nom, point.segment).lieu;
      let vivant = fallbackIdees(point.nom, point.segment).vivant;
      let secours = true;

      try {
        const { data, error } = await supabase.functions.invoke('sauniers-animation-ideas', {
          body: point,
        });
        const res = data as any;
        if (error || !res || res.error || !res.lieu?.length || !res.vivant?.length) {
          throw new Error(res?.error ?? error?.message ?? 'Assistant indisponible');
        }
        lieu = res.lieu.slice(0, 3);
        vivant = res.vivant.slice(0, 3);
        secours = false;
      } catch {
        secours = true;
      }

      if (remplacer) {
        const { error: dErr } = await supabase
          .from('marche_animation_idees')
          .delete()
          .eq('waypoint_id', waypointId)
          .eq('source', 'assistant');
        if (dErr) throw new Error(dErr.message);
      }

      const lignes = [
        ...lieu.map((i, n) => ({ ...i, groupe: 'lieu' as GroupeIdee, ordre: n + 1 })),
        ...vivant.map((i, n) => ({ ...i, groupe: 'vivant' as GroupeIdee, ordre: n + 1 })),
      ].map((i) => ({
        marche_event_id: SAUNIERS_EVENT_ID,
        waypoint_id: waypointId,
        groupe: i.groupe,
        ordre: i.ordre,
        titre: i.titre,
        description: i.description,
        duree: i.duree,
        materiel: i.materiel,
        source: 'assistant',
        created_by: user.id,
      }));

      const { error: iErr } = await supabase.from('marche_animation_idees').insert(lignes);
      if (iErr) throw new Error(iErr.message);
      await rafraichir();
      return { secours };
    },
  });

  const modifier = useMutation({
    mutationFn: async ({ id, champs }: { id: string; champs: Partial<IdeeEnregistree> }) => {
      const { error } = await supabase
        .from('marche_animation_idees')
        .update(champs)
        .eq('id', id);
      if (error) throw new Error(error.message);
      await rafraichir();
    },
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marche_animation_idees').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await rafraichir();
    },
  });

  const ajouter = useMutation({
    mutationFn: async (groupe: GroupeIdee) => {
      if (!waypointId) throw new Error('Aucun arrêt sélectionné.');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté pour ajouter une idée.');
      const existantes = (requete.data ?? []).filter((i) => i.groupe === groupe);
      const { error } = await supabase.from('marche_animation_idees').insert({
        marche_event_id: SAUNIERS_EVENT_ID,
        waypoint_id: waypointId,
        groupe,
        ordre: existantes.length + 1,
        titre: 'Nouvelle animation',
        description: '',
        duree: '15 min',
        materiel: '',
        source: 'humain',
        created_by: user.id,
      });
      if (error) throw new Error(error.message);
      await rafraichir();
    },
  });

  const idees = requete.data ?? [];

  return {
    idees,
    lieu: idees.filter((i) => i.groupe === 'lieu'),
    vivant: idees.filter((i) => i.groupe === 'vivant'),
    chargement: requete.isLoading,
    generer,
    modifier,
    supprimer,
    ajouter,
  };
}

export default useIdeesArret;
