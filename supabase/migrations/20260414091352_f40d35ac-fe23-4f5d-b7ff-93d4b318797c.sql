CREATE OR REPLACE FUNCTION public.get_activity_connections_chart(p_period text DEFAULT '7d'::text)
 RETURNS TABLE(period_label text, connection_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start timestamptz;
  v_end   timestamptz;
  v_interval interval;
  v_fmt text;
  v_trunc text;
  v_tz text := 'Europe/Paris';
BEGIN
  v_end := now();

  CASE p_period
    WHEN 'today' THEN
      v_start := date_trunc('day', now() AT TIME ZONE v_tz) AT TIME ZONE v_tz;
      v_interval := interval '1 hour';
      v_trunc := 'hour';
      v_fmt := 'HH24:00';
    WHEN 'yesterday' THEN
      v_start := (date_trunc('day', now() AT TIME ZONE v_tz) - interval '1 day') AT TIME ZONE v_tz;
      v_end   := date_trunc('day', now() AT TIME ZONE v_tz) AT TIME ZONE v_tz;
      v_interval := interval '1 hour';
      v_trunc := 'hour';
      v_fmt := 'HH24:00';
    WHEN '7d' THEN
      v_start := date_trunc('day', (now() AT TIME ZONE v_tz) - interval '6 days') AT TIME ZONE v_tz;
      v_interval := interval '1 day';
      v_trunc := 'day';
      v_fmt := 'DD/MM';
    WHEN 'month' THEN
      v_start := date_trunc('day', (now() AT TIME ZONE v_tz) - interval '29 days') AT TIME ZONE v_tz;
      v_interval := interval '1 day';
      v_trunc := 'day';
      v_fmt := 'DD/MM';
    WHEN 'quarter' THEN
      v_start := date_trunc('week', (now() AT TIME ZONE v_tz) - interval '3 months') AT TIME ZONE v_tz;
      v_interval := interval '1 week';
      v_trunc := 'week';
      v_fmt := 'DD/MM';
    WHEN 'semester' THEN
      v_start := date_trunc('week', (now() AT TIME ZONE v_tz) - interval '6 months') AT TIME ZONE v_tz;
      v_interval := interval '1 week';
      v_trunc := 'week';
      v_fmt := 'DD/MM';
    WHEN 'year' THEN
      v_start := date_trunc('month', (now() AT TIME ZONE v_tz) - interval '11 months') AT TIME ZONE v_tz;
      v_interval := interval '1 month';
      v_trunc := 'month';
      v_fmt := 'MM/YYYY';
    ELSE
      v_start := date_trunc('day', (now() AT TIME ZONE v_tz) - interval '6 days') AT TIME ZONE v_tz;
      v_interval := interval '1 day';
      v_trunc := 'day';
      v_fmt := 'DD/MM';
  END CASE;

  RETURN QUERY
  SELECT
    to_char(gs AT TIME ZONE v_tz, v_fmt) AS period_label,
    COALESCE(c.cnt, 0::bigint) AS connection_count
  FROM generate_series(v_start, v_end, v_interval) AS gs
  LEFT JOIN (
    SELECT
      date_trunc(v_trunc, created_at AT TIME ZONE v_tz) AS bucket,
      count(*) AS cnt
    FROM marcheur_activity_logs
    WHERE event_type = 'session_start'
      AND created_at >= v_start
      AND created_at <= v_end
    GROUP BY bucket
  ) c ON c.bucket = (gs AT TIME ZONE v_tz)
  ORDER BY gs;
END;
$function$;