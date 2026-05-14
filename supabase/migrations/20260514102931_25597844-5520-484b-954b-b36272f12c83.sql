
CREATE TABLE IF NOT EXISTS public.marcheur_species_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scientific_name text NOT NULL CHECK (length(trim(scientific_name)) > 0),
  scientific_name_normalized text NOT NULL DEFAULT '',
  marche_id uuid NULL,
  label text NOT NULL CHECK (length(trim(label)) > 0 AND length(label) <= 40),
  label_normalized text NOT NULL DEFAULT '',
  color_hash smallint NOT NULL DEFAULT 0 CHECK (color_hash BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.marcheur_species_tags_normalize()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, extensions
AS $$
BEGIN
  NEW.scientific_name_normalized := lower(extensions.unaccent(trim(NEW.scientific_name)));
  NEW.label_normalized := lower(extensions.unaccent(trim(NEW.label)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marcheur_species_tags_normalize_trg ON public.marcheur_species_tags;
CREATE TRIGGER marcheur_species_tags_normalize_trg
  BEFORE INSERT OR UPDATE ON public.marcheur_species_tags
  FOR EACH ROW EXECUTE FUNCTION public.marcheur_species_tags_normalize();

CREATE UNIQUE INDEX IF NOT EXISTS marcheur_species_tags_unique_idx
  ON public.marcheur_species_tags (
    user_id, scientific_name_normalized,
    COALESCE(marche_id, '00000000-0000-0000-0000-000000000000'::uuid),
    label_normalized
  );
CREATE INDEX IF NOT EXISTS marcheur_species_tags_user_species_idx
  ON public.marcheur_species_tags (user_id, scientific_name_normalized);
CREATE INDEX IF NOT EXISTS marcheur_species_tags_user_marche_idx
  ON public.marcheur_species_tags (user_id, marche_id);
CREATE INDEX IF NOT EXISTS marcheur_species_tags_user_label_idx
  ON public.marcheur_species_tags (user_id, label_normalized);

ALTER TABLE public.marcheur_species_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can select own tags" ON public.marcheur_species_tags;
CREATE POLICY "Owner can select own tags" ON public.marcheur_species_tags
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can read all tags" ON public.marcheur_species_tags;
CREATE POLICY "Admins can read all tags" ON public.marcheur_species_tags
  FOR SELECT USING (public.is_admin_user());
DROP POLICY IF EXISTS "Owner can insert own tags" ON public.marcheur_species_tags;
CREATE POLICY "Owner can insert own tags" ON public.marcheur_species_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can update own tags" ON public.marcheur_species_tags;
CREATE POLICY "Owner can update own tags" ON public.marcheur_species_tags
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can delete own tags" ON public.marcheur_species_tags;
CREATE POLICY "Owner can delete own tags" ON public.marcheur_species_tags
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS marcheur_species_tags_set_updated_at ON public.marcheur_species_tags;
CREATE TRIGGER marcheur_species_tags_set_updated_at
  BEFORE UPDATE ON public.marcheur_species_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_my_marcheur_tags_for_species(
  _scientific_names text[],
  _marche_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (id uuid, scientific_name text, marche_id uuid, label text, color_hash smallint, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT t.id, t.scientific_name, t.marche_id, t.label, t.color_hash, t.created_at
  FROM public.marcheur_species_tags t
  WHERE t.user_id = auth.uid()
    AND (_scientific_names IS NULL OR t.scientific_name_normalized = ANY (
      SELECT lower(extensions.unaccent(trim(s))) FROM unnest(_scientific_names) s
    ))
    AND (_marche_ids IS NULL OR t.marche_id IS NULL OR t.marche_id = ANY (_marche_ids))
$$;

CREATE OR REPLACE FUNCTION public.upsert_marcheur_species_tag(
  _scientific_name text, _label text,
  _marche_id uuid DEFAULT NULL, _color_hash smallint DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_label text := trim(_label);
  v_sci text := trim(_scientific_name);
  v_color smallint;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(v_label) = 0 OR length(v_label) > 40 THEN RAISE EXCEPTION 'Label must be 1-40 characters'; END IF;
  IF length(v_sci) = 0 THEN RAISE EXCEPTION 'Scientific name required'; END IF;
  v_color := COALESCE(_color_hash, (abs(hashtext(lower(extensions.unaccent(v_label)))) % 6)::smallint);

  INSERT INTO public.marcheur_species_tags (user_id, scientific_name, marche_id, label, color_hash)
  VALUES (v_uid, v_sci, _marche_id, v_label, v_color)
  ON CONFLICT (user_id, scientific_name_normalized, COALESCE(marche_id, '00000000-0000-0000-0000-000000000000'::uuid), label_normalized)
  DO UPDATE SET label = EXCLUDED.label, color_hash = EXCLUDED.color_hash, updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_marcheur_species_tag(_tag_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  DELETE FROM public.marcheur_species_tags WHERE id = _tag_id AND user_id = v_uid;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_marcheur_species_tags(
  _user_id uuid DEFAULT NULL, _label_query text DEFAULT NULL,
  _marche_id uuid DEFAULT NULL, _limit int DEFAULT 500
)
RETURNS TABLE (id uuid, user_id uuid, scientific_name text, marche_id uuid, label text, color_hash smallint, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT t.id, t.user_id, t.scientific_name, t.marche_id, t.label, t.color_hash, t.created_at, t.updated_at
  FROM public.marcheur_species_tags t
  WHERE public.is_admin_user()
    AND (_user_id IS NULL OR t.user_id = _user_id)
    AND (_marche_id IS NULL OR t.marche_id = _marche_id)
    AND (_label_query IS NULL OR t.label_normalized ILIKE '%' || lower(extensions.unaccent(_label_query)) || '%')
  ORDER BY t.created_at DESC
  LIMIT LEAST(COALESCE(_limit, 500), 5000)
$$;
