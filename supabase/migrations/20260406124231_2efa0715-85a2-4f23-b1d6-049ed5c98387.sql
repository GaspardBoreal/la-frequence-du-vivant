
CREATE OR REPLACE FUNCTION public.get_activity_connections_chart(p_period text DEFAULT '7d')
RETURNS TABLE(period_label text, connection_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  v_end := now();

  CASE p_period
    WHEN 'today' THEN v_start := date_trunc('day', now());
    WHEN 'yesterday' THEN
      v_start := date_trunc('day', now() - interval '1 day');
      v_end := date_trunc('day', now());
    WHEN '7d' THEN v_start := now() - interval '7 days';
    WHEN 'month' THEN v_start := now() - interval '1 month';
    WHEN 'quarter' THEN v_start := now() - interval '3 months';
    WHEN 'semester' THEN v_start := now() - interval '6 months';
    WHEN 'year' THEN v_start := now() - interval '1 year';
    ELSE v_start := now() - interval '7 days';
  END CASE;

  IF p_period IN ('today', 'yesterday') THEN
    RETURN QUERY
      SELECT
        to_char(gs, 'HH24:00') AS period_label,
        COALESCE(cnt, 0::bigint) AS connection_count
      FROM generate_series(v_start, v_end - interval '1 hour', interval '1 hour') AS gs
      LEFT JOIN (
        SELECT date_trunc('hour', created_at) AS bucket, count(*)::bigint AS cnt
        FROM marcheur_activity_logs
        WHERE event_type = 'session_start'
          AND created_at >= v_start AND created_at < v_end
        GROUP BY bucket
      ) sub ON sub.bucket = gs
      ORDER BY gs;

  ELSIF p_period IN ('7d', 'month') THEN
    RETURN QUERY
      SELECT
        to_char(gs, 'DD/MM') AS period_label,
        COALESCE(cnt, 0::bigint) AS connection_count
      FROM generate_series(date_trunc('day', v_start), date_trunc('day', v_end), interval '1 day') AS gs
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS bucket, count(*)::bigint AS cnt
        FROM marcheur_activity_logs
        WHERE event_type = 'session_start'
          AND created_at >= v_start AND created_at < v_end
        GROUP BY bucket
      ) sub ON sub.bucket = gs
      ORDER BY gs;

  ELSE
    RETURN QUERY
      SELECT
        'Sem. ' || to_char(gs, 'IW') AS period_label,
        COALESCE(cnt, 0::bigint) AS connection_count
      FROM generate_series(date_trunc('week', v_start), date_trunc('week', v_end), interval '1 week') AS gs
      LEFT JOIN (
        SELECT date_trunc('week', created_at) AS bucket, count(*)::bigint AS cnt
        FROM marcheur_activity_logs
        WHERE event_type = 'session_start'
          AND created_at >= v_start AND created_at < v_end
        GROUP BY bucket
      ) sub ON sub.bucket = gs
      ORDER BY gs;
  END IF;
END;
$$;
