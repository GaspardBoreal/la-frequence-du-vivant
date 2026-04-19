
-- RPC: dashboard stats (filtered)
CREATE OR REPLACE FUNCTION public.get_marche_events_dashboard_stats(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _events_count int := 0;
  _marches_count int := 0;
  _participants_count int := 0;
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
  )
  SELECT
    (SELECT COUNT(*) FROM filtered),
    (SELECT COUNT(DISTINCT em.marche_id)
       FROM exploration_marches em
       WHERE em.exploration_id IN (SELECT exploration_id FROM filtered WHERE exploration_id IS NOT NULL)),
    (SELECT COUNT(*) FROM marche_participations mp WHERE mp.marche_event_id IN (SELECT id FROM filtered))
  INTO _events_count, _marches_count, _participants_count;

  RETURN jsonb_build_object(
    'events_count', COALESCE(_events_count, 0),
    'marches_count', COALESCE(_marches_count, 0),
    'total_km', NULL,
    'participants_count', COALESCE(_participants_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marche_events_dashboard_stats(text, text, text) TO anon, authenticated;

-- RPC: paginated events list (filtered + sorted)
CREATE OR REPLACE FUNCTION public.get_marche_events_paginated(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _sort text DEFAULT 'date_desc',
  _limit int DEFAULT 20,
  _offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.get_marche_events_paginated(text, text, text, text, int, int) TO anon, authenticated;

-- RPC: lightweight events list for Map / Analytics tabs (no pagination, capped)
CREATE OR REPLACE FUNCTION public.get_marche_events_filtered_all(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _max int DEFAULT 2000
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _rows jsonb;
BEGIN
  WITH filtered AS (
    SELECT e.id, e.title, e.date_marche, e.event_type, e.lieu,
           e.latitude, e.longitude, e.exploration_id,
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
    LIMIT GREATEST(_max, 1)
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(filtered.*)), '[]'::jsonb)
  INTO _rows FROM filtered;
  RETURN _rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marche_events_filtered_all(text, text, text, int) TO anon, authenticated;
