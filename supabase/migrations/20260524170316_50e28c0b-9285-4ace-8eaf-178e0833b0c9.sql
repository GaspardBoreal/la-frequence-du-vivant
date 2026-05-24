
ALTER TABLE public.marche_events
  ADD COLUMN IF NOT EXISTS scenography_code text,
  ADD COLUMN IF NOT EXISTS scenography_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scenography_title text,
  ADD COLUMN IF NOT EXISTS scenography_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS scenography_updated_by uuid;

CREATE TABLE IF NOT EXISTS public.marche_event_scenography_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  code text NOT NULL,
  author uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenography_versions_event ON public.marche_event_scenography_versions(event_id, created_at DESC);

ALTER TABLE public.marche_event_scenography_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read scenography versions" ON public.marche_event_scenography_versions;
CREATE POLICY "Admins can read scenography versions"
ON public.marche_event_scenography_versions
FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can insert scenography versions" ON public.marche_event_scenography_versions;
CREATE POLICY "Admins can insert scenography versions"
ON public.marche_event_scenography_versions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

CREATE OR REPLACE FUNCTION public.snapshot_scenography_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.scenography_code IS DISTINCT FROM OLD.scenography_code
     AND NEW.scenography_code IS NOT NULL
     AND length(NEW.scenography_code) > 0 THEN
    INSERT INTO public.marche_event_scenography_versions (event_id, code, author)
    VALUES (NEW.id, NEW.scenography_code, NEW.scenography_updated_by);

    DELETE FROM public.marche_event_scenography_versions
    WHERE event_id = NEW.id
      AND id NOT IN (
        SELECT id FROM public.marche_event_scenography_versions
        WHERE event_id = NEW.id
        ORDER BY created_at DESC
        LIMIT 20
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_scenography_version ON public.marche_events;
CREATE TRIGGER trg_snapshot_scenography_version
AFTER UPDATE OF scenography_code ON public.marche_events
FOR EACH ROW
EXECUTE FUNCTION public.snapshot_scenography_version();

CREATE OR REPLACE FUNCTION public.get_event_scenography(_slug text)
RETURNS TABLE (
  event_id uuid,
  title text,
  scenography_title text,
  scenography_code text,
  cover_image_url text,
  description text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.title, e.scenography_title, e.scenography_code, e.cover_image_url, e.description
  FROM public.marche_events e
  WHERE e.public_slug = _slug
    AND e.is_public = true
    AND e.scenography_enabled = true
    AND e.scenography_code IS NOT NULL
    AND length(e.scenography_code) > 0
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_scenography(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_event_scenography_data(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.marche_events%ROWTYPE;
  v_result jsonb;
  v_is_admin boolean := false;
BEGIN
  BEGIN
    v_is_admin := public.is_admin_user();
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := false;
  END;

  SELECT * INTO v_event
  FROM public.marche_events
  WHERE public_slug = _slug
    AND is_public = true
    AND (scenography_enabled = true OR v_is_admin)
  LIMIT 1;

  IF v_event.id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  WITH
    species_data AS (
      SELECT jsonb_agg(jsonb_build_object(
        'scientific_name', s.scientific_name,
        'common_name', s.common_name,
        'iconic_taxon', s.iconic_taxon,
        'photo_url', s.photo_url,
        'observations_count', s.observations_count
      ) ORDER BY s.observations_count DESC) AS arr
      FROM (
        SELECT
          scientific_name,
          MAX(common_name) AS common_name,
          MAX(iconic_taxon) AS iconic_taxon,
          MAX(photo_url) AS photo_url,
          COUNT(*) AS observations_count
        FROM public.biodiversity_snapshots
        WHERE event_id = v_event.id
          AND scientific_name IS NOT NULL
        GROUP BY scientific_name
      ) s
    ),
    photos_data AS (
      SELECT jsonb_agg(jsonb_build_object(
        'url', m.media_url,
        'thumbnail_url', m.thumbnail_url,
        'caption', m.caption,
        'latitude', m.latitude,
        'longitude', m.longitude,
        'taken_at', m.taken_at,
        'author', COALESCE(p.display_name, 'Marcheur')
      ) ORDER BY m.taken_at) AS arr
      FROM public.marcheur_medias m
      LEFT JOIN public.profiles p ON p.user_id = m.user_id
      WHERE m.event_id = v_event.id
        AND m.media_type = 'photo'
    ),
    waypoints_data AS (
      SELECT jsonb_agg(jsonb_build_object(
        'latitude', w.latitude,
        'longitude', w.longitude,
        'ordre', w.ordre,
        'title', w.title
      ) ORDER BY w.ordre) AS arr
      FROM public.exploration_waypoints w
      WHERE w.exploration_id = v_event.exploration_id
    ),
    testimonies_data AS (
      SELECT jsonb_agg(jsonb_build_object(
        'text', t.content,
        'author', COALESCE(p.display_name, 'Marcheur'),
        'created_at', t.created_at
      ) ORDER BY t.created_at DESC) AS arr
      FROM public.event_testimonies t
      LEFT JOIN public.profiles p ON p.user_id = t.user_id
      WHERE t.event_id = v_event.id
    )
  SELECT jsonb_build_object(
    'event', jsonb_build_object(
      'id', v_event.id,
      'title', v_event.title,
      'slug', v_event.public_slug,
      'date', v_event.date_marche,
      'lieu', v_event.lieu,
      'latitude', v_event.latitude,
      'longitude', v_event.longitude,
      'event_type', v_event.event_type,
      'cover_image_url', v_event.cover_image_url,
      'description', v_event.description,
      'scenography_title', v_event.scenography_title
    ),
    'species', COALESCE((SELECT arr FROM species_data), '[]'::jsonb),
    'photos', COALESCE((SELECT arr FROM photos_data), '[]'::jsonb),
    'waypoints', COALESCE((SELECT arr FROM waypoints_data), '[]'::jsonb),
    'testimonies', COALESCE((SELECT arr FROM testimonies_data), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_scenography_data(text) TO anon, authenticated;
