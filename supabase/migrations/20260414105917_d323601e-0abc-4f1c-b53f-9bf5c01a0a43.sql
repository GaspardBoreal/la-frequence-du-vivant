
CREATE OR REPLACE FUNCTION public.get_activity_connections_chart(p_period text DEFAULT '7d'::text)
RETURNS TABLE(period_label text, connection_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tz TEXT := 'Europe/Paris';
  v_trunc TEXT;
  v_fmt TEXT;
  v_interval INTERVAL;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_local_start TIMESTAMP;
  v_local_end TIMESTAMP;
BEGIN
  CASE p_period
    WHEN 'today' THEN
      v_local_start := date_trunc('day', now() AT TIME ZONE v_tz);
      v_local_end   := v_local_start + interval '23 hours';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_start + interval '1 day') AT TIME ZONE v_tz;
      v_interval := interval '1 hour';
      v_trunc := 'hour';
      v_fmt := 'HH24:00';
    WHEN 'yesterday' THEN
      v_local_start := date_trunc('day', now() AT TIME ZONE v_tz) - interval '1 day';
      v_local_end   := v_local_start + interval '23 hours';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_start + interval '1 day') AT TIME ZONE v_tz;
      v_interval := interval '1 hour';
      v_trunc := 'hour';
      v_fmt := 'HH24:00';
    WHEN '7d' THEN
      v_local_end   := date_trunc('day', now() AT TIME ZONE v_tz);
      v_local_start := v_local_end - interval '6 days';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_end + interval '1 day') AT TIME ZONE v_tz;
      v_interval := interval '1 day';
      v_trunc := 'day';
      v_fmt := 'DD/MM';
    WHEN 'month' THEN
      v_local_end   := date_trunc('day', now() AT TIME ZONE v_tz);
      v_local_start := v_local_end - interval '29 days';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_end + interval '1 day') AT TIME ZONE v_tz;
      v_interval := interval '1 day';
      v_trunc := 'day';
      v_fmt := 'DD/MM';
    WHEN 'quarter' THEN
      v_local_end   := date_trunc('week', now() AT TIME ZONE v_tz);
      v_local_start := v_local_end - interval '3 months';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_end + interval '1 week') AT TIME ZONE v_tz;
      v_interval := interval '1 week';
      v_trunc := 'week';
      v_fmt := 'DD/MM';
    WHEN 'semester' THEN
      v_local_end   := date_trunc('week', now() AT TIME ZONE v_tz);
      v_local_start := v_local_end - interval '6 months';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_end + interval '1 week') AT TIME ZONE v_tz;
      v_interval := interval '1 week';
      v_trunc := 'week';
      v_fmt := 'DD/MM';
    WHEN 'year' THEN
      v_local_end   := date_trunc('month', now() AT TIME ZONE v_tz);
      v_local_start := v_local_end - interval '11 months';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_end + interval '1 month') AT TIME ZONE v_tz;
      v_interval := interval '1 month';
      v_trunc := 'month';
      v_fmt := 'MM/YYYY';
    ELSE
      v_local_end   := date_trunc('day', now() AT TIME ZONE v_tz);
      v_local_start := v_local_end - interval '6 days';
      v_start := v_local_start AT TIME ZONE v_tz;
      v_end   := (v_local_end + interval '1 day') AT TIME ZONE v_tz;
      v_interval := interval '1 day';
      v_trunc := 'day';
      v_fmt := 'DD/MM';
  END CASE;

  RETURN QUERY
  WITH local_series AS (
    SELECT generate_series(v_local_start, v_local_end, v_interval) AS bucket
  ),
  counts AS (
    SELECT
      date_trunc(v_trunc, created_at AT TIME ZONE v_tz) AS bucket,
      count(*) AS cnt
    FROM marcheur_activity_logs
    WHERE event_type = 'session_start'
      AND created_at >= v_start
      AND created_at < v_end
    GROUP BY 1
  )
  SELECT
    to_char(ls.bucket, v_fmt) AS period_label,
    COALESCE(c.cnt, 0::bigint) AS connection_count
  FROM local_series ls
  LEFT JOIN counts c ON c.bucket = ls.bucket
  ORDER BY ls.bucket;
END;
$function$;
