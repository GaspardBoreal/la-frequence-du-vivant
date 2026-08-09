-- 1. Déplacement chirurgical d'un prélèvement (lat/lng uniquement)
CREATE OR REPLACE FUNCTION public.move_propriete_soil_sample(
  p_propriete_id uuid,
  p_sample_id text,
  p_lat numeric,
  p_lng numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_allowed boolean;
  v_samples jsonb;
  v_idx int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF p_sample_id IS NULL OR p_lat IS NULL OR p_lng IS NULL THEN
    RAISE EXCEPTION 'invalid arguments';
  END IF;

  SELECT (
    public.check_is_admin_user(v_uid)
    OR EXISTS (
      SELECT 1 FROM public.proprietes p
      LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
      WHERE p.id = p_propriete_id AND cp.user_id = v_uid
    )
    OR EXISTS (
      SELECT 1 FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = p_propriete_id AND cp.user_id = v_uid
    )
  ) INTO v_allowed;

  IF NOT v_allowed THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT samples INTO v_samples
  FROM public.propriete_soil_diagnostics
  WHERE propriete_id = p_propriete_id;

  IF v_samples IS NULL OR jsonb_typeof(v_samples) <> 'array' THEN
    RAISE EXCEPTION 'registre introuvable';
  END IF;

  SELECT ord - 1 INTO v_idx
  FROM jsonb_array_elements(v_samples) WITH ORDINALITY AS t(elem, ord)
  WHERE elem->>'id' = p_sample_id
  LIMIT 1;

  IF v_idx IS NULL THEN
    RAISE EXCEPTION 'prélèvement % introuvable', p_sample_id;
  END IF;

  v_samples := jsonb_set(
    jsonb_set(v_samples, ARRAY[v_idx::text, 'lat'], to_jsonb(p_lat), true),
    ARRAY[v_idx::text, 'lng'], to_jsonb(p_lng), true
  );

  UPDATE public.propriete_soil_diagnostics
  SET samples = v_samples, updated_by = v_uid
  WHERE propriete_id = p_propriete_id;
END $$;

GRANT EXECUTE ON FUNCTION public.move_propriete_soil_sample(uuid, text, numeric, numeric) TO authenticated;

-- 2. Alignement de la policy d'écriture sur les marcheurs rattachés
DROP POLICY IF EXISTS soil_write ON public.propriete_soil_diagnostics;
CREATE POLICY soil_write
ON public.propriete_soil_diagnostics
FOR ALL
TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.propriete_marcheurs pm
    JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
    WHERE pm.propriete_id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  public.check_is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.proprietes p
    LEFT JOIN public.community_profiles cp ON cp.id = p.main_walker_id
    WHERE p.id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.propriete_marcheurs pm
    JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
    WHERE pm.propriete_id = propriete_soil_diagnostics.propriete_id AND cp.user_id = auth.uid()
  )
);

-- 3. Audit en direct des verrous (admins uniquement)
CREATE OR REPLACE FUNCTION public.audit_propriete_soil_guards()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_out jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.check_is_admin_user(v_uid) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'checked_at', now(),
    'triggers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', t.tgname,
        'enabled', t.tgenabled <> 'D',
        'function', p.proname
      ) ORDER BY t.tgname)
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE n.nspname = 'public'
        AND c.relname = 'propriete_soil_diagnostics'
        AND NOT t.tgisinternal
    ), '[]'::jsonb),
    'functions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', p.proname,
        'security_definer', p.prosecdef,
        'granted_to_authenticated',
          has_function_privilege('authenticated', p.oid, 'EXECUTE')
      ) ORDER BY p.proname)
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN ('upsert_propriete_soil', 'move_propriete_soil_sample',
                          'guard_propriete_soil_samples', 'log_propriete_soil_history')
    ), '[]'::jsonb),
    'policies', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'table', pol.tablename,
        'name', pol.policyname,
        'cmd', pol.cmd,
        'roles', pol.roles::text,
        'covers_attached_walkers', COALESCE(pol.qual, '') LIKE '%propriete_marcheurs%'
      ) ORDER BY pol.tablename, pol.policyname)
      FROM pg_policies pol
      WHERE pol.schemaname = 'public'
        AND pol.tablename IN ('propriete_soil_diagnostics', 'propriete_soil_diagnostics_history')
    ), '[]'::jsonb),
    'history_table_exists', EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'propriete_soil_diagnostics_history'
    ),
    'rls_enabled', COALESCE((
      SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'propriete_soil_diagnostics'
    ), false),
    'history_count', (SELECT count(*) FROM public.propriete_soil_diagnostics_history),
    'registers_count', (SELECT count(*) FROM public.propriete_soil_diagnostics)
  ) INTO v_out;

  RETURN v_out;
END $$;

GRANT EXECUTE ON FUNCTION public.audit_propriete_soil_guards() TO authenticated;

-- 4. Journal des versions enrichi pour l'audit (admins uniquement)
CREATE OR REPLACE FUNCTION public.audit_propriete_soil_history(p_limit integer DEFAULT 40)
RETURNS TABLE (
  id uuid,
  propriete_id uuid,
  propriete_nom text,
  changed_at timestamptz,
  samples_count integer,
  previous_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT h.id,
         h.propriete_id,
         p.nom::text,
         h.changed_at,
         h.samples_count,
         LAG(h.samples_count) OVER (PARTITION BY h.propriete_id ORDER BY h.changed_at)
  FROM public.propriete_soil_diagnostics_history h
  LEFT JOIN public.proprietes p ON p.id = h.propriete_id
  ORDER BY h.changed_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 40), 200));
END $$;

GRANT EXECUTE ON FUNCTION public.audit_propriete_soil_history(integer) TO authenticated;