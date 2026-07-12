
-- 1) Add category column with default 'autre' + CHECK
ALTER TABLE public.marche_events
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'autre';

ALTER TABLE public.marche_events
  DROP CONSTRAINT IF EXISTS marche_events_category_check;

ALTER TABLE public.marche_events
  ADD CONSTRAINT marche_events_category_check
  CHECK (category IN ('arboriculture','grande_culture','elevage','maraichage','vignoble','jardin','exploration','autre'));

CREATE INDEX IF NOT EXISTS idx_marche_events_category ON public.marche_events(category);

-- 2) Recreate dashboard stats RPC with _category param
CREATE OR REPLACE FUNCTION public.get_marche_events_dashboard_stats(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _share text DEFAULT NULL,
  _category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _now timestamptz := now();
  _events_count int := 0;
  _marches_count int := 0;
  _participants_count int := 0;
  _total_km numeric := 0;
BEGIN
  WITH filtered AS (
    SELECT e.id, e.exploration_id
    FROM marche_events e
    LEFT JOIN explorations x ON x.id = e.exploration_id
    WHERE
      (_search IS NULL OR _search = '' OR
        e.title ILIKE '%'||_search||'%' OR
        COALESCE(e.description,'') ILIKE '%'||_search||'%' OR
        COALESCE(e.lieu,'') ILIKE '%'||_search||'%' OR
        COALESCE(e.qr_code,'') ILIKE '%'||_search||'%' OR
        COALESCE(x.name,'') ILIKE '%'||_search||'%'
      )
      AND (
        _type IS NULL OR _type = 'all'
        OR (_type = 'none' AND (e.event_type IS NULL OR e.event_type = ''))
        OR (e.event_type = _type)
      )
      AND (
        _status IS NULL OR _status = 'all'
        OR (_status = 'upcoming' AND e.date_marche >= _now)
        OR (_status = 'past' AND e.date_marche < _now)
      )
      AND (
        _share IS NULL OR _share = 'all'
        OR (_share = 'yes' AND e.share_with_new_signups = true)
        OR (_share = 'no'  AND e.share_with_new_signups = false)
      )
      AND (
        _category IS NULL OR _category = 'all' OR e.category = _category
      )
  ),
  expl_ids AS (
    SELECT DISTINCT exploration_id FROM filtered WHERE exploration_id IS NOT NULL
  ),
  ordered_marches AS (
    SELECT
      em.exploration_id, em.ordre, m.id AS marche_id,
      m.latitude, m.longitude, m.distance_km AS manual_km,
      LAG(m.latitude)  OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS prev_lat,
      LAG(m.longitude) OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS prev_lng,
      ROW_NUMBER() OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS rn
    FROM exploration_marches em
    JOIN marches m ON m.id = em.marche_id
    WHERE em.exploration_id IN (SELECT exploration_id FROM expl_ids)
  ),
  segments AS (
    SELECT COALESCE(manual_km, public.haversine_km(prev_lat, prev_lng, latitude, longitude)) AS segment_km
    FROM ordered_marches WHERE rn > 1
  )
  SELECT
    (SELECT COUNT(*) FROM filtered),
    (SELECT COUNT(DISTINCT em.marche_id) FROM exploration_marches em
       WHERE em.exploration_id IN (SELECT exploration_id FROM expl_ids)),
    (SELECT COUNT(*) FROM marche_participations mp WHERE mp.marche_event_id IN (SELECT id FROM filtered)),
    (SELECT COALESCE(SUM(segment_km), 0) FROM segments)
  INTO _events_count, _marches_count, _participants_count, _total_km;

  RETURN jsonb_build_object(
    'events_count', COALESCE(_events_count,0),
    'marches_count', COALESCE(_marches_count,0),
    'total_km', _total_km,
    'participants_count', COALESCE(_participants_count,0)
  );
END;
$function$;

-- 3) Recreate filtered_all with _category + return category
CREATE OR REPLACE FUNCTION public.get_marche_events_filtered_all(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _max integer DEFAULT 2000,
  _share text DEFAULT NULL,
  _category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _now timestamptz := now();
  _rows jsonb;
BEGIN
  WITH filtered AS (
    SELECT e.id, e.title, e.date_marche, e.event_type, e.category, e.lieu,
           e.latitude, e.longitude, e.exploration_id,
           e.share_with_new_signups,
           x.name AS exploration_name
    FROM marche_events e
    LEFT JOIN explorations x ON x.id = e.exploration_id
    WHERE
      (_search IS NULL OR _search = '' OR
        e.title ILIKE '%'||_search||'%' OR
        COALESCE(e.description,'') ILIKE '%'||_search||'%' OR
        COALESCE(e.lieu,'') ILIKE '%'||_search||'%' OR
        COALESCE(e.qr_code,'') ILIKE '%'||_search||'%' OR
        COALESCE(x.name,'') ILIKE '%'||_search||'%'
      )
      AND (
        _type IS NULL OR _type = 'all'
        OR (_type = 'none' AND (e.event_type IS NULL OR e.event_type = ''))
        OR (e.event_type = _type)
      )
      AND (
        _status IS NULL OR _status = 'all'
        OR (_status = 'upcoming' AND e.date_marche >= _now)
        OR (_status = 'past' AND e.date_marche < _now)
      )
      AND (
        _share IS NULL OR _share = 'all'
        OR (_share = 'yes' AND e.share_with_new_signups = true)
        OR (_share = 'no'  AND e.share_with_new_signups = false)
      )
      AND (
        _category IS NULL OR _category = 'all' OR e.category = _category
      )
    LIMIT GREATEST(_max, 1)
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(filtered.*)), '[]'::jsonb)
  INTO _rows FROM filtered;
  RETURN _rows;
