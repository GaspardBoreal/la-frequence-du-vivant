CREATE OR REPLACE FUNCTION public.get_public_event(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'description', e.description,
    'date_marche', e.date_marche,
    'lieu', e.lieu,
    'latitude', public.round_coord(e.latitude),
    'longitude', public.round_coord(e.longitude),
    'event_type', e.event_type,
    'cover_image_url', e.cover_image_url,
    'public_slug', e.public_slug,
    'published_at', e.published_at,
    'exploration_id', e.exploration_id,
    'organisateur', NULL::jsonb
  ) INTO _result
  FROM public.marche_events e
  WHERE e.public_slug = _slug AND e.is_public = true;
  RETURN _result;
END;
$$;