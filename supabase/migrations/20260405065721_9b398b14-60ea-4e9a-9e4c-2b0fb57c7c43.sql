CREATE OR REPLACE FUNCTION public.get_exploration_participants(p_exploration_id uuid)
RETURNS TABLE (
  user_id uuid,
  prenom text,
  nom text,
  avatar_url text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    cp.user_id,
    cp.prenom,
    cp.nom,
    cp.avatar_url,
    cp.role::text
  FROM marche_participations mp
  JOIN marche_events me ON me.id = mp.marche_event_id
  JOIN community_profiles cp ON cp.user_id = mp.user_id
  WHERE me.exploration_id = p_exploration_id;
$$;