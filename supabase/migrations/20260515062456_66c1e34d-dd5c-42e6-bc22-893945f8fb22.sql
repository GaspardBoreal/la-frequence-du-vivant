CREATE OR REPLACE FUNCTION public.search_community_profiles_for_invite(
  _event_id uuid,
  _search text
)
RETURNS TABLE (
  user_id uuid,
  prenom text,
  nom text,
  email text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _search IS NULL OR length(trim(_search)) < 2 THEN
    RETURN;
  END IF;

  v_tokens := regexp_split_to_array(trim(_search), '\s+');

  RETURN QUERY
  SELECT
    cp.user_id,
    cp.prenom,
    cp.nom,
    u.email::text AS email,
    cp.avatar_url
  FROM public.community_profiles cp
  LEFT JOIN auth.users u ON u.id = cp.user_id
  WHERE (
    SELECT bool_and(
      coalesce(cp.prenom, '') ILIKE '%' || tok || '%'
      OR coalesce(cp.nom, '') ILIKE '%' || tok || '%'
      OR coalesce(u.email::text, '') ILIKE '%' || tok || '%'
    )
    FROM unnest(v_tokens) AS tok
    WHERE length(tok) > 0
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.event_invited_readers eir
    WHERE eir.event_id = _event_id AND eir.user_id = cp.user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.marche_participations mp
    WHERE mp.marche_event_id = _event_id
      AND mp.user_id = cp.user_id
      AND mp.validated_at IS NOT NULL
  )
  ORDER BY cp.prenom, cp.nom
  LIMIT 20;
END;
$$;