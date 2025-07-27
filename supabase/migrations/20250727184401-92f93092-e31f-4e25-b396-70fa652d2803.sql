
-- Supprimer les politiques RLS actuelles restrictives
DROP POLICY IF EXISTS "Allow delete audio" ON marche_audio;
DROP POLICY IF EXISTS "Allow insert audio" ON marche_audio;
DROP POLICY IF EXISTS "Allow update audio" ON marche_audio;
DROP POLICY IF EXISTS "Public can view audio" ON marche_audio;

-- Créer de nouvelles politiques RLS plus permissives pour un accès public
CREATE POLICY "Public can view audio" ON marche_audio
  FOR SELECT USING (true);

CREATE POLICY "Public can insert audio" ON marche_audio
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update audio" ON marche_audio
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete audio" ON marche_audio
  FOR DELETE USING (true);

-- Faire la même chose pour les autres tables liées aux médias
DROP POLICY IF EXISTS "Allow delete photos" ON marche_photos;
DROP POLICY IF EXISTS "Allow insert photos" ON marche_photos;
DROP POLICY IF EXISTS "Allow update photos" ON marche_photos;
DROP POLICY IF EXISTS "Public can view photos" ON marche_photos;

CREATE POLICY "Public can view photos" ON marche_photos
  FOR SELECT USING (true);

CREATE POLICY "Public can insert photos" ON marche_photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update photos" ON marche_photos
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete photos" ON marche_photos
  FOR DELETE USING (true);

-- Même chose pour les vidéos
DROP POLICY IF EXISTS "Allow delete videos" ON marche_videos;
DROP POLICY IF EXISTS "Allow insert videos" ON marche_videos;
DROP POLICY IF EXISTS "Allow update videos" ON marche_videos;
DROP POLICY IF EXISTS "Public can view videos" ON marche_videos;

CREATE POLICY "Public can view videos" ON marche_videos
  FOR SELECT USING (true);

CREATE POLICY "Public can insert videos" ON marche_videos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update videos" ON marche_videos
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete videos" ON marche_videos
  FOR DELETE USING (true);
