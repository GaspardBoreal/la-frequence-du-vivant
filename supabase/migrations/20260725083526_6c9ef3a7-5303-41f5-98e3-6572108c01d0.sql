
-- ============================================================
-- Table : propriete_parcelles
-- Parcelles cadastrales rattachées à une propriété
-- ============================================================
CREATE TABLE IF NOT EXISTS public.propriete_parcelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  parcel_id TEXT NOT NULL,
  commune_code TEXT,
  commune_nom TEXT,
  section TEXT,
  numero TEXT,
  prefix TEXT,
  contenance_m2 INTEGER,
  geometry JSONB,
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (propriete_id, parcel_id)
);

CREATE INDEX IF NOT EXISTS idx_propriete_parcelles_prop
  ON public.propriete_parcelles(propriete_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_parcelles TO authenticated;
GRANT ALL ON public.propriete_parcelles TO service_role;

ALTER TABLE public.propriete_parcelles ENABLE ROW LEVEL SECURITY;

-- Lecture : toute personne rattachée à la propriété peut voir
DROP POLICY IF EXISTS "parcelles_select_linked" ON public.propriete_parcelles;
CREATE POLICY "parcelles_select_linked"
  ON public.propriete_parcelles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = propriete_parcelles.propriete_id
        AND cp.user_id = auth.uid()
    )
    OR public.check_is_admin_user(auth.uid())
  );

-- Écriture : réservée aux services SECURITY DEFINER (RPCs ci-dessous) ; admin peut écrire directement.
DROP POLICY IF EXISTS "parcelles_write_admin_only" ON public.propriete_parcelles;
CREATE POLICY "parcelles_write_admin_only"
  ON public.propriete_parcelles FOR ALL
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- Trigger updated_at (fonction générique déjà présente)
DROP TRIGGER IF EXISTS trg_propriete_parcelles_updated ON public.propriete_parcelles;
CREATE TRIGGER trg_propriete_parcelles_updated
  BEFORE UPDATE ON public.propriete_parcelles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPC : can_curate_propriete_parcelles
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_curate_propriete_parcelles(_propriete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.check_is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = _propriete_id
        AND cp.user_id = auth.uid()
        AND pm.role IN ('proprietaire'::public.role_propriete, 'prestataire'::public.role_propriete)
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_curate_propriete_parcelles(uuid) TO authenticated, service_role;

-- ============================================================
-- RPC : list_propriete_parcelles
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_propriete_parcelles(_propriete_id uuid)
RETURNS TABLE(
  id uuid,
  parcel_id text,
  commune_code text,
  commune_nom text,
  section text,
  numero text,
  prefix text,
  contenance_m2 integer,
  geometry jsonb,
  centroid_lat double precision,
  centroid_lng double precision,
  note text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, parcel_id, commune_code, commune_nom, section, numero, prefix,
         contenance_m2, geometry, centroid_lat, centroid_lng, note, created_at
  FROM public.propriete_parcelles
  WHERE propriete_id = _propriete_id
  ORDER BY commune_nom NULLS LAST, section NULLS LAST, numero NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.list_propriete_parcelles(uuid) TO authenticated, service_role;

-- ============================================================
-- RPC : upsert_propriete_parcelle
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_propriete_parcelle(
  _propriete_id uuid,
  _parcel_id text,
  _commune_code text,
  _commune_nom text,
  _section text,
  _numero text,
  _prefix text,
  _contenance_m2 integer,
  _geometry jsonb,
  _centroid_lat double precision,
  _centroid_lng double precision,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can boolean;
  v_id uuid;
BEGIN
  SELECT public.can_curate_propriete_parcelles(_propriete_id) INTO v_can;
  IF NOT COALESCE(v_can, false) THEN
    RAISE EXCEPTION 'not_authorized_to_curate_parcelles';
  END IF;

  INSERT INTO public.propriete_parcelles (
    propriete_id, parcel_id, commune_code, commune_nom, section, numero, prefix,
    contenance_m2, geometry, centroid_lat, centroid_lng, note, created_by
  ) VALUES (
    _propriete_id, _parcel_id, _commune_code, _commune_nom, _section, _numero, _prefix,
    _contenance_m2, _geometry, _centroid_lat, _centroid_lng, _note, auth.uid()
  )
  ON CONFLICT (propriete_id, parcel_id) DO UPDATE
    SET commune_code = EXCLUDED.commune_code,
        commune_nom = EXCLUDED.commune_nom,
        section = EXCLUDED.section,
        numero = EXCLUDED.numero,
        prefix = EXCLUDED.prefix,
        contenance_m2 = EXCLUDED.contenance_m2,
        geometry = EXCLUDED.geometry,
        centroid_lat = EXCLUDED.centroid_lat,
        centroid_lng = EXCLUDED.centroid_lng,
        note = COALESCE(EXCLUDED.note, public.propriete_parcelles.note),
        updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_propriete_parcelle(uuid, text, text, text, text, text, text, integer, jsonb, double precision, double precision, text) TO authenticated, service_role;

-- ============================================================
-- RPC : delete_propriete_parcelle
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_propriete_parcelle(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop uuid;
  v_can boolean;
BEGIN
  SELECT propriete_id INTO v_prop FROM public.propriete_parcelles WHERE id = _id;
  IF v_prop IS NULL THEN RETURN; END IF;
  SELECT public.can_curate_propriete_parcelles(v_prop) INTO v_can;
  IF NOT COALESCE(v_can, false) THEN
    RAISE EXCEPTION 'not_authorized_to_curate_parcelles';
  END IF;
  DELETE FROM public.propriete_parcelles WHERE id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_propriete_parcelle(uuid) TO authenticated, service_role;

-- ============================================================
-- RPC : update_propriete_parcelle_note
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_propriete_parcelle_note(_id uuid, _note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop uuid;
  v_can boolean;
BEGIN
  SELECT propriete_id INTO v_prop FROM public.propriete_parcelles WHERE id = _id;
  IF v_prop IS NULL THEN RETURN; END IF;
  SELECT public.can_curate_propriete_parcelles(v_prop) INTO v_can;
  IF NOT COALESCE(v_can, false) THEN
    RAISE EXCEPTION 'not_authorized_to_curate_parcelles';
  END IF;
  UPDATE public.propriete_parcelles SET note = _note, updated_at = now() WHERE id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_propriete_parcelle_note(uuid, text) TO authenticated, service_role;
