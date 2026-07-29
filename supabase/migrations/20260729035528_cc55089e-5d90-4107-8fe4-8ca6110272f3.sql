-- 1. Enrichissement des emplacements
ALTER TABLE public.propriete_zones
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS verrouille boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opacite numeric NOT NULL DEFAULT 0.18,
  ADD COLUMN IF NOT EXISTS surface_m2 numeric;

-- 2. Calques
CREATE TABLE IF NOT EXISTS public.propriete_calques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  nom text NOT NULL,
  ordre integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  verrouille boolean NOT NULL DEFAULT false,
  opacite numeric NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_calques TO authenticated;
GRANT ALL ON public.propriete_calques TO service_role;

ALTER TABLE public.propriete_calques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calques_select" ON public.propriete_calques
  FOR SELECT TO authenticated USING (public.can_access_propriete(propriete_id));
CREATE POLICY "calques_write" ON public.propriete_calques
  FOR ALL TO authenticated
  USING (public.can_curate_propriete_parcelles(propriete_id))
  WITH CHECK (public.can_curate_propriete_parcelles(propriete_id));

-- 3. Objets d'aménagement
CREATE TABLE IF NOT EXISTS public.propriete_objets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  calque_id uuid REFERENCES public.propriete_calques(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.propriete_zones(id) ON DELETE SET NULL,
  outil_key text NOT NULL,
  nom text,
  geometry jsonb NOT NULL,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  ordre integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_propriete_objets_prop ON public.propriete_objets(propriete_id);
CREATE INDEX IF NOT EXISTS idx_propriete_calques_prop ON public.propriete_calques(propriete_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_objets TO authenticated;
GRANT ALL ON public.propriete_objets TO service_role;

ALTER TABLE public.propriete_objets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "objets_select" ON public.propriete_objets
  FOR SELECT TO authenticated USING (public.can_access_propriete(propriete_id));
CREATE POLICY "objets_write" ON public.propriete_objets
  FOR ALL TO authenticated
  USING (public.can_curate_propriete_parcelles(propriete_id))
  WITH CHECK (public.can_curate_propriete_parcelles(propriete_id));

-- 4. Triggers updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at_generic()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_calques_touch ON public.propriete_calques;
CREATE TRIGGER trg_calques_touch BEFORE UPDATE ON public.propriete_calques
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at_generic();

DROP TRIGGER IF EXISTS trg_objets_touch ON public.propriete_objets;
CREATE TRIGGER trg_objets_touch BEFORE UPDATE ON public.propriete_objets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at_generic();

-- 5. RPC calques
CREATE OR REPLACE FUNCTION public.list_propriete_calques(_propriete_id uuid)
RETURNS SETOF public.propriete_calques
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.* FROM public.propriete_calques c
  WHERE c.propriete_id = _propriete_id
    AND public.can_access_propriete(_propriete_id)
  ORDER BY c.ordre, c.created_at;
$$;

CREATE OR REPLACE FUNCTION public.upsert_propriete_calque(
  _propriete_id uuid,
  _nom text,
  _ordre integer DEFAULT 0,
  _visible boolean DEFAULT true,
  _verrouille boolean DEFAULT false,
  _opacite numeric DEFAULT 1,
  _calque_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_curate_propriete_parcelles(_propriete_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  IF _calque_id IS NOT NULL THEN
    UPDATE public.propriete_calques
       SET nom = _nom, ordre = COALESCE(_ordre, ordre), visible = COALESCE(_visible, visible),
           verrouille = COALESCE(_verrouille, verrouille), opacite = COALESCE(_opacite, opacite)
     WHERE id = _calque_id AND propriete_id = _propriete_id
     RETURNING id INTO v_id;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  INSERT INTO public.propriete_calques (propriete_id, nom, ordre, visible, verrouille, opacite, created_by)
  VALUES (_propriete_id, _nom, COALESCE(_ordre,0), COALESCE(_visible,true), COALESCE(_verrouille,false), COALESCE(_opacite,1), auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_propriete_calque(_calque_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prop uuid;
BEGIN
  SELECT propriete_id INTO v_prop FROM public.propriete_calques WHERE id = _calque_id;
  IF v_prop IS NULL THEN RETURN false; END IF;
  IF NOT public.can_curate_propriete_parcelles(v_prop) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  DELETE FROM public.propriete_objets WHERE calque_id = _calque_id;
  DELETE FROM public.propriete_calques WHERE id = _calque_id;
  RETURN true;
END; $$;

-- 6. RPC objets
CREATE OR REPLACE FUNCTION public.list_propriete_objets(_propriete_id uuid)
RETURNS SETOF public.propriete_objets
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.* FROM public.propriete_objets o
  WHERE o.propriete_id = _propriete_id
    AND public.can_access_propriete(_propriete_id)
  ORDER BY o.ordre, o.created_at;
$$;

CREATE OR REPLACE FUNCTION public.upsert_propriete_objet(
  _propriete_id uuid,
  _outil_key text,
  _geometry jsonb,
  _calque_id uuid DEFAULT NULL,
  _zone_id uuid DEFAULT NULL,
  _nom text DEFAULT NULL,
  _style jsonb DEFAULT '{}'::jsonb,
  _meta jsonb DEFAULT '{}'::jsonb,
  _ordre integer DEFAULT 0,
  _objet_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_curate_propriete_parcelles(_propriete_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  IF _objet_id IS NOT NULL THEN
    UPDATE public.propriete_objets
       SET outil_key = _outil_key, geometry = _geometry, calque_id = _calque_id,
           zone_id = _zone_id, nom = _nom,
           style = COALESCE(_style, style), meta = COALESCE(_meta, meta),
           ordre = COALESCE(_ordre, ordre)
     WHERE id = _objet_id AND propriete_id = _propriete_id
     RETURNING id INTO v_id;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  INSERT INTO public.propriete_objets (propriete_id, outil_key, geometry, calque_id, zone_id, nom, style, meta, ordre, created_by)
  VALUES (_propriete_id, _outil_key, _geometry, _calque_id, _zone_id, _nom,
          COALESCE(_style,'{}'::jsonb), COALESCE(_meta,'{}'::jsonb), COALESCE(_ordre,0), auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_propriete_objet(_objet_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prop uuid;
BEGIN
  SELECT propriete_id INTO v_prop FROM public.propriete_objets WHERE id = _objet_id;
  IF v_prop IS NULL THEN RETURN false; END IF;
  IF NOT public.can_curate_propriete_parcelles(v_prop) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  DELETE FROM public.propriete_objets WHERE id = _objet_id;
  RETURN true;
END; $$;

-- 7. Upsert zone étendu (visibilité, verrou, opacité, surface)
CREATE OR REPLACE FUNCTION public.upsert_propriete_zone(
  _propriete_id uuid,
  _nom text,
  _geometry jsonb,
  _couleur text DEFAULT '#2f5d3a'::text,
  _note text DEFAULT NULL::text,
  _ordre integer DEFAULT 0,
  _zone_id uuid DEFAULT NULL::uuid,
  _visible boolean DEFAULT NULL,
  _verrouille boolean DEFAULT NULL,
  _opacite numeric DEFAULT NULL,
  _surface_m2 numeric DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_curate_propriete_parcelles(_propriete_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF _zone_id IS NOT NULL THEN
    UPDATE public.propriete_zones
       SET nom = _nom,
           geometry = _geometry,
           couleur = COALESCE(_couleur, couleur),
           note = _note,
           ordre = COALESCE(_ordre, ordre),
           visible = COALESCE(_visible, visible),
           verrouille = COALESCE(_verrouille, verrouille),
           opacite = COALESCE(_opacite, opacite),
           surface_m2 = COALESCE(_surface_m2, surface_m2)
     WHERE id = _zone_id AND propriete_id = _propriete_id
     RETURNING id INTO v_id;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  INSERT INTO public.propriete_zones (propriete_id, nom, geometry, couleur, note, ordre, created_by, visible, verrouille, opacite, surface_m2)
  VALUES (_propriete_id, _nom, _geometry, COALESCE(_couleur, '#2f5d3a'), _note, COALESCE(_ordre, 0), auth.uid(),
          COALESCE(_visible, true), COALESCE(_verrouille, false), COALESCE(_opacite, 0.18), _surface_m2)
  RETURNING id INTO v_id;

  RETURN v_id;
END; $$;