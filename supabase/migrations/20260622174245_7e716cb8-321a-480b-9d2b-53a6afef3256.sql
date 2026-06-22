
CREATE TABLE IF NOT EXISTS public.species_thumb_cache (
  scientific_name   text PRIMARY KEY,
  photo_url         text,
  photo_attribution text,
  iconic_taxon      text,
  kingdom           text,
  common_name_fr    text,
  common_name_en    text,
  source            text NOT NULL DEFAULT 'none'
                    CHECK (source IN ('inaturalist','gbif','manual','none')),
  miss_count        integer NOT NULL DEFAULT 0,
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.species_thumb_cache TO anon, authenticated;
GRANT ALL    ON public.species_thumb_cache TO service_role;

ALTER TABLE public.species_thumb_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "species_thumb_cache_public_read"
  ON public.species_thumb_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_species_thumb_cache_unresolved
  ON public.species_thumb_cache(source, miss_count, resolved_at)
  WHERE source = 'none';

CREATE INDEX IF NOT EXISTS idx_species_thumb_cache_updated
  ON public.species_thumb_cache(updated_at DESC);

CREATE OR REPLACE FUNCTION public.tg_species_thumb_cache_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS species_thumb_cache_touch ON public.species_thumb_cache;
CREATE TRIGGER species_thumb_cache_touch
  BEFORE UPDATE ON public.species_thumb_cache
  FOR EACH ROW EXECUTE FUNCTION public.tg_species_thumb_cache_touch();

-- Curateur = ambassadeur/sentinelle communautaire OU admin
CREATE OR REPLACE FUNCTION public.is_thumb_curator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_profiles
    WHERE user_id = _user_id
      AND role::text IN ('ambassadeur','sentinelle')
  ) OR public.is_admin_user();
$$;

CREATE OR REPLACE FUNCTION public.upsert_species_thumb_manual(
  _scientific_name   text,
  _photo_url         text,
  _photo_attribution text DEFAULT NULL,
  _common_name_fr    text DEFAULT NULL,
  _iconic_taxon      text DEFAULT NULL,
  _kingdom           text DEFAULT NULL
)
RETURNS public.species_thumb_cache
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _norm text := lower(trim(_scientific_name));
  _row  public.species_thumb_cache;
BEGIN
  IF NOT public.is_thumb_curator(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: curator role required';
  END IF;

  IF _norm IS NULL OR length(_norm) < 2 THEN
    RAISE EXCEPTION 'scientific_name required';
  END IF;

  INSERT INTO public.species_thumb_cache(
    scientific_name, photo_url, photo_attribution,
    common_name_fr, iconic_taxon, kingdom,
    source, miss_count, resolved_at
  )
  VALUES (
    _norm, _photo_url, _photo_attribution,
    _common_name_fr, _iconic_taxon, _kingdom,
    'manual', 0, now()
  )
  ON CONFLICT (scientific_name) DO UPDATE SET
    photo_url         = EXCLUDED.photo_url,
    photo_attribution = COALESCE(EXCLUDED.photo_attribution, species_thumb_cache.photo_attribution),
    common_name_fr    = COALESCE(EXCLUDED.common_name_fr,    species_thumb_cache.common_name_fr),
    iconic_taxon      = COALESCE(EXCLUDED.iconic_taxon,      species_thumb_cache.iconic_taxon),
    kingdom           = COALESCE(EXCLUDED.kingdom,           species_thumb_cache.kingdom),
    source            = 'manual',
    miss_count        = 0,
    resolved_at       = now()
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_species_thumb_manual(text,text,text,text,text,text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_species_thumbs(_names text[])
RETURNS SETOF public.species_thumb_cache
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.species_thumb_cache
  WHERE scientific_name = ANY(
    SELECT lower(trim(n)) FROM unnest(_names) AS n
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_species_thumbs(text[]) TO anon, authenticated;
