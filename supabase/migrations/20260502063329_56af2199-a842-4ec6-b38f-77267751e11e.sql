CREATE OR REPLACE FUNCTION public.get_community_impact_aggregates_scoped(
  p_event_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH base AS (
    SELECT
      cp.user_id,
      cp.role::text AS role,
      cp.genre::text AS genre,
      cp.csp::text AS csp,
      public.age_bracket(cp.date_naissance) AS bracket,
      cp.ville,
      cp.marches_count
    FROM public.community_profiles cp
    WHERE p_event_id IS NULL
       OR cp.user_id IN (
            SELECT mp.user_id
            FROM public.marche_participations mp
            WHERE mp.marche_event_id = p_event_id
          )
  )
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM base),
    'with_gender', (SELECT COUNT(*) FROM base WHERE genre IS NOT NULL),
    'with_csp', (SELECT COUNT(*) FROM base WHERE csp IS NOT NULL),
    'with_birthdate', (SELECT COUNT(*) FROM base WHERE bracket <> 'inconnu'),
    'territories_count', (
      SELECT COUNT(DISTINCT me.exploration_id)
      FROM public.marche_participations mp
      JOIN public.marche_events me ON me.id = mp.marche_event_id
      WHERE me.exploration_id IS NOT NULL
        AND (p_event_id IS NULL OR me.id = p_event_id)
    ),
    'by_age', (
      SELECT COALESCE(jsonb_object_agg(bracket, c), '{}'::jsonb)
      FROM (SELECT bracket, COUNT(*)::int AS c FROM base GROUP BY bracket) t
    ),
    'by_gender', (
      SELECT COALESCE(jsonb_object_agg(COALESCE(genre, 'inconnu'), c), '{}'::jsonb)
      FROM (SELECT genre, COUNT(*)::int AS c FROM base GROUP BY genre) t
    ),
    'by_csp', (
      SELECT COALESCE(jsonb_object_agg(COALESCE(csp, 'inconnu'), c), '{}'::jsonb)
      FROM (SELECT csp, COUNT(*)::int AS c FROM base GROUP BY csp) t
    ),
    'by_role', (
      SELECT COALESCE(jsonb_object_agg(role, c), '{}'::jsonb)
      FROM (SELECT role, COUNT(*)::int AS c FROM base GROUP BY role) t
    ),
    'csp_x_age', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('csp', csp, 'bracket', bracket, 'count', c)), '[]'::jsonb)
      FROM (
        SELECT csp, bracket, COUNT(*)::int AS c
        FROM base
        WHERE csp IS NOT NULL AND bracket <> 'inconnu'
        GROUP BY csp, bracket
      ) t
    ),
    'top_cities', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('ville', ville, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (
        SELECT ville, COUNT(*)::int AS c
        FROM base
        WHERE ville IS NOT NULL AND ville <> ''
        GROUP BY ville
        ORDER BY c DESC
        LIMIT 12
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$function$;