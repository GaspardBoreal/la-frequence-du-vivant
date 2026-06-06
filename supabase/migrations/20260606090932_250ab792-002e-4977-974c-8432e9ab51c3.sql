
-- Extend timeline RPC with p_start/p_end overrides
CREATE OR REPLACE FUNCTION public.get_activity_timeline(
  p_limit integer DEFAULT 50,
  p_user_filter uuid DEFAULT NULL,
  p_period text DEFAULT 'all',
  p_event_id uuid DEFAULT NULL,
  p_start timestamptz DEFAULT NULL,
  p_end   timestamptz DEFAULT NULL
)
RETURNS TABLE(
  id uuid, user_id uuid, prenom text, nom text,
  event_type text, event_target text, exploration_id uuid,
  marche_event_id uuid, metadata jsonb, created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz TEXT := 'Europe/Paris';
  v_start TIMESTAMPTZ := NULL;
  v_end   TIMESTAMPTZ := NULL;
  v_local_today TIMESTAMP;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_start IS NOT NULL OR p_end IS NOT NULL THEN
    v_start := p_start;
    v_end   := p_end;
  ELSE
    v_local_today := date_trunc('day', now() AT TIME ZONE v_tz);
    CASE p_period
      WHEN 'today'     THEN v_start := v_local_today AT TIME ZONE v_tz;
      WHEN 'yesterday' THEN
        v_start := (v_local_today - interval '1 day') AT TIME ZONE v_tz;
        v_end   := v_local_today AT TIME ZONE v_tz;
      WHEN '7d'   THEN v_start := (v_local_today - interval '6 days')  AT TIME ZONE v_tz;
      WHEN 'month','30d' THEN v_start := (v_local_today - interval '29 days') AT TIME ZONE v_tz;
      WHEN 'year','12m'  THEN v_start := (v_local_today - interval '11 months') AT TIME ZONE v_tz;
      ELSE NULL;
    END CASE;
  END IF;

  RETURN QUERY
  SELECT
    a.id, a.user_id, cp.prenom, cp.nom,
    a.event_type, a.event_target, a.exploration_id,
    a.marche_event_id, a.metadata, a.created_at
  FROM marcheur_activity_logs a
  LEFT JOIN community_profiles cp ON cp.user_id = a.user_id
  WHERE (p_user_filter IS NULL OR a.user_id = p_user_filter)
    AND (p_event_id    IS NULL OR a.marche_event_id = p_event_id)
    AND (v_start       IS NULL OR a.created_at >= v_start)
    AND (v_end         IS NULL OR a.created_at <  v_end)
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Extend chart RPC with p_start/p_end + custom bucket inference
CREATE OR REPLACE FUNCTION public.get_activity_connections_chart(
  p_period text DEFAULT '7d',
  p_event_id uuid DEFAULT NULL,
  p_user_filter uuid DEFAULT NULL,
  p_start timestamptz DEFAULT NULL,
  p_end   timestamptz DEFAULT NULL
)
RETURNS TABLE(period_label text, connection_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz TEXT := 'Europe/Paris';
  v_trunc TEXT; v_fmt TEXT; v_interval INTERVAL;
  v_start TIMESTAMPTZ; v_end TIMESTAMPTZ;
  v_local_start TIMESTAMP; v_local_end TIMESTAMP;
  v_today TIMESTAMP := date_trunc('day', now() AT TIME ZONE v_tz);
  v_span_days NUMERIC;
BEGIN
  IF p_start IS NOT NULL AND p_end IS NOT NULL THEN
    v_local_start := date_trunc('day', p_start AT TIME ZONE v_tz);
    v_local_end   := date_trunc('day', p_end   AT TIME ZONE v_tz);
    v_span_days   := GREATEST(1, EXTRACT(EPOCH FROM (v_local_end - v_local_start)) / 86400.0);
    IF v_span_days <= 2 THEN
      v_interval := interval '1 hour'; v_trunc := 'hour'; v_fmt := 'DD/MM HH24:00';
      v_local_end := v_local_end + interval '23 hours';
    ELSIF v_span_days <= 60 THEN
      v_interval := interval '1 day'; v_trunc := 'day'; v_fmt := 'DD/MM';
    ELSIF v_span_days <= 730 THEN
      v_interval := interval '1 week'; v_trunc := 'week'; v_fmt := 'DD/MM';
      v_local_start := date_trunc('week', v_local_start);
      v_local_end   := date_trunc('week', v_local_end);
    ELSE
      v_interval := interval '1 month'; v_trunc := 'month'; v_fmt := 'MM/YYYY';
      v_local_start := date_trunc('month', v_local_start);
      v_local_end   := date_trunc('month', v_local_end);
    END IF;
    v_start := v_local_start AT TIME ZONE v_tz;
    v_end   := (date_trunc('day', p_end AT TIME ZONE v_tz) + interval '1 day') AT TIME ZONE v_tz;
  ELSE
    CASE p_period
      WHEN 'today' THEN
        v_local_start := v_today;
        v_local_end   := v_today + interval '23 hours';
        v_end := (v_today + interval '1 day') AT TIME ZONE v_tz;
        v_interval := interval '1 hour'; v_trunc := 'hour'; v_fmt := 'HH24:00';
      WHEN 'yesterday' THEN
        v_local_start := v_today - interval '1 day';
        v_local_end   := v_local_start + interval '23 hours';
        v_end := v_today AT TIME ZONE v_tz;
        v_interval := interval '1 hour'; v_trunc := 'hour'; v_fmt := 'HH24:00';
      WHEN '7d' THEN
        v_local_end := v_today; v_local_start := v_today - interval '6 days';
        v_end := (v_today + interval '1 day') AT TIME ZONE v_tz;
        v_interval := interval '1 day'; v_trunc := 'day'; v_fmt := 'DD/MM';
      WHEN 'month','30d' THEN
        v_local_end := v_today; v_local_start := v_today - interval '29 days';
        v_end := (v_today + interval '1 day') AT TIME ZONE v_tz;
        v_interval := interval '1 day'; v_trunc := 'day'; v_fmt := 'DD/MM';
      WHEN 'quarter' THEN
        v_local_end := date_trunc('week', now() AT TIME ZONE v_tz);
        v_local_start := v_local_end - interval '3 months';
        v_end := (v_local_end + interval '1 week') AT TIME ZONE v_tz;
        v_interval := interval '1 week'; v_trunc := 'week'; v_fmt := 'DD/MM';
      WHEN 'semester' THEN
        v_local_end := date_trunc('week', now() AT TIME ZONE v_tz);
        v_local_start := v_local_end - interval '6 months';
        v_end := (v_local_end + interval '1 week') AT TIME ZONE v_tz;
        v_interval := interval '1 week'; v_trunc := 'week'; v_fmt := 'DD/MM';
      WHEN 'year','12m' THEN
        v_local_end := date_trunc('month', now() AT TIME ZONE v_tz);
        v_local_start := v_local_end - interval '11 months';
        v_end := (v_local_end + interval '1 month') AT TIME ZONE v_tz;
        v_interval := interval '1 month'; v_trunc := 'month'; v_fmt := 'MM/YYYY';
      WHEN 'all' THEN
        v_local_end := date_trunc('month', now() AT TIME ZONE v_tz);
        SELECT COALESCE(date_trunc('month', MIN(created_at) AT TIME ZONE v_tz), v_local_end)
          INTO v_local_start FROM marcheur_activity_logs;
        v_end := (v_local_end + interval '1 month') AT TIME ZONE v_tz;
        v_interval := interval '1 month'; v_trunc := 'month'; v_fmt := 'MM/YYYY';
      ELSE
        v_local_end := v_today; v_local_start := v_today - interval '6 days';
        v_end := (v_today + interval '1 day') AT TIME ZONE v_tz;
        v_interval := interval '1 day'; v_trunc := 'day'; v_fmt := 'DD/MM';
    END CASE;
    v_start := v_local_start AT TIME ZONE v_tz;
  END IF;

  RETURN QUERY
  WITH local_series AS (
    SELECT generate_series(v_local_start, v_local_end, v_interval) AS bucket
  ),
  counts AS (
    SELECT date_trunc(v_trunc, created_at AT TIME ZONE v_tz) AS bucket, count(*) AS cnt
    FROM marcheur_activity_logs
    WHERE event_type = 'session_start'
      AND created_at >= v_start
      AND created_at <  v_end
      AND (p_event_id    IS NULL OR marche_event_id = p_event_id)
      AND (p_user_filter IS NULL OR user_id         = p_user_filter)
    GROUP BY 1
  )
  SELECT to_char(ls.bucket, v_fmt), COALESCE(c.cnt, 0::bigint)
  FROM local_series ls
  LEFT JOIN counts c ON c.bucket = ls.bucket
  ORDER BY ls.bucket;
END;
$$;

-- Replace dashboard RPC to accept filters (backward-compatible defaults = 7 days)
DROP FUNCTION IF EXISTS public.get_marcheur_activity_dashboard();
CREATE OR REPLACE FUNCTION public.get_marcheur_activity_dashboard(
  p_period text DEFAULT '7d',
  p_event_id uuid DEFAULT NULL,
  p_user_filter uuid DEFAULT NULL,
  p_start timestamptz DEFAULT NULL,
  p_end   timestamptz DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid, prenom text, nom text, role text,
  last_seen timestamp with time zone,
  sessions_count bigint,
  favorite_tabs text[],
  photos_count bigint, sounds_count bigint, texts_count bigint,
  explorations_viewed bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz TEXT := 'Europe/Paris';
  v_start TIMESTAMPTZ := NULL;
  v_end   TIMESTAMPTZ := NULL;
  v_local_today TIMESTAMP;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_start IS NOT NULL OR p_end IS NOT NULL THEN
    v_start := p_start;
    v_end   := p_end;
  ELSE
    v_local_today := date_trunc('day', now() AT TIME ZONE v_tz);
    CASE p_period
      WHEN 'today'     THEN v_start := v_local_today AT TIME ZONE v_tz;
      WHEN 'yesterday' THEN
        v_start := (v_local_today - interval '1 day') AT TIME ZONE v_tz;
        v_end   := v_local_today AT TIME ZONE v_tz;
      WHEN '7d'   THEN v_start := (v_local_today - interval '6 days')  AT TIME ZONE v_tz;
      WHEN 'month','30d' THEN v_start := (v_local_today - interval '29 days') AT TIME ZONE v_tz;
      WHEN 'year','12m'  THEN v_start := (v_local_today - interval '11 months') AT TIME ZONE v_tz;
      ELSE NULL;
    END CASE;
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT a.*
    FROM marcheur_activity_logs a
    WHERE (v_start       IS NULL OR a.created_at >= v_start)
      AND (v_end         IS NULL OR a.created_at <  v_end)
      AND (p_event_id    IS NULL OR a.marche_event_id = p_event_id)
      AND (p_user_filter IS NULL OR a.user_id         = p_user_filter)
  ),
  user_activity AS (
    SELECT
      f.user_id,
      MAX(f.created_at) AS last_seen,
      COUNT(DISTINCT DATE(f.created_at AT TIME ZONE v_tz)) AS sessions_count,
      (SELECT array_agg(tab ORDER BY cnt DESC)
       FROM (
         SELECT event_target AS tab, COUNT(*) AS cnt
         FROM filtered sub
         WHERE sub.user_id = f.user_id
           AND sub.event_type = 'tab_switch'
         GROUP BY event_target
         ORDER BY cnt DESC
         LIMIT 3
       ) t
      ) AS favorite_tabs,
      COUNT(*) FILTER (WHERE f.event_type = 'media_upload' AND f.event_target = 'photo') AS photos_count,
      COUNT(*) FILTER (WHERE f.event_type = 'media_upload' AND f.event_target = 'audio') AS sounds_count,
      COUNT(*) FILTER (WHERE f.event_type = 'media_upload' AND f.event_target = 'text') AS texts_count,
      COUNT(DISTINCT f.exploration_id) FILTER (WHERE f.event_type = 'page_view' AND f.exploration_id IS NOT NULL) AS explorations_viewed
    FROM filtered f
    GROUP BY f.user_id
  )
  SELECT
    ua.user_id,
    cp.prenom,
    cp.nom,
    cp.role::text,
    ua.last_seen,
    ua.sessions_count,
    COALESCE(ua.favorite_tabs, ARRAY[]::text[]),
    ua.photos_count,
    ua.sounds_count,
    ua.texts_count,
    ua.explorations_viewed
  FROM user_activity ua
  LEFT JOIN community_profiles cp ON cp.user_id = ua.user_id
  ORDER BY ua.last_seen DESC;
END;
$$;
