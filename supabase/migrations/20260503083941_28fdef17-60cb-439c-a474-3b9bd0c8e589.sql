CREATE OR REPLACE FUNCTION public.get_community_impact_aggregates_by_exploration(
  p_exploration_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF p_exploration_id IS NULL THEN
    RAISE EXCEPTION 'exploration_id required';
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
    WHERE cp.user_id IN (
      SELECT DISTINCT mp.user_id
      FROM public.marche_participations mp
      JOIN public.marche_events me ON me.id = mp.marche_event_id
      WHERE me.exploration_id = p_exploration_id
    )
  )
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM base),
    'with_gender', (SELECT COUNT(*) FROM base WHERE genre IS NOT NULL),
    'with_csp', (SELECT COUNT(*) FROM base WHERE csp IS NOT NULL),
    'with_birthdate', (SELECT COUNT(*) FROM base WHERE bracket <> 'inconnu'),
    'territories_count', 1,
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
    'csp_x_age', '[]'::jsonb,
    'top_cities', '[]'::jsonb
  ) INTO result;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_community_impact_aggregates_by_exploration(uuid) TO authenticated;