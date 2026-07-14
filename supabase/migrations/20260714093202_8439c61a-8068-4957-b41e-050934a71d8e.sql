CREATE OR REPLACE FUNCTION public.get_garden_hero_photos(_event_id uuid)
RETURNS TABLE(id text, url text, source text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH event_row AS (
    SELECT id, exploration_id, cover_image_url
    FROM public.marche_events
    WHERE id = _event_id
      AND category = 'jardin'
    LIMIT 1
  ), photos AS (
    SELECT
      ('cover-' || e.id::text) AS id,
      e.cover_image_url AS url,
      'cover'::text AS source,
      0 AS sort_order
    FROM event_row e
    WHERE e.cover_image_url IS NOT NULL

    UNION ALL

    SELECT
      ('mp-' || mp.id::text) AS id,
      mp.url_supabase AS url,
      'official'::text AS source,
      COALESCE(mp.ordre, 9999) + 100 AS sort_order
    FROM event_row e
    JOIN public.marche_photos mp ON mp.marche_id = e.id
    WHERE mp.url_supabase IS NOT NULL

    UNION ALL

    SELECT
      ('conv-' || cp.id::text) AS id,
      cp.url AS url,
      'convivialite'::text AS source,
      COALESCE(cp.position, 9999) + 200 AS sort_order
    FROM event_row e
    JOIN public.exploration_convivialite_photos cp ON cp.exploration_id = e.exploration_id
    WHERE e.exploration_id IS NOT NULL
      AND cp.url IS NOT NULL
      AND COALESCE(cp.is_hidden, false) = false

    UNION ALL

    SELECT
      ('mm-' || mm.id::text) AS id,
      COALESCE(mm.url_fichier, mm.external_url) AS url,
      'marcheur'::text AS source,
      300 + ROW_NUMBER() OVER (ORDER BY mm.created_at DESC)::int AS sort_order
    FROM event_row e
    JOIN public.marcheur_medias mm ON mm.marche_event_id = e.id
    WHERE mm.type_media = 'photo'
      AND COALESCE(mm.is_public, false) = true
      AND COALESCE(mm.url_fichier, mm.external_url) IS NOT NULL
  ), deduped AS (
    SELECT DISTINCT ON (url)
      id,
      url,
      source,
      sort_order
    FROM photos
    WHERE url IS NOT NULL AND length(trim(url)) > 0
    ORDER BY url, sort_order
  )
  SELECT id, url, source
  FROM deduped
  ORDER BY sort_order
  LIMIT 80;
$$;

REVOKE ALL ON FUNCTION public.get_garden_hero_photos(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_garden_hero_photos(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_garden_hero_photos(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_garden_hero_photos(uuid) TO service_role;