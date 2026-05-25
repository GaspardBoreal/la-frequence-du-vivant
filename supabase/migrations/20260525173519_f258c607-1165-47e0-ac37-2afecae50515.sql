
ALTER TABLE public.marche_events
  ADD COLUMN IF NOT EXISTS share_with_new_signups boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_marche_events_share_new_signups
  ON public.marche_events (date_marche)
  WHERE share_with_new_signups = true;

ALTER TABLE public.event_invited_readers
  ADD COLUMN IF NOT EXISTS invite_source text;

UPDATE public.event_invited_readers
SET invite_source = CASE WHEN invitation_id IS NOT NULL THEN 'invitation' ELSE 'manuel' END
WHERE invite_source IS NULL;

CREATE TABLE IF NOT EXISTS public.event_invited_readers_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  source text,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_invited_readers_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_admin_read" ON public.event_invited_readers_audit;
CREATE POLICY "audit_admin_read"
  ON public.event_invited_readers_audit FOR SELECT
  USING (public.check_is_admin_user(auth.uid()));

CREATE OR REPLACE FUNCTION public.auto_invite_new_signup_to_shared_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ev record;
BEGIN
  FOR _ev IN
    SELECT id FROM public.marche_events
    WHERE share_with_new_signups = true
      AND date_marche >= now()
  LOOP
    INSERT INTO public.event_invited_readers
      (event_id, user_id, invitation_id, added_by_user_id, invite_source)
    VALUES
      (_ev.id, NEW.user_id, NULL, NULL, 'auto_new_signup')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.event_invited_readers_audit
      (event_id, user_id, action, source, performed_by)
    VALUES
      (_ev.id, NEW.user_id, 'auto_invite_new_signup', 'auto_new_signup', NULL);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_invite_new_signup ON public.community_profiles;
CREATE TRIGGER trg_auto_invite_new_signup
  AFTER INSERT ON public.community_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_invite_new_signup_to_shared_events();

CREATE OR REPLACE FUNCTION public.get_marche_events_dashboard_stats(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _share text DEFAULT NULL
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

CREATE OR REPLACE FUNCTION public.get_marche_events_filtered_all(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _max integer DEFAULT 2000,
  _share text DEFAULT NULL
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
    SELECT e.id, e.title, e.date_marche, e.event_type, e.lieu,
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
    LIMIT GREATEST(_max, 1)
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(filtered.*)), '[]'::jsonb)
  INTO _rows FROM filtered;
  RETURN _rows;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_marche_events_paginated(
  _search text DEFAULT NULL,
  _type text DEFAULT NULL,
  _status text DEFAULT NULL,
  _sort text DEFAULT 'date_desc',
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _share text DEFAULT NULL
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
