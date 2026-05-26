CREATE OR REPLACE FUNCTION public.admin_orphan_activity_logs()
RETURNS TABLE (
  user_id uuid,
  logs_count bigint,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  event_types text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    mal.user_id,
    COUNT(*)::bigint AS logs_count,
    MIN(mal.created_at) AS first_seen_at,
    MAX(mal.created_at) AS last_seen_at,
    ARRAY_AGG(DISTINCT mal.event_type) AS event_types
  FROM public.marcheur_activity_logs mal
  WHERE NOT EXISTS (
    SELECT 1 FROM public.community_profiles cp WHERE cp.user_id = mal.user_id
  )
  GROUP BY mal.user_id
  ORDER BY MAX(mal.created_at) DESC;
END;
$$;