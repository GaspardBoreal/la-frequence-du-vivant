DROP FUNCTION IF EXISTS public.get_activity_global_stats();
DROP FUNCTION IF EXISTS public.get_activity_global_stats(text, uuid, uuid, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_activity_global_stats(
  p_period text default '7d',
  p_event_id uuid default null,
  p_user_filter uuid default null,
  p_start timestamptz default null,
  p_end   timestamptz default null
)
RETURNS TABLE(
  active_sessions bigint,
  media_uploads bigint,
  most_popular_tab text,
  most_active_user_id uuid,
  most_active_prenom text,
  most_active_nom text,
  most_active_event_id uuid,
  most_active_event_title text,
  most_active_event_views bigint,
  total_events bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tz constant text := 'Europe/Paris';
  v_local_today timestamp := date_trunc('day', now() AT TIME ZONE v_tz);
  v_start timestamptz;
  v_end   timestamptz;
BEGIN
  IF p_start IS NOT NULL AND p_end IS NOT NULL THEN
    v_start := p_start;
    v_end   := p_end;
  ELSE
    CASE COALESCE(p_period, '7d')
      WHEN 'today' THEN
        v_start := (v_local_today) AT TIME ZONE v_tz;
        v_end   := (v_local_today + interval '1 day') AT TIME ZONE v_tz;
      WHEN 'yesterday' THEN
        v_start := (v_local_today - interval '1 day') AT TIME ZONE v_tz;
        v_end   := (v_local_today) AT TIME ZONE v_tz;
      WHEN '7d' THEN
        v_start := (v_local_today - interval '6 days') AT TIME ZONE v_tz;
        v_end   := (v_local_today + interval '1 day') AT TIME ZONE v_tz;
      WHEN 'month' THEN
        v_start := (v_local_today - interval '29 days') AT TIME ZONE v_tz;
        v_end   := (v_local_today + interval '1 day') AT TIME ZONE v_tz;
      WHEN 'year' THEN
        v_start := (v_local_today - interval '11 months') AT TIME ZONE v_tz;
        v_end   := (v_local_today + interval '1 day') AT TIME ZONE v_tz;
      WHEN 'all' THEN
        v_start := NULL;
        v_end   := NULL;
      ELSE
        v_start := (v_local_today - interval '6 days') AT TIME ZONE v_tz;
        v_end   := (v_local_today + interval '1 day') AT TIME ZONE v_tz;
    END CASE;
  END IF;

  RETURN QUERY
  WITH recent AS (
    SELECT l.*
    FROM marcheur_activity_logs l
    WHERE (v_start IS NULL OR l.created_at >= v_start)
      AND (v_end   IS NULL OR l.created_at <  v_end)
      AND (p_event_id IS NULL OR l.marche_event_id = p_event_id)
      AND (p_user_filter IS NULL OR l.user_id = p_user_filter)
  ),
  pop_tab AS (
    SELECT event_target FROM recent
    WHERE event_type = 'tab_switch' AND event_target IS NOT NULL
    GROUP BY event_target ORDER BY COUNT(*) DESC LIMIT 1
  ),
  active_user AS (
    SELECT r.user_id, COUNT(*) AS cnt FROM recent r
    WHERE r.user_id IS NOT NULL
    GROUP BY r.user_id ORDER BY cnt DESC LIMIT 1
  ),
  top_event AS (
    SELECT r.marche_event_id, COUNT(*) AS cnt FROM recent r
    WHERE r.marche_event_id IS NOT NULL
    GROUP BY r.marche_event_id ORDER BY cnt DESC LIMIT 1
  )
  SELECT
    (SELECT COUNT(DISTINCT r.user_id) FROM recent r)::bigint,
    (SELECT COUNT(*) FROM recent r WHERE r.event_type = 'media_upload')::bigint,
    (SELECT event_target FROM pop_tab),
    au.user_id,
    cp.prenom,
    cp.nom,
    te.marche_event_id,
    me.title,
    te.cnt::bigint,
    (SELECT COUNT(*) FROM recent)::bigint
  FROM (SELECT 1) dummy
  LEFT JOIN active_user au ON true
  LEFT JOIN community_profiles cp ON cp.user_id = au.user_id
  LEFT JOIN top_event te ON true
  LEFT JOIN marche_events me ON me.id = te.marche_event_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_activity_global_stats(text, uuid, uuid, timestamptz, timestamptz) TO authenticated, service_role;