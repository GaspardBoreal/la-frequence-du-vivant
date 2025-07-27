
-- Ajouter les politiques DELETE manquantes pour toutes les tables

-- Table marches : Permettre la suppression
CREATE POLICY "Allow delete marches" 
ON public.marches 
FOR DELETE 
USING (true);

-- Table marche_photos : Permettre la suppression et mise à jour
CREATE POLICY "Allow delete photos" 
ON public.marche_photos 
FOR DELETE 
USING (true);

CREATE POLICY "Allow update photos" 
ON public.marche_photos 
FOR UPDATE 
USING (true);

-- Table marche_audio : Permettre la suppression et mise à jour
CREATE POLICY "Allow delete audio" 
ON public.marche_audio 
FOR DELETE 
USING (true);

CREATE POLICY "Allow update audio" 
ON public.marche_audio 
FOR UPDATE 
USING (true);

-- Table marche_videos : Permettre la suppression et mise à jour
CREATE POLICY "Allow delete videos" 
ON public.marche_videos 
FOR DELETE 
USING (true);

CREATE POLICY "Allow update videos" 
ON public.marche_videos 
FOR UPDATE 
USING (true);

-- Table marche_documents : Permettre la suppression et mise à jour
CREATE POLICY "Allow delete documents" 
ON public.marche_documents 
FOR DELETE 
USING (true);

CREATE POLICY "Allow update documents" 
ON public.marche_documents 
FOR UPDATE 
USING (true);

-- Table marche_etudes : Permettre la suppression et mise à jour
CREATE POLICY "Allow delete etudes" 
ON public.marche_etudes 
FOR DELETE 
USING (true);

CREATE POLICY "Allow update etudes" 
ON public.marche_etudes 
FOR UPDATE 
USING (true);

-- Table marche_tags : Permettre la suppression et mise à jour
CREATE POLICY "Allow delete tags" 
ON public.marche_tags 
FOR DELETE 
USING (true);

CREATE POLICY "Allow update tags" 
ON public.marche_tags 
FOR UPDATE 
USING (true);
