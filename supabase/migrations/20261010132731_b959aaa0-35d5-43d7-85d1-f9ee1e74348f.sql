ALTER TABLE public.propriete_objet_photos ALTER COLUMN objet_id DROP NOT NULL;
ALTER TABLE public.propriete_objet_photos ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.propriete_zones(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_objet_photos_zone ON public.propriete_objet_photos(zone_id);
CREATE OR REPLACE FUNCTION public.validate_objet_photo_target()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.objet_id IS NULL) = (NEW.zone_id IS NULL) THEN
    RAISE EXCEPTION 'Un média doit être rattaché à un ouvrage ou à un emplacement (un seul)';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_objet_photo_target ON public.propriete_objet_photos;
CREATE TRIGGER trg_validate_objet_photo_target BEFORE INSERT OR UPDATE ON public.propriete_objet_photos
FOR EACH ROW EXECUTE FUNCTION public.validate_objet_photo_target();