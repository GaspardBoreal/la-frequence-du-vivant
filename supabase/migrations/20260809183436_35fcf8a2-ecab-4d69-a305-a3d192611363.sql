CREATE POLICY "Clinique medias lisibles par ayants droit"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'propriete-clinique'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_propriete(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Clinique medias deposes par ayants droit"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'propriete-clinique'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_propriete(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Clinique medias modifies par ayants droit"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'propriete-clinique'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_propriete(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Clinique medias supprimes par ayants droit"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'propriete-clinique'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_propriete(((storage.foldername(name))[1])::uuid)
);