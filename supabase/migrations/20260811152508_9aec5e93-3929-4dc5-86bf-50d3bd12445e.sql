CREATE TABLE public.iot_capteur_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capteur_id uuid NOT NULL REFERENCES public.iot_capteurs(id) ON DELETE CASCADE,
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime text,
  size_bytes bigint,
  width integer,
  height integer,
  caption text,
  taken_at timestamptz,
  lat double precision,
  lng double precision,
  order_index integer NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_iot_capteur_photos_capteur ON public.iot_capteur_photos(capteur_id, order_index, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iot_capteur_photos TO authenticated;
GRANT ALL ON public.iot_capteur_photos TO service_role;

ALTER TABLE public.iot_capteur_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriete members can read capteur photos"
  ON public.iot_capteur_photos FOR SELECT TO authenticated
  USING (public.can_access_propriete(propriete_id));

CREATE POLICY "Propriete members can add capteur photos"
  ON public.iot_capteur_photos FOR INSERT TO authenticated
  WITH CHECK (public.can_access_propriete(propriete_id) AND uploaded_by = auth.uid());

CREATE POLICY "Author or curator can update capteur photos"
  ON public.iot_capteur_photos FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_curate_propriete_gallery(propriete_id))
  WITH CHECK (uploaded_by = auth.uid() OR public.can_curate_propriete_gallery(propriete_id));

CREATE POLICY "Author or curator can delete capteur photos"
  ON public.iot_capteur_photos FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_curate_propriete_gallery(propriete_id));

CREATE TRIGGER update_iot_capteur_photos_updated_at
  BEFORE UPDATE ON public.iot_capteur_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.reorder_iot_capteur_photos(_capteur_id uuid, _ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _propriete_id uuid;
BEGIN
  SELECT propriete_id INTO _propriete_id FROM public.iot_capteurs WHERE id = _capteur_id;
  IF _propriete_id IS NULL THEN
    RAISE EXCEPTION 'Capteur introuvable';
  END IF;
  IF NOT public.can_curate_propriete_gallery(_propriete_id) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE public.iot_capteur_photos p
     SET order_index = x.idx
    FROM (SELECT unnest(_ids) AS id, generate_subscripts(_ids, 1) AS idx) x
   WHERE p.id = x.id
     AND p.capteur_id = _capteur_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_iot_capteur_photos(uuid, uuid[]) TO authenticated, service_role;