DROP FUNCTION IF EXISTS public.admin_delete_orphan_activity_logs(uuid[]);

CREATE FUNCTION public.admin_delete_orphan_activity_logs(p_user_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  WITH safe_ids AS (
    SELECT uid FROM unnest(p_user_ids) AS uid
    WHERE NOT EXISTS (
      SELECT 1 FROM public.community_profiles cp WHERE cp.user_id = uid
    )
  )
  DELETE FROM public.marcheur_activity_logs
  WHERE user_id IN (SELECT uid FROM safe_ids);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;