
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
  IF NOT public.has_role(auth.uid(), 'admin') THEN
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

CREATE OR REPLACE FUNCTION public.admin_delete_orphan_activity_logs(p_user_ids uuid[])
RETURNS TABLE (deleted_count integer, affected_users uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
  v_users uuid[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    deleted_count := 0;
    affected_users := ARRAY[]::uuid[];
    RETURN NEXT;
    RETURN;
  END IF;

  IF array_length(p_user_ids, 1) > 500 THEN
    RAISE EXCEPTION 'Too many user ids (max 500)';
  END IF;

  WITH del AS (
    DELETE FROM public.marcheur_activity_logs mal
    WHERE mal.user_id = ANY(p_user_ids)
      AND NOT EXISTS (
        SELECT 1 FROM public.community_profiles cp WHERE cp.user_id = mal.user_id
      )
    RETURNING mal.user_id
  )
  SELECT COUNT(*)::int, COALESCE(ARRAY_AGG(DISTINCT user_id), ARRAY[]::uuid[])
  INTO v_deleted, v_users
  FROM del;

  deleted_count := v_deleted;
  affected_users := v_users;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_orphan_activity_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_orphan_activity_logs(uuid[]) TO authenticated;
