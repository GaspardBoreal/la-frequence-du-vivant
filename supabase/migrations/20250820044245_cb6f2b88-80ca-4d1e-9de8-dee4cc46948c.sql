-- Fix critical security issue: Restrict administrative data manipulation to authenticated users only

-- EXPLORATIONS TABLE
DROP POLICY IF EXISTS "Public can insert explorations" ON public.explorations;
DROP POLICY IF EXISTS "Public can update explorations" ON public.explorations;
DROP POLICY IF EXISTS "Public can delete explorations" ON public.explorations;

-- Keep public read access, restrict write operations to authenticated users
CREATE POLICY "Only authenticated users can insert explorations"
ON public.explorations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update explorations"
ON public.explorations
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete explorations"
ON public.explorations
FOR DELETE
TO authenticated
USING (true);

-- MARCHES TABLE
DROP POLICY IF EXISTS "Allow insert marches" ON public.marches;
DROP POLICY IF EXISTS "Allow update marches" ON public.marches;
DROP POLICY IF EXISTS "Allow delete marches" ON public.marches;

CREATE POLICY "Only authenticated users can insert marches"
ON public.marches
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update marches"
ON public.marches
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete marches"
ON public.marches
FOR DELETE
TO authenticated
USING (true);

-- MARCHE_ETUDES TABLE
DROP POLICY IF EXISTS "Allow insert etudes" ON public.marche_etudes;
DROP POLICY IF EXISTS "Allow update etudes" ON public.marche_etudes;
DROP POLICY IF EXISTS "Allow delete etudes" ON public.marche_etudes;

CREATE POLICY "Only authenticated users can insert etudes"
ON public.marche_etudes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update etudes"
ON public.marche_etudes
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete etudes"
ON public.marche_etudes
FOR DELETE
TO authenticated
USING (true);

-- MARCHE_PHOTOS TABLE
DROP POLICY IF EXISTS "Public can insert photos" ON public.marche_photos;
DROP POLICY IF EXISTS "Public can update photos" ON public.marche_photos;
DROP POLICY IF EXISTS "Public can delete photos" ON public.marche_photos;

CREATE POLICY "Only authenticated users can insert photos"
ON public.marche_photos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update photos"
ON public.marche_photos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete photos"
ON public.marche_photos
FOR DELETE
TO authenticated
USING (true);

-- MARCHE_VIDEOS TABLE
DROP POLICY IF EXISTS "Public can insert videos" ON public.marche_videos;
DROP POLICY IF EXISTS "Public can update videos" ON public.marche_videos;
DROP POLICY IF EXISTS "Public can delete videos" ON public.marche_videos;

CREATE POLICY "Only authenticated users can insert videos"
ON public.marche_videos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update videos"
ON public.marche_videos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete videos"
ON public.marche_videos
FOR DELETE
TO authenticated
USING (true);

-- MARCHE_DOCUMENTS TABLE
DROP POLICY IF EXISTS "Allow insert documents" ON public.marche_documents;
DROP POLICY IF EXISTS "Allow update documents" ON public.marche_documents;
DROP POLICY IF EXISTS "Allow delete documents" ON public.marche_documents;

CREATE POLICY "Only authenticated users can insert documents"
ON public.marche_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update documents"
ON public.marche_documents
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete documents"
ON public.marche_documents
FOR DELETE
TO authenticated
USING (true);

-- MARCHE_TAGS TABLE
DROP POLICY IF EXISTS "Allow insert tags" ON public.marche_tags;
DROP POLICY IF EXISTS "Allow update tags" ON public.marche_tags;
DROP POLICY IF EXISTS "Allow delete tags" ON public.marche_tags;

CREATE POLICY "Only authenticated users can insert tags"
ON public.marche_tags
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update tags"
ON public.marche_tags
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete tags"
ON public.marche_tags
FOR DELETE
TO authenticated
USING (true);

-- MARCHE_AUDIO TABLE
DROP POLICY IF EXISTS "Public can insert audio" ON public.marche_audio;
DROP POLICY IF EXISTS "Public can update audio" ON public.marche_audio;
DROP POLICY IF EXISTS "Public can delete audio" ON public.marche_audio;

CREATE POLICY "Only authenticated users can insert audio"
ON public.marche_audio
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update audio"
ON public.marche_audio
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete audio"
ON public.marche_audio
FOR DELETE
TO authenticated
USING (true);

-- EXPLORATION_MARCHES TABLE
DROP POLICY IF EXISTS "Public can insert exploration_marches" ON public.exploration_marches;
DROP POLICY IF EXISTS "Public can update exploration_marches" ON public.exploration_marches;
DROP POLICY IF EXISTS "Public can delete exploration_marches" ON public.exploration_marches;

CREATE POLICY "Only authenticated users can insert exploration_marches"
ON public.exploration_marches
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update exploration_marches"
ON public.exploration_marches
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete exploration_marches"
ON public.exploration_marches
FOR DELETE
TO authenticated
USING (true);

-- NARRATIVE_LANDSCAPES TABLE
DROP POLICY IF EXISTS "Public can insert narrative_landscapes" ON public.narrative_landscapes;
DROP POLICY IF EXISTS "Public can update narrative_landscapes" ON public.narrative_landscapes;
DROP POLICY IF EXISTS "Public can delete narrative_landscapes" ON public.narrative_landscapes;

CREATE POLICY "Only authenticated users can insert narrative_landscapes"
ON public.narrative_landscapes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update narrative_landscapes"
ON public.narrative_landscapes
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete narrative_landscapes"
ON public.narrative_landscapes
FOR DELETE
TO authenticated
USING (true);

-- EXPLORATION_NARRATIVE_SETTINGS TABLE
DROP POLICY IF EXISTS "Public can insert exploration_narrative_settings" ON public.exploration_narrative_settings;
DROP POLICY IF EXISTS "Public can update exploration_narrative_settings" ON public.exploration_narrative_settings;
DROP POLICY IF EXISTS "Public can delete exploration_narrative_settings" ON public.exploration_narrative_settings;

CREATE POLICY "Only authenticated users can insert exploration_narrative_settings"
ON public.exploration_narrative_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update exploration_narrative_settings"
ON public.exploration_narrative_settings
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete exploration_narrative_settings"
ON public.exploration_narrative_settings
FOR DELETE
TO authenticated
USING (true);

-- EXPLORATION_PAGES TABLE
DROP POLICY IF EXISTS "Public can insert exploration_pages" ON public.exploration_pages;
DROP POLICY IF EXISTS "Public can update exploration_pages" ON public.exploration_pages;
DROP POLICY IF EXISTS "Public can delete exploration_pages" ON public.exploration_pages;

CREATE POLICY "Only authenticated users can insert exploration_pages"
ON public.exploration_pages
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update exploration_pages"
ON public.exploration_pages
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete exploration_pages"
ON public.exploration_pages
FOR DELETE
TO authenticated
USING (true);