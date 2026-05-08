CREATE OR REPLACE FUNCTION public.get_event_public_textes(p_event_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(json_agg(row_to_json(r)), '[]')
  FROM (
    SELECT
      t.id,
      COALESCE(em.user_id, t.attributed_user_id, t.user_id) AS user_id,
      t.attributed_marcheur_id,
      t.marche_id, t.marche_event_id,
      t.type_texte, t.titre, t.contenu, t.is_public, t.ordre, t.created_at,
      COALESCE(cp.prenom, em.prenom)         AS author_prenom,
      COALESCE(cp.nom, em.nom)               AS author_nom,
      COALESCE(cp.avatar_url, em.avatar_url) AS author_avatar
    FROM marcheur_textes t
    LEFT JOIN exploration_marcheurs em ON em.id = t.attributed_marcheur_id
    LEFT JOIN community_profiles cp
      ON cp.user_id = COALESCE(em.user_id, t.attributed_user_id, t.user_id)
    WHERE t.marche_event_id = p_event_id AND t.is_public = true
    ORDER BY t.created_at
  ) r;
$function$;

CREATE OR REPLACE FUNCTION public.get_exploration_public_textes(p_exploration_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(json_agg(row_to_json(r)), '[]')
  FROM (
    SELECT
      t.id,
      COALESCE(em.user_id, t.attributed_user_id, t.user_id) AS user_id,
      t.attributed_marcheur_id,
      t.marche_id, t.marche_event_id,
      t.type_texte, t.titre, t.contenu, t.is_public, t.ordre, t.created_at,
      COALESCE(cp.prenom, em.prenom)         AS author_prenom,
      COALESCE(cp.nom, em.nom)               AS author_nom,
      COALESCE(cp.avatar_url, em.avatar_url) AS author_avatar
    FROM marcheur_textes t
    LEFT JOIN exploration_marcheurs em ON em.id = t.attributed_marcheur_id
    LEFT JOIN community_profiles cp
      ON cp.user_id = COALESCE(em.user_id, t.attributed_user_id, t.user_id)
    WHERE t.is_public = true
      AND (
        t.marche_id IN (
          SELECT em2.marche_id FROM exploration_marches em2 WHERE em2.exploration_id = p_exploration_id
        )
        OR t.marche_event_id IN (
          SELECT me.id FROM marche_events me WHERE me.exploration_id = p_exploration_id
        )
      )
    ORDER BY t.created_at
  ) r;
$function$;