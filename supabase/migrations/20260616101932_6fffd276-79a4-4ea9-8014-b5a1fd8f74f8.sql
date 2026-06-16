
-- 1) audit_runs: hide launched_by_email from anonymous visitors
REVOKE SELECT (launched_by_email) ON public.audit_runs FROM anon;

-- 2) exploration_engagement_settings: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can manage engagement settings" ON public.exploration_engagement_settings;
CREATE POLICY "Admins manage engagement settings"
  ON public.exploration_engagement_settings
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 3) frequence_citations: admin-only updates + safe RPC for counters
DROP POLICY IF EXISTS "Authenticated users can increment counters" ON public.frequence_citations;
CREATE POLICY "Admins can update citations"
  ON public.frequence_citations
  FOR UPDATE TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE OR REPLACE FUNCTION public.increment_citation_counter(_id uuid, _kind text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _kind = 'shown' THEN
    UPDATE public.frequence_citations SET shown_count = COALESCE(shown_count,0) + 1 WHERE id = _id;
  ELSIF _kind = 'viewed' THEN
    UPDATE public.frequence_citations SET viewed_count = COALESCE(viewed_count,0) + 1 WHERE id = _id;
  ELSE
    RAISE EXCEPTION 'invalid kind: %', _kind;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_citation_counter(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_citation_counter(uuid, text) TO anon, authenticated;

-- 4) Editorial content tables: admin-only UPDATE/DELETE
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'narrative_landscapes','marches','explorations','marche_etudes',
    'marche_photos','marche_videos','marche_audio','marche_documents',
    'marche_tags','marche_textes','marche_photo_tags',
    'exploration_marches','exploration_pages','exploration_parties',
    'exploration_narrative_settings','opus_explorations','fables_narratives',
    'marche_contextes_hybrids','préfigurations_interactives'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t) THEN
      CONTINUE;
    END IF;

    -- Drop overly-permissive UPDATE / DELETE policies (those with USING true or null and not checking admin)
    FOR pol IN
      SELECT p.polname, p.polcmd,
             pg_get_expr(p.polqual, p.polrelid) AS u_expr,
             pg_get_expr(p.polwithcheck, p.polrelid) AS c_expr
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relname=t AND p.polcmd IN ('w','d')
    LOOP
      IF (pol.u_expr IS NULL OR pol.u_expr = 'true' OR pol.u_expr ILIKE '%true%')
         AND (pol.c_expr IS NULL OR pol.c_expr = 'true' OR pol.c_expr ILIKE '%true%')
         AND pol.u_expr !~* 'admin|auth\.uid|created_by|user_id'
         AND (pol.c_expr IS NULL OR pol.c_expr !~* 'admin|auth\.uid|created_by|user_id')
      THEN
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.polname, t);
      END IF;
    END LOOP;

    -- Create admin-only UPDATE & DELETE policies (idempotent names)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can update '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.check_is_admin_user(auth.uid())) WITH CHECK (public.check_is_admin_user(auth.uid()))', 'Admins can update '||t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can delete '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.check_is_admin_user(auth.uid()))', 'Admins can delete '||t, t);
  END LOOP;
END $$;

-- 5) Storage: restrict write/update/delete on shared buckets to ambassadeurs/sentinelles/admins
DO $$
DECLARE
  buckets text[] := ARRAY['marche-photos','marche-videos','marche-audio','documents-annexes','etudes-pdf'];
  b text;
  pol record;
BEGIN
  -- Drop existing permissive write/update/delete policies referencing those buckets
  FOR pol IN
    SELECT p.polname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='storage' AND c.relname='objects' AND p.polcmd IN ('a','w','d')
      AND (
        pg_get_expr(p.polqual, p.polrelid) ~ 'marche-(photos|videos|audio)|documents-annexes|etudes-pdf'
        OR pg_get_expr(p.polwithcheck, p.polrelid) ~ 'marche-(photos|videos|audio)|documents-annexes|etudes-pdf'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;

  FOREACH b IN ARRAY buckets LOOP
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND public.can_create_marche(auth.uid()))',
      'Organizers can upload to '||b, b
    );
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L AND public.can_create_marche(auth.uid())) WITH CHECK (bucket_id = %L AND public.can_create_marche(auth.uid()))',
      'Organizers can update '||b, b, b
    );
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND public.can_create_marche(auth.uid()))',
      'Organizers can delete '||b, b
    );
  END LOOP;
END $$;
