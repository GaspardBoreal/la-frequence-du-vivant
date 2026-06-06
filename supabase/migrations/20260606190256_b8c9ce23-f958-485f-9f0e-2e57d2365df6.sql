
-- 1. documents: enable RLS, admin-only
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
CREATE POLICY "Admins can manage documents" ON public.documents
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 2. gaspard_events: admin only writes
DROP POLICY IF EXISTS "Allow insert gaspard events" ON public.gaspard_events;
DROP POLICY IF EXISTS "Allow update gaspard events" ON public.gaspard_events;
CREATE POLICY "Admins can insert gaspard events" ON public.gaspard_events
  FOR INSERT TO authenticated WITH CHECK (public.check_is_admin_user(auth.uid()));
CREATE POLICY "Admins can update gaspard events" ON public.gaspard_events
  FOR UPDATE TO authenticated USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 3. opus_import_runs: admin-only insert
DROP POLICY IF EXISTS "Allow insert opus_import_runs" ON public.opus_import_runs;
CREATE POLICY "Admins can insert opus_import_runs" ON public.opus_import_runs
  FOR INSERT TO authenticated WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 4. transcription_models: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can manage transcription models" ON public.transcription_models;
CREATE POLICY "Admins can manage transcription models" ON public.transcription_models
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 5. engagement_analytics: block public UPDATE
DROP POLICY IF EXISTS "Public can update own engagement analytics" ON public.engagement_analytics;

-- 6. narrative_sessions: scope update / drop overly broad
DROP POLICY IF EXISTS "Users can update their own narrative_sessions" ON public.narrative_sessions;
CREATE POLICY "Block public update narrative_sessions" ON public.narrative_sessions
  FOR UPDATE TO public USING (false);

-- 7. Switch role from public -> authenticated on write policies (keep semantics, block anon)
-- marcheur_observations
DROP POLICY IF EXISTS "Authenticated users can delete marcheur_observations" ON public.marcheur_observations;
DROP POLICY IF EXISTS "Authenticated users can insert marcheur_observations" ON public.marcheur_observations;
DROP POLICY IF EXISTS "Authenticated users can update marcheur_observations" ON public.marcheur_observations;
CREATE POLICY "Authenticated users can delete marcheur_observations" ON public.marcheur_observations FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert marcheur_observations" ON public.marcheur_observations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update marcheur_observations" ON public.marcheur_observations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- marche_textes
DROP POLICY IF EXISTS "Only authenticated users can delete marche_textes" ON public.marche_textes;
DROP POLICY IF EXISTS "Only authenticated users can insert marche_textes" ON public.marche_textes;
DROP POLICY IF EXISTS "Only authenticated users can update marche_textes" ON public.marche_textes;
CREATE POLICY "Only authenticated users can delete marche_textes" ON public.marche_textes FOR DELETE TO authenticated USING (true);
CREATE POLICY "Only authenticated users can insert marche_textes" ON public.marche_textes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only authenticated users can update marche_textes" ON public.marche_textes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- exploration_marcheurs
DROP POLICY IF EXISTS "Authenticated users can delete exploration_marcheurs" ON public.exploration_marcheurs;
DROP POLICY IF EXISTS "Authenticated users can insert exploration_marcheurs" ON public.exploration_marcheurs;
DROP POLICY IF EXISTS "Authenticated users can update exploration_marcheurs" ON public.exploration_marcheurs;
CREATE POLICY "Authenticated users can delete exploration_marcheurs" ON public.exploration_marcheurs FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert exploration_marcheurs" ON public.exploration_marcheurs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update exploration_marcheurs" ON public.exploration_marcheurs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- exploration_parties
DROP POLICY IF EXISTS "Only authenticated users can delete exploration_parties" ON public.exploration_parties;
DROP POLICY IF EXISTS "Only authenticated users can insert exploration_parties" ON public.exploration_parties;
DROP POLICY IF EXISTS "Only authenticated users can update exploration_parties" ON public.exploration_parties;
CREATE POLICY "Only authenticated users can delete exploration_parties" ON public.exploration_parties FOR DELETE TO authenticated USING (true);
CREATE POLICY "Only authenticated users can insert exploration_parties" ON public.exploration_parties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only authenticated users can update exploration_parties" ON public.exploration_parties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- marche_photo_tags
DROP POLICY IF EXISTS "Only authenticated users can delete photo_tags" ON public.marche_photo_tags;
DROP POLICY IF EXISTS "Only authenticated users can insert photo_tags" ON public.marche_photo_tags;
DROP POLICY IF EXISTS "Only authenticated users can update photo_tags" ON public.marche_photo_tags;
CREATE POLICY "Only authenticated users can delete photo_tags" ON public.marche_photo_tags FOR DELETE TO authenticated USING (true);
CREATE POLICY "Only authenticated users can insert photo_tags" ON public.marche_photo_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only authenticated users can update photo_tags" ON public.marche_photo_tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- marche_contextes_hybrids
DROP POLICY IF EXISTS "Authenticated users can manage marche_contextes_hybrids" ON public.marche_contextes_hybrids;
CREATE POLICY "Authenticated users can manage marche_contextes_hybrids" ON public.marche_contextes_hybrids FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- fables_narratives
DROP POLICY IF EXISTS "Authenticated users can manage fables_narratives" ON public.fables_narratives;
CREATE POLICY "Authenticated users can manage fables_narratives" ON public.fables_narratives FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- opus_explorations
DROP POLICY IF EXISTS "Authenticated users can manage opus_explorations" ON public.opus_explorations;
CREATE POLICY "Authenticated users can manage opus_explorations" ON public.opus_explorations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- préfigurations_interactives
DROP POLICY IF EXISTS "Authenticated users can manage préfigurations_interactives" ON public."préfigurations_interactives";
CREATE POLICY "Authenticated users can manage préfigurations_interactives" ON public."préfigurations_interactives" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- export_keywords
DROP POLICY IF EXISTS "Authenticated users can delete export_keywords" ON public.export_keywords;
DROP POLICY IF EXISTS "Authenticated users can insert export_keywords" ON public.export_keywords;
CREATE POLICY "Authenticated users can delete export_keywords" ON public.export_keywords FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert export_keywords" ON public.export_keywords FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Storage: lock down marche-photos & marche-audio writes to authenticated
DROP POLICY IF EXISTS "Allow anyone to upload to marche-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to update marche-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to delete marche-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete photos storage" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public can update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete audio files" ON storage.objects;

CREATE POLICY "Authenticated can upload marche-photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marche-photos');
CREATE POLICY "Authenticated can update marche-photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'marche-photos') WITH CHECK (bucket_id = 'marche-photos');
CREATE POLICY "Authenticated can delete marche-photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'marche-photos');

CREATE POLICY "Authenticated can upload marche-audio" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marche-audio');
CREATE POLICY "Authenticated can update marche-audio" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'marche-audio') WITH CHECK (bucket_id = 'marche-audio');
CREATE POLICY "Authenticated can delete marche-audio" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'marche-audio');
