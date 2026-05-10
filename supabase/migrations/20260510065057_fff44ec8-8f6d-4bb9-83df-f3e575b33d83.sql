CREATE INDEX IF NOT EXISTS idx_marche_photos_metadata_gps
  ON public.marche_photos USING gin ((metadata -> 'gps'));

CREATE INDEX IF NOT EXISTS idx_marcheur_medias_metadata_gps
  ON public.marcheur_medias USING gin ((metadata -> 'gps'));