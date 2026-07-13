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
    'category', e.category,
    'cover_image_url', e.cover_image_url,
    'public_slug', e.public_slug,
    'published_at', e.published_at,
    'exploration_id', e.exploration_id,
    'organisateur', (
      SELECT jsonb_build_object(
        'id', o.id,
        'nom', o.nom,
        'ville', o.ville,
        'pays', o.pays,
        'type_structure', o.type_structure,
        'description', o.description,
        'logo_url', o.logo_url,
        'site_web', o.site_web
      )
      FROM public.marche_event_organisateurs meo
      JOIN public.organisateurs o ON o.id = meo.organisateur_id
      WHERE meo.marche_event_id = e.id
      ORDER BY meo.created_at ASC
      LIMIT 1
    )
  ) INTO _result
  FROM public.marche_events e
  WHERE e.public_slug = _slug AND e.is_public = true;
  RETURN _result;
END;
$$;