END;
$function$;

-- 4) Recreate paginated with _category (returns full row, already includes category)
CREATE OR REPLACE FUNCTION public.get_marche_events_paginated(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _sort text DEFAULT 'date_desc',
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _share text DEFAULT NULL,
  _category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _now timestamptz := now();
  _total int := 0;
  _rows jsonb;
BEGIN
  WITH filtered AS (
    SELECT e.*, x.name AS exploration_name
    FROM marche_events e
    LEFT JOIN explorations x ON x.id = e.exploration_id
    WHERE
      (_search IS NULL OR _search = '' OR
        e.title ILIKE '%'||_search||'%' OR
        COALESCE(e.description,'') ILIKE '%'||_search||'%' OR
        COALESCE(e.lieu,'') ILIKE '%'||_search||'%' OR
        COALESCE(e.qr_code,'') ILIKE '%'||_search||'%' OR
        COALESCE(x.name,'') ILIKE '%'||_search||'%'
      )
      AND (
        _type IS NULL OR _type = 'all'
        OR (_type = 'none' AND (e.event_type IS NULL OR e.event_type = ''))
        OR (e.event_type = _type)
      )
      AND (
        _status IS NULL OR _status = 'all'
        OR (_status = 'upcoming' AND e.date_marche >= _now)
        OR (_status = 'past' AND e.date_marche < _now)
      )
      AND (
        _share IS NULL OR _share = 'all'
        OR (_share = 'yes' AND e.share_with_new_signups = true)
        OR (_share = 'no'  AND e.share_with_new_signups = false)
      )
      AND (
        _category IS NULL OR _category = 'all' OR e.category = _category
      )
  ),
  counted AS (SELECT COUNT(*)::int AS c FROM filtered),
  sorted AS (
    SELECT * FROM filtered
    ORDER BY
      CASE WHEN _sort = 'date_asc'  THEN date_marche END ASC NULLS LAST,
      CASE WHEN _sort = 'title_asc'  THEN title END ASC NULLS LAST,
      CASE WHEN _sort = 'title_desc' THEN title END DESC NULLS LAST,
      CASE WHEN _sort NOT IN ('date_asc','title_asc','title_desc') THEN date_marche END DESC NULLS LAST
    LIMIT GREATEST(_limit, 1) OFFSET GREATEST(_offset, 0)
  )
  SELECT (SELECT c FROM counted),
         COALESCE(jsonb_agg(to_jsonb(sorted.*)), '[]'::jsonb)
  INTO _total, _rows
  FROM sorted;

  RETURN jsonb_build_object('total', _total, 'rows', _rows);
END;
$function$;

-- 5) Recreate map RPC to expose category (DROP+CREATE because return type changes)
DROP FUNCTION IF EXISTS public.get_marches_map_events();
CREATE FUNCTION public.get_marches_map_events()
RETURNS TABLE(
  id uuid, title text, description text, date_marche timestamp with time zone,
  event_type text, category text, lieu text, latitude numeric, longitude numeric,
  cover_image_url text, max_participants integer, is_public boolean, public_slug text,
  exploration_id uuid, exploration_name text, participants_count integer,
  species_count integer, has_audio boolean, has_marcheur_photos boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH expl AS (
    SELECT DISTINCT exploration_id
    FROM public.marche_events
    WHERE exploration_id IS NOT NULL
  ),
  expl_counts AS (
    SELECT
      exploration_id,
      COALESCE((public.get_exploration_species_count(exploration_id) ->> 'total')::int, 0) AS species_count
    FROM expl
  )
  SELECT
    me.id, me.title, me.description, me.date_marche, me.event_type, me.category, me.lieu,
    me.latitude, me.longitude, me.cover_image_url, me.max_participants,
    me.is_public, me.public_slug, me.exploration_id,
    e.name AS exploration_name,
    COALESCE((SELECT COUNT(*)::int FROM public.marche_participations mp WHERE mp.marche_event_id = me.id), 0),
    COALESCE(ec.species_count, 0),
    EXISTS (
      SELECT 1
      FROM public.exploration_marches em
      JOIN public.marche_audio ma ON ma.marche_id = em.marche_id
      WHERE em.exploration_id = me.exploration_id LIMIT 1
    ),
    EXISTS (
      SELECT 1
      FROM public.exploration_marches em
      JOIN public.marcheur_medias mm ON mm.marche_id = em.marche_id
      WHERE em.exploration_id = me.exploration_id LIMIT 1
    )
  FROM public.marche_events me
  LEFT JOIN public.explorations e ON e.id = me.exploration_id
  LEFT JOIN expl_counts ec ON ec.exploration_id = me.exploration_id;
$function$;

GRANT EXECUTE ON FUNCTION public.get_marches_map_events() TO anon, authenticated;
