
-- Permettre l'insertion de nouvelles marches
CREATE POLICY "Allow insert marches" ON public.marches
  FOR INSERT WITH CHECK (true);

-- Permettre la mise à jour des marches
CREATE POLICY "Allow update marches" ON public.marches
  FOR UPDATE USING (true);

-- Permettre l'insertion de photos de marches
CREATE POLICY "Allow insert photos" ON public.marche_photos
  FOR INSERT WITH CHECK (true);

-- Permettre l'insertion de vidéos de marches
CREATE POLICY "Allow insert videos" ON public.marche_videos
  FOR INSERT WITH CHECK (true);

-- Permettre l'insertion d'audio de marches
CREATE POLICY "Allow insert audio" ON public.marche_audio
  FOR INSERT WITH CHECK (true);

-- Permettre l'insertion de tags de marches
CREATE POLICY "Allow insert tags" ON public.marche_tags
  FOR INSERT WITH CHECK (true);

-- Permettre l'insertion d'études de marches
CREATE POLICY "Allow insert etudes" ON public.marche_etudes
  FOR INSERT WITH CHECK (true);

-- Permettre l'insertion de documents de marches
CREATE POLICY "Allow insert documents" ON public.marche_documents
  FOR INSERT WITH CHECK (true);
