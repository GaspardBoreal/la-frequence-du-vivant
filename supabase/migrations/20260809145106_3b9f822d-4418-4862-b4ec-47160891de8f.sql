-- 1. CRM opportunity documents ------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view opportunity documents" ON public.crm_opportunity_documents;
DROP POLICY IF EXISTS "Authenticated can insert opportunity documents" ON public.crm_opportunity_documents;
DROP POLICY IF EXISTS "Authenticated can update opportunity documents" ON public.crm_opportunity_documents;
DROP POLICY IF EXISTS "Authenticated can delete opportunity documents" ON public.crm_opportunity_documents;

CREATE POLICY "CRM members view opportunity documents" ON public.crm_opportunity_documents
  FOR SELECT TO authenticated
  USING (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid()));
CREATE POLICY "CRM members insert opportunity documents" ON public.crm_opportunity_documents
  FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid())) AND uploaded_by = auth.uid());
CREATE POLICY "CRM members update opportunity documents" ON public.crm_opportunity_documents
  FOR UPDATE TO authenticated
  USING (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid()));
CREATE POLICY "CRM members delete opportunity documents" ON public.crm_opportunity_documents
  FOR DELETE TO authenticated
  USING (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid()));

-- Storage bucket crm-opportunity-docs
DROP POLICY IF EXISTS "Authenticated can read crm-opportunity-docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload crm-opportunity-docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update crm-opportunity-docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete crm-opportunity-docs" ON storage.objects;

CREATE POLICY "CRM read crm-opportunity-docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crm-opportunity-docs' AND (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid())));
CREATE POLICY "CRM upload crm-opportunity-docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-opportunity-docs' AND (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid())));
CREATE POLICY "CRM update crm-opportunity-docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'crm-opportunity-docs' AND (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid())));
CREATE POLICY "CRM delete crm-opportunity-docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crm-opportunity-docs' AND (public.can_access_crm(auth.uid()) OR public.check_is_admin_user(auth.uid())));

-- 2. marche_events : anon limité aux événements publiés ------------------------
DROP POLICY IF EXISTS "Public can view marche_events" ON public.marche_events;
CREATE POLICY "Anon can view published marche_events" ON public.marche_events
  FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "Authenticated can view marche_events" ON public.marche_events
  FOR SELECT TO authenticated USING (true);

-- 3. marcheur_observations : écritures restreintes ------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert marcheur_observations" ON public.marcheur_observations;
DROP POLICY IF EXISTS "Authenticated users can update marcheur_observations" ON public.marcheur_observations;
DROP POLICY IF EXISTS "Authenticated users can delete marcheur_observations" ON public.marcheur_observations;

CREATE OR REPLACE FUNCTION public.can_write_marcheur_observation(_marcheur_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.exploration_marcheurs em
      WHERE em.id = _marcheur_id AND em.user_id = auth.uid()
    )
    OR public.check_is_admin_user(auth.uid())
    OR public.is_exploration_curator(auth.uid())
    OR public.is_gps_curator(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.exploration_marcheurs em
      WHERE em.id = _marcheur_id
        AND public.is_event_curator(auth.uid(), em.exploration_id)
    )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_write_marcheur_observation(uuid) FROM anon;

CREATE POLICY "Owners and curators insert marcheur_observations" ON public.marcheur_observations
  FOR INSERT TO authenticated WITH CHECK (public.can_write_marcheur_observation(marcheur_id));
CREATE POLICY "Owners and curators update marcheur_observations" ON public.marcheur_observations
  FOR UPDATE TO authenticated
  USING (public.can_write_marcheur_observation(marcheur_id))
  WITH CHECK (public.can_write_marcheur_observation(marcheur_id));
CREATE POLICY "Owners and curators delete marcheur_observations" ON public.marcheur_observations
  FOR DELETE TO authenticated USING (public.can_write_marcheur_observation(marcheur_id));

-- 4. opus / fables / préfigurations / contextes hybrides ------------------------
DROP POLICY IF EXISTS "Authenticated users can manage opus_explorations" ON public.opus_explorations;
DROP POLICY IF EXISTS "Authenticated users can manage fables_narratives" ON public.fables_narratives;
DROP POLICY IF EXISTS "Authenticated users can manage préfigurations_interactives" ON public."préfigurations_interactives";
DROP POLICY IF EXISTS "Authenticated users can manage marche_contextes_hybrids" ON public.marche_contextes_hybrids;

CREATE POLICY "Admins and curators insert opus_explorations" ON public.opus_explorations
  FOR INSERT TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()) OR public.is_exploration_curator(auth.uid()));
CREATE POLICY "Admins and curators insert fables_narratives" ON public.fables_narratives
  FOR INSERT TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()) OR public.is_exploration_curator(auth.uid()));
CREATE POLICY "Admins and curators insert prefigurations" ON public."préfigurations_interactives"
  FOR INSERT TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()) OR public.is_exploration_curator(auth.uid()));
CREATE POLICY "Admins and curators insert marche_contextes_hybrids" ON public.marche_contextes_hybrids
  FOR INSERT TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()) OR public.is_exploration_curator(auth.uid()));

-- 5. Dordonia : suppression des updates anonymes -------------------------------
DROP POLICY IF EXISTS "Public update dordonia_sessions" ON public.dordonia_sessions;
DROP POLICY IF EXISTS "Public update dordonia_revers" ON public.dordonia_revers;
DROP POLICY IF EXISTS "Public update dordonia_care_registry" ON public.dordonia_care_registry;

-- 6. Fonctions d'administration non appelables par anon -------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.prosecdef
      AND p.proname ~* '^(admin_|create_admin|remove_admin|confirm_admin|get_admin|purge|cleanup)'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- 7. search_path figé sur toutes les fonctions du schéma public -----------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f','p')
      AND p.prolang <> (SELECT oid FROM pg_language WHERE lanname = 'c')
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', r.sig);
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END $$;

-- 8. Plus de clé anon en dur dans le déclencheur de backfill iNaturalist --------
CREATE OR REPLACE FUNCTION public.request_inaturalist_backfill(
  p_user_id uuid,
  p_exploration_id uuid,
  p_marche_event_id uuid,
  p_source text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF p_user_id IS NULL OR p_exploration_id IS NULL THEN RETURN NULL; END IF;

  -- L'appel HTTP direct (qui exposait la clé publique en dur) est supprimé :
  -- le traitement quotidien backfill-marcheur-inat-batch prend le relais.
  INSERT INTO public.marcheur_backfill_log (user_id, exploration_id, marche_event_id, source, status)
  VALUES (p_user_id, p_exploration_id, p_marche_event_id, coalesce(p_source, 'trigger'), 'queued');

  RETURN NULL;
END;
$$;