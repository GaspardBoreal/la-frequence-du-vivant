
-- Créer les politiques Storage pour le bucket marche-audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marche-audio',
  'marche-audio',
  true,
  104857600,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/flac']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Créer les politiques Storage pour permettre l'upload public
CREATE POLICY "Public can upload audio files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'marche-audio');

CREATE POLICY "Public can view audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marche-audio');

CREATE POLICY "Public can update audio files"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'marche-audio')
WITH CHECK (bucket_id = 'marche-audio');

CREATE POLICY "Public can delete audio files"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'marche-audio');

-- Vérifier et corriger les politiques RLS sur la table marche_audio
DROP POLICY IF EXISTS "Public can insert audio" ON public.marche_audio;
CREATE POLICY "Public can insert audio"
ON public.marche_audio FOR INSERT
TO public
WITH CHECK (true);

-- S'assurer que RLS est activé sur la table
ALTER TABLE public.marche_audio ENABLE ROW LEVEL SECURITY;
