DROP FUNCTION IF EXISTS public.get_community_usage_dashboard(timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_community_usage_dashboard(p_from timestamptz DEFAULT (now() - interval '90 days'), p_to timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  WITH
  base_users AS (
    SELECT cp.user_id, cp.id AS profile_id, cp.prenom, cp.nom, cp.ville, cp.role::text AS role,
           cp.csp::text AS csp, cp.genre::text AS genre, cp.date_naissance, cp.created_at AS signup_at,
           cp.is_adherent, cp.slug, cp.avatar_url
    FROM community_profiles cp
    WHERE cp.user_id IS NOT NULL
  ),
  act AS (
    SELECT user_id,
           COUNT(*) AS events_total,
           COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')  AS events_7d,
           COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') AS events_30d,
           COUNT(*) FILTER (WHERE created_at >= now() - interval '90 days') AS events_90d,
           COUNT(DISTINCT date_trunc('day', created_at)) AS active_days,
           COUNT(DISTINCT event_target) AS distinct_targets,
           MAX(created_at) AS last_seen_at,
           MIN(created_at) AS first_seen_at
    FROM marcheur_activity_logs
    WHERE created_at >= p_from AND created_at <= p_to
    GROUP BY user_id
  ),
  contribs AS (
    SELECT u.user_id,
      COALESCE((SELECT COUNT(*) FROM marcheur_medias m WHERE m.user_id = u.user_id), 0)
      + COALESCE((SELECT COUNT(*) FROM marcheur_observations o WHERE o.user_id = u.user_id), 0)
      + COALESCE((SELECT COUNT(*) FROM marcheur_textes t WHERE t.user_id = u.user_id), 0)
      + COALESCE((SELECT COUNT(*) FROM marcheur_audio a WHERE a.user_id = u.user_id), 0) AS contrib_count
    FROM base_users u
  ),
  parts AS (
    SELECT user_id, COUNT(*) AS participations
    FROM marche_participations
    WHERE validated_at IS NOT NULL
    GROUP BY user_id
  ),
  users_enriched AS (
    SELECT bu.*,
           COALESCE(a.events_total, 0) AS events_total,
           COALESCE(a.events_7d, 0) AS events_7d,
           COALESCE(a.events_30d, 0) AS events_30d,
           COALESCE(a.events_90d, 0) AS events_90d,
           COALESCE(a.active_days, 0) AS active_days,
           COALESCE(a.distinct_targets, 0) AS distinct_targets,
           a.last_seen_at,
           a.first_seen_at,
           COALESCE(c.contrib_count, 0) AS contrib_count,
           COALESCE(p.participations, 0) AS participations,
           EXTRACT(DAY FROM (now() - COALESCE(a.last_seen_at, bu.signup_at)))::int AS days_since_active
    FROM base_users bu
    LEFT JOIN act a ON a.user_id = bu.user_id
    LEFT JOIN contribs c ON c.user_id = bu.user_id
    LEFT JOIN parts p ON p.user_id = bu.user_id
  ),
  users_persona AS (
    SELECT ue.*,
      CASE
        WHEN ue.days_since_active >= 60 AND ue.events_90d = 0 THEN 'endormis'
        WHEN ue.signup_at >= now() - interval '30 days' AND ue.participations = 0 THEN 'nouvelles_graines'
        WHEN ue.events_30d >= 10 AND ue.contrib_count >= 5 AND ue.distinct_targets >= 4 THEN 'sentinelles_actives'
        WHEN ue.participations >= 1 AND ue.contrib_count = 0 THEN 'contributeurs_passifs'
        WHEN ue.events_30d >= 5 AND ue.participations = 0 THEN 'explorateurs_numeriques'
        WHEN ue.participations >= 1 AND ue.contrib_count >= 1 AND ue.events_30d < 5 THEN 'ambassadeurs_latents'
        ELSE 'observateurs'
      END AS persona
    FROM users_enriched ue
  ),
  kpis AS (
    SELECT
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE events_7d > 0) AS dau_7d,
      COUNT(*) FILTER (WHERE events_30d > 0) AS wau_30d,
      COUNT(*) FILTER (WHERE events_90d > 0) AS mau_90d,
      COUNT(*) FILTER (WHERE participations >= 1) AS with_participation,
      COUNT(*) FILTER (WHERE participations >= 2) AS returning,
      COUNT(*) FILTER (WHERE contrib_count >= 1) AS contributors,
      COUNT(*) FILTER (WHERE is_adherent = true) AS adherents,
      ROUND(AVG(events_30d)::numeric, 1) AS avg_events_30d,
      ROUND(AVG(contrib_count)::numeric, 1) AS avg_contribs
    FROM users_persona
  ),
  persona_counts AS (
    SELECT persona, COUNT(*)::int AS count
    FROM users_persona
    GROUP BY persona
  ),
  persona_members AS (
    SELECT persona,
      jsonb_agg(jsonb_build_object(
        'user_id', user_id, 'profile_id', profile_id, 'prenom', prenom, 'nom', nom,
        'ville', ville, 'role', role, 'slug', slug, 'avatar_url', avatar_url,
        'events_30d', events_30d, 'contrib_count', contrib_count,
        'participations', participations, 'days_since_active', days_since_active,
        'last_seen_at', last_seen_at, 'signup_at', signup_at, 'is_adherent', is_adherent
      ) ORDER BY events_30d DESC, contrib_count DESC) AS members
    FROM users_persona
    GROUP BY persona
  ),
  bubble AS (
    SELECT jsonb_agg(jsonb_build_object(
      'user_id', user_id,
      'name', COALESCE(NULLIF(TRIM(COALESCE(prenom,'') || ' ' || COALESCE(nom,'')), ''), 'Marcheur·euse'),
      'x', GREATEST(0, 90 - LEAST(days_since_active, 90)),
      'y', events_30d,
      'z', GREATEST(4, LEAST(contrib_count * 3 + 4, 60)),
      'persona', persona,
      'contribs', contrib_count,
      'participations', participations,
      'role', role
    )) AS points
    FROM users_persona
  ),
  heatmap AS (
    SELECT jsonb_agg(jsonb_build_object('dow', dow, 'hour', hour, 'count', count)) AS grid
    FROM (
      SELECT
        EXTRACT(DOW  FROM (created_at AT TIME ZONE 'Europe/Paris'))::int AS dow,
        EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Europe/Paris'))::int AS hour,
        COUNT(*)::int AS count
      FROM marcheur_activity_logs
      WHERE created_at >= p_from AND created_at <= p_to
      GROUP BY 1, 2
    ) g
  ),
  radar_raw AS (
    SELECT up.persona,
      CASE
        WHEN mal.event_target ILIKE '%carnet%'      THEN 'Carnet'
        WHEN mal.event_target ILIKE '%carte%' OR mal.event_target ILIKE '%map%' THEN 'Carte'
        WHEN mal.event_target ILIKE '%espece%' OR mal.event_target ILIKE '%species%' OR mal.event_target ILIKE '%biodiv%' THEN 'Espèces'
        WHEN mal.event_target ILIKE '%chat%' OR mal.event_target ILIKE '%bot%' THEN 'Chatbot'
        WHEN mal.event_target ILIKE '%audio%' OR mal.event_target ILIKE '%son%' THEN 'Audio'
        WHEN mal.event_target ILIKE '%outil%' OR mal.event_target ILIKE '%tool%' THEN 'Outils'
        WHEN mal.event_target ILIKE '%quiz%'        THEN 'Quiz'
        WHEN mal.event_target ILIKE '%partage%' OR mal.event_target ILIKE '%share%' THEN 'Partage'
        ELSE 'Autre'
      END AS feature,
      COUNT(*)::int AS count
    FROM marcheur_activity_logs mal
    JOIN users_persona up ON up.user_id = mal.user_id
    WHERE mal.created_at >= p_from AND mal.created_at <= p_to
    GROUP BY 1, 2
  ),
  radar AS (
    SELECT jsonb_agg(jsonb_build_object('persona', persona, 'feature', feature, 'count', count)) AS data
    FROM radar_raw
    WHERE feature <> 'Autre'
  ),
  funnel AS (
    SELECT jsonb_build_object(
      'inscrits',     (SELECT COUNT(*) FROM users_persona),
      'actifs_30d',   (SELECT COUNT(*) FROM users_persona WHERE events_30d > 0),
      'participants', (SELECT COUNT(*) FROM users_persona WHERE participations >= 1),
      'fideles',      (SELECT COUNT(*) FROM users_persona WHERE participations >= 2),
      'contributeurs',(SELECT COUNT(*) FROM users_persona WHERE contrib_count >= 1),
      'adherents',    (SELECT COUNT(*) FROM users_persona WHERE is_adherent = true)
    ) AS f
  ),
  top_cities AS (
    SELECT jsonb_agg(jsonb_build_object('ville', ville, 'count', c) ORDER BY c DESC) AS cities
    FROM (
      SELECT ville, COUNT(*)::int AS c
      FROM users_persona
      WHERE ville IS NOT NULL AND ville <> ''
      GROUP BY ville
      ORDER BY c DESC
      LIMIT 12
    ) tc
  ),
  daily AS (
    SELECT jsonb_agg(jsonb_build_object('day', d::date, 'active_users', COALESCE(u, 0)) ORDER BY d) AS series
    FROM (
      SELECT generate_series(now()::date - interval '29 days', now()::date, '1 day'::interval) AS d
    ) s
    LEFT JOIN (
      SELECT date_trunc('day', created_at AT TIME ZONE 'Europe/Paris')::date AS day,
             COUNT(DISTINCT user_id) AS u
      FROM marcheur_activity_logs
      WHERE created_at >= now() - interval '30 days'
      GROUP BY 1
    ) k ON k.day = s.d::date
  )
  SELECT jsonb_build_object(
    'kpis',       (SELECT to_jsonb(kpis) FROM kpis),
    'personas',   (SELECT jsonb_agg(jsonb_build_object('key', persona, 'count', count)) FROM persona_counts),
    'persona_members', (SELECT jsonb_object_agg(persona, members) FROM persona_members),
    'bubble',     (SELECT points FROM bubble),
    'heatmap',    (SELECT grid FROM heatmap),
    'radar',      (SELECT data FROM radar),
    'funnel',     (SELECT f FROM funnel),
    'top_cities', (SELECT cities FROM top_cities),
    'daily',      (SELECT series FROM daily),
    'range',      jsonb_build_object('from', p_from, 'to', p_to),
    'generated_at', now()
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_usage_dashboard(timestamptz, timestamptz) TO authenticated;