-- Fix: replace nonexistent public.has_role with existing public.check_is_admin_user

CREATE OR REPLACE FUNCTION public.toggle_event_public(_event_id uuid, _is_public boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _slug text;
  _date date;
  _title text;
BEGIN
  IF _admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.check_is_admin_user(_admin_id) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT title, date_marche, public_slug INTO _title, _date, _slug
  FROM public.marche_events WHERE id = _event_id;

  IF _slug IS NULL AND _is_public THEN
    _slug := public.generate_event_public_slug(_title, _date);
  END IF;

  UPDATE public.marche_events
  SET is_public = _is_public,
      public_slug = COALESCE(_slug, public_slug),
      published_at = CASE WHEN _is_public AND published_at IS NULL THEN now() ELSE published_at END,
      published_by = CASE WHEN _is_public AND published_by IS NULL THEN _admin_id ELSE published_by END,
      updated_at = now()
  WHERE id = _event_id;

  RETURN jsonb_build_object('is_public', _is_public, 'public_slug', _slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_event_rayonnement(_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _result jsonb;
BEGIN
  IF NOT public.check_is_admin_user(_admin_id) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'views_total', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view'),
    'unique_visitors', (SELECT count(DISTINCT session_id) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view'),
    'views_last_30d', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view' AND viewed_at >= now() - interval '30 days'),
    'shares_total', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'share'),
    'cta_clicks_total', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'cta_click'),
    'shares_by_channel', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('channel', channel, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(event_meta->>'channel', 'unknown') AS channel, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND event_type = 'share'
        GROUP BY 1 ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'top_referrers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('referrer', referrer, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(referrer, 'direct') AS referrer, count(*) AS cnt
        FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view'
        GROUP BY 1 ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'channels', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('source', utm_source, 'medium', utm_medium, 'count', cnt)), '[]'::jsonb)
      FROM (
        SELECT utm_source, utm_medium, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND event_type = 'view' AND utm_source IS NOT NULL
        GROUP BY utm_source, utm_medium ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'daily_30d', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', viewed_at AT TIME ZONE 'Europe/Paris')::date AS day, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND event_type = 'view' AND viewed_at >= now() - interval '30 days'
        GROUP BY 1
      ) t
    )
  ) INTO _result;

  RETURN _result;
END;
$$;