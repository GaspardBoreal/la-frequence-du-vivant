DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_community_usage_dashboard'
  ORDER BY p.oid DESC
  LIMIT 1;

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'get_community_usage_dashboard function not found';
  END IF;

  IF position('FROM marcheur_observations o WHERE o.user_id = u.user_id' in v_def) > 0 THEN
    v_def := replace(
      v_def,
      'FROM marcheur_observations o WHERE o.user_id = u.user_id',
      'FROM marcheur_observations o WHERE o.marcheur_id = u.profile_id'
    );

    EXECUTE v_def;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.get_community_usage_dashboard(timestamp with time zone, timestamp with time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_community_usage_dashboard(timestamp with time zone, timestamp with time zone) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_community_usage_dashboard(timestamp with time zone, timestamp with time zone) TO authenticated;