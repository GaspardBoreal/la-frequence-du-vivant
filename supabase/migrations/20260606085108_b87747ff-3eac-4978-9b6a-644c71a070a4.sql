
-- Extend get_activity_timeline with period + event_id filters
CREATE OR REPLACE FUNCTION public.get_activity_timeline(
  p_limit integer DEFAULT 50,
  p_user_filter uuid DEFAULT NULL,
  p_period text DEFAULT 'all',
  p_event_id uuid DEFAULT NULL
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
  v_end TIMESTAMPTZ := NULL;
  v_local_today TIMESTAMP;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

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

-- Extend chart with event + user filters
CREATE OR REPLACE FUNCTION public.get_activity_connections_chart(
  p_period text DEFAULT '7d',
  p_event_id uuid DEFAULT NULL,
  p_user_filter uuid DEFAULT NULL
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
BEGIN
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

-- New: list of events that actually have activity logs (for the combobox)
CREATE OR REPLACE FUNCTION public.get_activity_events_for_filter()
RETURNS TABLE(id uuid, title text, date_marche date, lieu text, activity_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.title, e.date_marche, e.lieu, COUNT(a.id) AS activity_count
  FROM marche_events e
  JOIN marcheur_activity_logs a ON a.marche_event_id = e.id
  WHERE public.check_is_admin_user(auth.uid())
  GROUP BY e.id, e.title, e.date_marche, e.lieu
  ORDER BY e.date_marche DESC NULLS LAST
  LIMIT 200;
$$;
