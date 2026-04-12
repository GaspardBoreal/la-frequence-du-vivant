
CREATE OR REPLACE FUNCTION public.get_event_public_textes(p_event_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(json_agg(row_to_json(r)), '[]')
  FROM (
    SELECT t.id, t.user_id, t.marche_id, t.marche_event_id,
           t.type_texte, t.titre, t.contenu, t.is_public, t.ordre, t.created_at,
           cp.prenom AS author_prenom, cp.nom AS author_nom, cp.avatar_url AS author_avatar
    FROM marcheur_textes t
    LEFT JOIN community_profiles cp ON cp.user_id = t.user_id
    WHERE t.marche_event_id = p_event_id AND t.is_public = true
    ORDER BY t.created_at
  ) r;
$$;
