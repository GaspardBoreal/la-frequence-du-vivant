-- ============================================================
-- PUBLIC EVENTS — Lot 1 : Fondations
-- ============================================================

-- 1) Colonnes de publication sur marche_events
ALTER TABLE public.marche_events
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

CREATE INDEX IF NOT EXISTS idx_marche_events_is_public
  ON public.marche_events (is_public) WHERE is_public = true;

-- 2) Extension unaccent (idempotent)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 3) Générateur de slug
CREATE OR REPLACE FUNCTION public.generate_event_public_slug(_title text, _date date)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 0;
BEGIN
  base_slug := lower(regexp_replace(
    unaccent(coalesce(_title, 'marche')),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'marche'; END IF;
  base_slug := base_slug || '-' || to_char(_date, 'YYYY-MM-DD');
  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.marche_events WHERE public_slug = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 4) Toggle publication (admin uniquement)
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
  IF NOT public.has_role(_admin_id, 'admin') THEN
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

-- 5) Analytics : vues publiques
CREATE TABLE IF NOT EXISTS public.event_public_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  marcheur_slug text,
  country text,
  user_agent_family text
);

CREATE INDEX IF NOT EXISTS idx_event_public_views_event_viewed
  ON public.event_public_views (event_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_public_views_session
  ON public.event_public_views (event_id, session_id);

ALTER TABLE public.event_public_views ENABLE ROW LEVEL SECURITY;

-- Pas d'accès SELECT direct : tout passe par RPC
CREATE POLICY "No direct read access to public views"
  ON public.event_public_views FOR SELECT USING (false);

-- 6) RPC publiques (SECURITY DEFINER) - accessibles anon
CREATE OR REPLACE FUNCTION public.get_public_event(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'description', e.description,
    'date_marche', e.date_marche,
    'lieu', e.lieu,
    'latitude', e.latitude,
    'longitude', e.longitude,
    'event_type', e.event_type,
    'cover_image_url', e.cover_image_url,
    'public_slug', e.public_slug,
    'published_at', e.published_at,
    'exploration_id', e.exploration_id
  ) INTO _result
  FROM public.marche_events e
  WHERE e.public_slug = _slug AND e.is_public = true;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_event_counters(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _total int;
  _unique int;
  _last7 int;
BEGIN
  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  SELECT count(*), count(DISTINCT session_id)
    INTO _total, _unique
    FROM public.event_public_views WHERE event_id = _event_id;
  SELECT count(*) INTO _last7
    FROM public.event_public_views
    WHERE event_id = _event_id AND viewed_at >= now() - interval '7 days';

  RETURN jsonb_build_object(
    'views_total', COALESCE(_total, 0),
    'unique_visitors', COALESCE(_unique, 0),
    'views_last_7d', COALESCE(_last7, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_public_event_view(
  _slug text,
  _session_id text,
  _referrer text DEFAULT NULL,
  _utm_source text DEFAULT NULL,
  _utm_medium text DEFAULT NULL,
  _utm_campaign text DEFAULT NULL,
  _marcheur_slug text DEFAULT NULL,
  _user_agent_family text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _event_id uuid;
BEGIN
  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.event_public_views (
    event_id, session_id, referrer, utm_source, utm_medium, utm_campaign,
    marcheur_slug, user_agent_family
  ) VALUES (
    _event_id, _session_id, _referrer, _utm_source, _utm_medium, _utm_campaign,
    _marcheur_slug, _user_agent_family
  );
END;
$$;

-- 7) Statistiques agrégées pour le dashboard admin (Rayonnement)
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
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'views_total', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id),
    'unique_visitors', (SELECT count(DISTINCT session_id) FROM public.event_public_views WHERE event_id = _event_id),
    'views_last_30d', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND viewed_at >= now() - interval '30 days'),
    'top_referrers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('referrer', referrer, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(referrer, 'direct') AS referrer, count(*) AS cnt
        FROM public.event_public_views WHERE event_id = _event_id
        GROUP BY COALESCE(referrer, 'direct')
        ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'channels', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('source', utm_source, 'medium', utm_medium, 'count', cnt)), '[]'::jsonb)
      FROM (
        SELECT utm_source, utm_medium, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND utm_source IS NOT NULL
        GROUP BY utm_source, utm_medium ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'daily_30d', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', viewed_at AT TIME ZONE 'Europe/Paris')::date AS day, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND viewed_at >= now() - interval '30 days'
        GROUP BY 1
      ) t
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- 8) Grants : anon doit pouvoir appeler les RPC publiques
GRANT EXECUTE ON FUNCTION public.get_public_event(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_event_counters(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_public_event_view(text, text, text, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_event_public(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_rayonnement(uuid) TO authenticated;