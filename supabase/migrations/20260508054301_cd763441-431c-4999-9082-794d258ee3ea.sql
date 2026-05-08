CREATE OR REPLACE FUNCTION public.get_event_public_textes(p_event_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT t.*,
           em.user_id    AS crew_user_id,
           em.prenom     AS crew_prenom,
           em.nom        AS crew_nom,
           em.avatar_url AS crew_avatar,
           CASE
             WHEN t.attributed_marcheur_id IS NOT NULL THEN em.user_id
             WHEN t.attributed_user_id IS NOT NULL THEN t.attributed_user_id
             ELSE t.user_id
           END AS effective_user_id
    FROM marcheur_textes t
    LEFT JOIN exploration_marcheurs em ON em.id = t.attributed_marcheur_id
    WHERE t.marche_event_id = p_event_id AND t.is_public = true
  )
  SELECT coalesce(json_agg(row_to_json(r)), '[]')
  FROM (
    SELECT
      b.id,
      COALESCE(b.effective_user_id, b.user_id) AS user_id,
      b.attributed_marcheur_id,
      b.marche_id, b.marche_event_id,
      b.type_texte, b.titre, b.contenu, b.is_public, b.ordre, b.created_at,
      CASE WHEN b.attributed_marcheur_id IS NOT NULL AND b.crew_user_id IS NULL
           THEN b.crew_prenom ELSE COALESCE(cp.prenom, b.crew_prenom) END AS author_prenom,
      CASE WHEN b.attributed_marcheur_id IS NOT NULL AND b.crew_user_id IS NULL
           THEN b.crew_nom ELSE COALESCE(cp.nom, b.crew_nom) END AS author_nom,
      CASE WHEN b.attributed_marcheur_id IS NOT NULL AND b.crew_user_id IS NULL
           THEN b.crew_avatar ELSE COALESCE(cp.avatar_url, b.crew_avatar) END AS author_avatar
    FROM base b
    LEFT JOIN community_profiles cp ON cp.user_id = b.effective_user_id
    ORDER BY b.created_at
  ) r;
$function$;

CREATE OR REPLACE FUNCTION public.get_exploration_public_textes(p_exploration_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT t.*,
           em.user_id    AS crew_user_id,
           em.prenom     AS crew_prenom,
           em.nom        AS crew_nom,
           em.avatar_url AS crew_avatar,
           CASE
             WHEN t.attributed_marcheur_id IS NOT NULL THEN em.user_id
             WHEN t.attributed_user_id IS NOT NULL THEN t.attributed_user_id
             ELSE t.user_id
           END AS effective_user_id
    FROM marcheur_textes t
    LEFT JOIN exploration_marcheurs em ON em.id = t.attributed_marcheur_id
    WHERE t.is_public = true
      AND (
        t.marche_id IN (
          SELECT em2.marche_id FROM exploration_marches em2 WHERE em2.exploration_id = p_exploration_id
        )
        OR t.marche_event_id IN (
          SELECT me.id FROM marche_events me WHERE me.exploration_id = p_exploration_id
        )
      )
  )
  SELECT coalesce(json_agg(row_to_json(r)), '[]')
  FROM (
    SELECT
      b.id,
      COALESCE(b.effective_user_id, b.user_id) AS user_id,
      b.attributed_marcheur_id,
      b.marche_id, b.marche_event_id,
      b.type_texte, b.titre, b.contenu, b.is_public, b.ordre, b.created_at,
      CASE WHEN b.attributed_marcheur_id IS NOT NULL AND b.crew_user_id IS NULL
           THEN b.crew_prenom ELSE COALESCE(cp.prenom, b.crew_prenom) END AS author_prenom,
      CASE WHEN b.attributed_marcheur_id IS NOT NULL AND b.crew_user_id IS NULL
           THEN b.crew_nom ELSE COALESCE(cp.nom, b.crew_nom) END AS author_nom,
      CASE WHEN b.attributed_marcheur_id IS NOT NULL AND b.crew_user_id IS NULL
           THEN b.crew_avatar ELSE COALESCE(cp.avatar_url, b.crew_avatar) END AS author_avatar
    FROM base b
    LEFT JOIN community_profiles cp ON cp.user_id = b.effective_user_id
    ORDER BY b.created_at
  ) r;
$function$;