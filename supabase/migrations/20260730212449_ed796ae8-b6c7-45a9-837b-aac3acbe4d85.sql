CREATE TABLE IF NOT EXISTS public.propriete_objet_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  objet_id UUID NOT NULL REFERENCES public.propriete_objets(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  caption TEXT,
  order_index INT NOT NULL DEFAULT 0,
  taken_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_objet_photos_objet_order
  ON public.propriete_objet_photos(objet_id, order_index);
CREATE INDEX IF NOT EXISTS idx_objet_photos_prop
  ON public.propriete_objet_photos(propriete_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_objet_photos TO authenticated;
GRANT ALL ON public.propriete_objet_photos TO service_role;

ALTER TABLE public.propriete_objet_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "objet_photos_select" ON public.propriete_objet_photos;
CREATE POLICY "objet_photos_select"
  ON public.propriete_objet_photos FOR SELECT
  TO authenticated
  USING (public.can_access_propriete(propriete_id));

DROP POLICY IF EXISTS "objet_photos_insert" ON public.propriete_objet_photos;
CREATE POLICY "objet_photos_insert"
  ON public.propriete_objet_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_curate_propriete_parcelles(propriete_id)
    AND uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS "objet_photos_update" ON public.propriete_objet_photos;
CREATE POLICY "objet_photos_update"
  ON public.propriete_objet_photos FOR UPDATE
  TO authenticated
  USING (public.can_curate_propriete_parcelles(propriete_id))
  WITH CHECK (public.can_curate_propriete_parcelles(propriete_id));

DROP POLICY IF EXISTS "objet_photos_delete" ON public.propriete_objet_photos;
CREATE POLICY "objet_photos_delete"
  ON public.propriete_objet_photos FOR DELETE
  TO authenticated
  USING (public.can_curate_propriete_parcelles(propriete_id));

CREATE OR REPLACE FUNCTION public.propriete_objet_photos_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_objet_photos_touch ON public.propriete_objet_photos;
CREATE TRIGGER trg_objet_photos_touch
  BEFORE UPDATE ON public.propriete_objet_photos
  FOR EACH ROW EXECUTE FUNCTION public.propriete_objet_photos_touch();

-- Réordonnancement atomique
CREATE OR REPLACE FUNCTION public.reorder_propriete_objet_photos(_objet_id uuid, _ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prop uuid;
BEGIN
  SELECT propriete_id INTO _prop FROM public.propriete_objets WHERE id = _objet_id;
  IF _prop IS NULL THEN
    RAISE EXCEPTION 'Ouvrage introuvable';
  END IF;
  IF NOT public.can_curate_propriete_parcelles(_prop) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE public.propriete_objet_photos p
     SET order_index = x.idx
    FROM (SELECT unnest(_ids) AS id, generate_subscripts(_ids, 1) AS idx) x
   WHERE p.id = x.id AND p.objet_id = _objet_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_propriete_objet_photos(uuid, uuid[]) TO authenticated, service_role;

-- Politiques Storage pour le bucket privé propriete-ouvrages
DROP POLICY IF EXISTS "ouvrages_read" ON storage.objects;
CREATE POLICY "ouvrages_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'propriete-ouvrages');

DROP POLICY IF EXISTS "ouvrages_write" ON storage.objects;
CREATE POLICY "ouvrages_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'propriete-ouvrages' AND owner = auth.uid());

DROP POLICY IF EXISTS "ouvrages_delete" ON storage.objects;
CREATE POLICY "ouvrages_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'propriete-ouvrages' AND owner = auth.uid());