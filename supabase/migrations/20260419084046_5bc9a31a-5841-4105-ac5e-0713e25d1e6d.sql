-- Add manual override column for marche distance
ALTER TABLE public.marches ADD COLUMN IF NOT EXISTS distance_km numeric;

-- Haversine helper (km)
CREATE OR REPLACE FUNCTION public.haversine_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN 0
    ELSE 2 * 6371 * asin(sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians((lng2 - lng1) / 2)), 2)
    ))
  END;
$$;

-- Recreate dashboard stats with real total_km (manual override + haversine fallback)
CREATE OR REPLACE FUNCTION public.get_marche_events_dashboard_stats(_search text DEFAULT NULL::text, _type text DEFAULT NULL::text, _status text DEFAULT NULL::text)
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
  ),
  expl_ids AS (
    SELECT DISTINCT exploration_id FROM filtered WHERE exploration_id IS NOT NULL
  ),
  ordered_marches AS (
    SELECT
      em.exploration_id,
      em.ordre,
      m.id AS marche_id,
      m.latitude,
      m.longitude,
      m.distance_km AS manual_km,
      LAG(m.latitude)  OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS prev_lat,
      LAG(m.longitude) OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS prev_lng,
      ROW_NUMBER() OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS rn
    FROM exploration_marches em
    JOIN marches m ON m.id = em.marche_id
    WHERE em.exploration_id IN (SELECT exploration_id FROM expl_ids)
  ),
  segments AS (
    SELECT
      COALESCE(
        manual_km,
        public.haversine_km(prev_lat, prev_lng, latitude, longitude)
      ) AS segment_km
    FROM ordered_marches
    WHERE rn > 1
  )
  SELECT
    (SELECT COUNT(*) FROM filtered),
    (SELECT COUNT(DISTINCT em.marche_id)
       FROM exploration_marches em
       WHERE em.exploration_id IN (SELECT exploration_id FROM expl_ids)),
    (SELECT COUNT(*) FROM marche_participations mp WHERE mp.marche_event_id IN (SELECT id FROM filtered)),
    (SELECT COALESCE(SUM(segment_km), 0) FROM segments)
  INTO _events_count, _marches_count, _participants_count, _total_km;

  RETURN jsonb_build_object(
    'events_count', COALESCE(_events_count, 0),
    'marches_count', COALESCE(_marches_count, 0),
    'total_km', _total_km,
    'participants_count', COALESCE(_participants_count, 0)
  );
END;
$function$;