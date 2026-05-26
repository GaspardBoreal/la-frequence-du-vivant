
CREATE OR REPLACE FUNCTION public.admin_orphan_invited_readers()
RETURNS TABLE(user_id uuid, invitations_count bigint, event_titles text[], last_invited_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT eir.user_id,
         count(*)::bigint AS invitations_count,
         array_agg(DISTINCT me.title) AS event_titles,
         max(eir.created_at) AS last_invited_at
  FROM event_invited_readers eir
  JOIN marche_events me ON me.id = eir.event_id
  WHERE NOT EXISTS (SELECT 1 FROM community_profiles cp WHERE cp.user_id = eir.user_id)
    AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = eir.user_id)
  GROUP BY eir.user_id;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_orphan_invited_readers(p_user_ids uuid[])
RETURNS TABLE(deleted_count int, affected_users uuid[])
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deleted int;
  v_users uuid[];
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH del AS (
    DELETE FROM event_invited_readers eir
    WHERE eir.user_id = ANY(p_user_ids)
      AND NOT EXISTS (SELECT 1 FROM community_profiles cp WHERE cp.user_id = eir.user_id)
      AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = eir.user_id)
    RETURNING eir.user_id
  )
  SELECT count(*)::int, array_agg(DISTINCT user_id) INTO v_deleted, v_users FROM del;
  deleted_count := COALESCE(v_deleted, 0);
  affected_users := COALESCE(v_users, ARRAY[]::uuid[]);
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_orphan_invited_readers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_orphan_invited_readers(uuid[]) TO authenticated;
