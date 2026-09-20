ALTER TABLE public.propriete_objet_photos
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'photo'
    CHECK (media_type IN ('photo', 'video')),
  ADD COLUMN IF NOT EXISTS duration_s numeric;

UPDATE public.propriete_objet_photos
SET media_type = 'video'
WHERE mime LIKE 'video/%' AND media_type = 'photo';