
-- Table des logs d'activité
CREATE TABLE public.marcheur_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_target text NOT NULL,
  exploration_id uuid,
  marche_event_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_user ON public.marcheur_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_type ON public.marcheur_activity_logs(event_type, created_at DESC);
CREATE INDEX idx_activity_exploration ON public.marcheur_activity_logs(exploration_id, created_at DESC) WHERE exploration_id IS NOT NULL;

ALTER TABLE public.marcheur_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity"
ON public.marcheur_activity_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all activity"
ON public.marcheur_activity_logs
FOR SELECT TO authenticated
USING (public.check_is_admin_user(auth.uid()));

-- RPC: Dashboard par marcheur
CREATE OR REPLACE FUNCTION public.get_marcheur_activity_dashboard()
RETURNS TABLE(
  user_id uuid,
  prenom text,
  nom text,
  role text,
  last_seen timestamptz,
  sessions_7d bigint,
  favorite_tabs text[],
  photos_count bigint,
  sounds_count bigint,
  texts_count bigint,
  explorations_viewed bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_activity AS (
    SELECT
      a.user_id,
      MAX(a.created_at) AS last_seen,
      COUNT(DISTINCT DATE(a.created_at)) FILTER (WHERE a.created_at > now() - interval '7 days') AS sessions_7d,
      -- Top 3 tabs
      (SELECT array_agg(tab ORDER BY cnt DESC)
       FROM (
         SELECT event_target AS tab, COUNT(*) AS cnt
         FROM marcheur_activity_logs sub
         WHERE sub.user_id = a.user_id
           AND sub.event_type = 'tab_switch'
         GROUP BY event_target
         ORDER BY cnt DESC
         LIMIT 3
       ) t
      ) AS favorite_tabs,
      COUNT(*) FILTER (WHERE a.event_type = 'media_upload' AND a.event_target = 'photo') AS photos_count,
      COUNT(*) FILTER (WHERE a.event_type = 'media_upload' AND a.event_target = 'audio') AS sounds_count,
      COUNT(*) FILTER (WHERE a.event_type = 'media_upload' AND a.event_target = 'text') AS texts_count,
      COUNT(DISTINCT a.exploration_id) FILTER (WHERE a.event_type = 'page_view' AND a.exploration_id IS NOT NULL) AS explorations_viewed
    FROM marcheur_activity_logs a
    GROUP BY a.user_id
  )
  SELECT
    ua.user_id,
    cp.prenom,
    cp.nom,
    cp.role::text,
    ua.last_seen,
    ua.sessions_7d,
    COALESCE(ua.favorite_tabs, ARRAY[]::text[]),
    ua.photos_count,
    ua.sounds_count,
    ua.texts_count,
    ua.explorations_viewed
  FROM user_activity ua
  LEFT JOIN community_profiles cp ON cp.user_id = ua.user_id
  WHERE public.check_is_admin_user(auth.uid())
  ORDER BY ua.last_seen DESC;
$$;

-- RPC: Stats globales
CREATE OR REPLACE FUNCTION public.get_activity_global_stats()
RETURNS TABLE(
  active_sessions_7d bigint,
  media_uploads_7d bigint,
  most_popular_tab text,
  most_active_user_id uuid,
  most_active_prenom text,
  most_active_nom text,
  total_events_7d bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH recent AS (
    SELECT * FROM marcheur_activity_logs WHERE created_at > now() - interval '7 days'
  ),
  pop_tab AS (
    SELECT event_target FROM recent WHERE event_type = 'tab_switch'
    GROUP BY event_target ORDER BY COUNT(*) DESC LIMIT 1
  ),
  active_user AS (
    SELECT user_id, COUNT(*) AS cnt FROM recent GROUP BY user_id ORDER BY cnt DESC LIMIT 1
  )
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM recent) AS active_sessions_7d,
    (SELECT COUNT(*) FROM recent WHERE event_type = 'media_upload') AS media_uploads_7d,
    (SELECT event_target FROM pop_tab) AS most_popular_tab,
    au.user_id,
    cp.prenom,
    cp.nom,
    (SELECT COUNT(*) FROM recent) AS total_events_7d
  FROM active_user au
  LEFT JOIN community_profiles cp ON cp.user_id = au.user_id;
$$;

-- RPC: Timeline récente
CREATE OR REPLACE FUNCTION public.get_activity_timeline(p_limit integer DEFAULT 50, p_user_filter uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  prenom text,
  nom text,
  event_type text,
  event_target text,
  exploration_id uuid,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.id,
    a.user_id,
    cp.prenom,
    cp.nom,
    a.event_type,
    a.event_target,
    a.exploration_id,
    a.metadata,
    a.created_at
  FROM marcheur_activity_logs a
  LEFT JOIN community_profiles cp ON cp.user_id = a.user_id
  WHERE public.check_is_admin_user(auth.uid())
    AND (p_user_filter IS NULL OR a.user_id = p_user_filter)
  ORDER BY a.created_at DESC
  LIMIT p_limit;
$$;
