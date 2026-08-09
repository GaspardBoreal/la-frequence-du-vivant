DROP POLICY IF EXISTS "Anyone can read marche events" ON public.marche_events;

DROP POLICY IF EXISTS "ouvrages_read" ON storage.objects;
CREATE POLICY "ouvrages_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'propriete-ouvrages'
  AND public.can_access_propriete(((storage.foldername(name))[1])::uuid)
);