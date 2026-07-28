-- 1. Zones (emplacements dessinés)
CREATE TABLE public.propriete_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  nom text NOT NULL,
  couleur text NOT NULL DEFAULT '#2f5d3a',
  note text,
  geometry jsonb NOT NULL,
  ordre integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_zones TO authenticated;
GRANT ALL ON public.propriete_zones TO service_role;

ALTER TABLE public.propriete_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zones lisibles par les accédants à la propriété"
ON public.propriete_zones FOR SELECT TO authenticated
USING (public.can_access_propriete(propriete_id));

CREATE POLICY "Zones gérées par les curateurs de la propriété"
ON public.propriete_zones FOR ALL TO authenticated
USING (public.can_curate_propriete_parcelles(propriete_id))
WITH CHECK (public.can_curate_propriete_parcelles(propriete_id));

CREATE INDEX idx_propriete_zones_propriete ON public.propriete_zones(propriete_id, ordre);

-- 2. Palette végétale (une ligne par propriété)
CREATE TABLE public.propriete_palette (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL UNIQUE REFERENCES public.proprietes(id) ON DELETE CASCADE,
  site_rule text,
  zones jsonb NOT NULL DEFAULT '{}'::jsonb,
  excluded jsonb NOT NULL DEFAULT '[]'::jsonb,
  implementation jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_palette TO authenticated;
GRANT ALL ON public.propriete_palette TO service_role;

ALTER TABLE public.propriete_palette ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Palette lisible par les accédants à la propriété"
ON public.propriete_palette FOR SELECT TO authenticated
USING (public.can_access_propriete(propriete_id));

CREATE POLICY "Palette gérée par les curateurs de la propriété"
ON public.propriete_palette FOR ALL TO authenticated
USING (public.can_curate_propriete_parcelles(propriete_id))
WITH CHECK (public.can_curate_propriete_parcelles(propriete_id));

-- 3. updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_propriete_palette_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_propriete_zones_updated_at
BEFORE UPDATE ON public.propriete_zones
FOR EACH ROW EXECUTE FUNCTION public.touch_propriete_palette_updated_at();

CREATE TRIGGER trg_propriete_palette_updated_at
BEFORE UPDATE ON public.propriete_palette
FOR EACH ROW EXECUTE FUNCTION public.touch_propriete_palette_updated_at();

-- 4. RPC : liste des zones
CREATE OR REPLACE FUNCTION public.list_propriete_zones(_propriete_id uuid)
RETURNS SETOF public.propriete_zones
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT z.*
  FROM public.propriete_zones z
  WHERE z.propriete_id = _propriete_id
    AND public.can_access_propriete(_propriete_id)
  ORDER BY z.ordre, z.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.list_propriete_zones(uuid) TO authenticated;

-- 5. RPC : upsert d'une zone
CREATE OR REPLACE FUNCTION public.upsert_propriete_zone(
  _propriete_id uuid,
  _nom text,
  _geometry jsonb,
  _couleur text DEFAULT '#2f5d3a',
  _note text DEFAULT NULL,
  _ordre integer DEFAULT 0,
  _zone_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
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
           ordre = COALESCE(_ordre, ordre)
     WHERE id = _zone_id AND propriete_id = _propriete_id
     RETURNING id INTO v_id;
    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  INSERT INTO public.propriete_zones (propriete_id, nom, geometry, couleur, note, ordre, created_by)
  VALUES (_propriete_id, _nom, _geometry, COALESCE(_couleur, '#2f5d3a'), _note, COALESCE(_ordre, 0), auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_propriete_zone(uuid, text, jsonb, text, text, integer, uuid) TO authenticated;

-- 6. RPC : suppression d'une zone
CREATE OR REPLACE FUNCTION public.delete_propriete_zone(_zone_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop uuid;
BEGIN
  SELECT propriete_id INTO v_prop FROM public.propriete_zones WHERE id = _zone_id;
  IF v_prop IS NULL THEN
    RETURN false;
  END IF;
  IF NOT public.can_curate_propriete_parcelles(v_prop) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  DELETE FROM public.propriete_zones WHERE id = _zone_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_propriete_zone(uuid) TO authenticated;

-- 7. RPC : upsert de la palette
CREATE OR REPLACE FUNCTION public.upsert_propriete_palette(
  p_propriete_id uuid,
  p_site_rule text DEFAULT NULL,
  p_zones jsonb DEFAULT '{}'::jsonb,
  p_excluded jsonb DEFAULT '[]'::jsonb,
  p_implementation jsonb DEFAULT '{}'::jsonb,
  p_notes text DEFAULT NULL,
  p_completed_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.can_curate_propriete_parcelles(p_propriete_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  INSERT INTO public.propriete_palette AS pp
    (propriete_id, site_rule, zones, excluded, implementation, notes, completed_at)
  VALUES
    (p_propriete_id, p_site_rule, COALESCE(p_zones, '{}'::jsonb), COALESCE(p_excluded, '[]'::jsonb),
     COALESCE(p_implementation, '{}'::jsonb), p_notes, p_completed_at)
  ON CONFLICT (propriete_id) DO UPDATE
    SET site_rule = EXCLUDED.site_rule,
        zones = EXCLUDED.zones,
        excluded = EXCLUDED.excluded,
        implementation = EXCLUDED.implementation,
        notes = EXCLUDED.notes,
        completed_at = EXCLUDED.completed_at
  RETURNING pp.id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_propriete_palette(uuid, text, jsonb, jsonb, jsonb, text, timestamptz) TO authenticated;