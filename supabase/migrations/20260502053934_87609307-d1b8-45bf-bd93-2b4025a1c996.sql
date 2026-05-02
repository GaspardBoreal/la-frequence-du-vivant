-- Enums
DO $$ BEGIN
  CREATE TYPE public.profile_gender AS ENUM ('femme', 'homme', 'non_binaire', 'prefere_ne_pas_dire');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_csp AS ENUM (
    'agriculteurs',
    'artisans_commercants',
    'cadres',
    'professions_intermediaires',
    'employes',
    'ouvriers',
    'retraites',
    'etudiants',
    'sans_activite',
    'prefere_ne_pas_dire'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Columns
ALTER TABLE public.community_profiles
  ADD COLUMN IF NOT EXISTS genre public.profile_gender,
  ADD COLUMN IF NOT EXISTS csp public.profile_csp,
  ADD COLUMN IF NOT EXISTS csp_precision text;

-- Length guard for csp_precision
ALTER TABLE public.community_profiles
  DROP CONSTRAINT IF EXISTS community_profiles_csp_precision_length;
ALTER TABLE public.community_profiles
  ADD CONSTRAINT community_profiles_csp_precision_length
  CHECK (csp_precision IS NULL OR char_length(csp_precision) <= 80);

-- Helper: age bracket
CREATE OR REPLACE FUNCTION public.age_bracket(_birth date)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _birth IS NULL THEN 'inconnu'
    ELSE (
      WITH years AS (SELECT EXTRACT(YEAR FROM age(_birth))::int AS y)
      SELECT CASE
        WHEN y < 15 THEN '0_14'
        WHEN y < 30 THEN '15_29'
        WHEN y < 45 THEN '30_44'
        WHEN y < 60 THEN '45_59'
        WHEN y < 75 THEN '60_74'
        ELSE '75_plus'
      END FROM years
    )
  END;
$$;

-- Aggregates RPC (admin only)
CREATE OR REPLACE FUNCTION public.get_community_impact_aggregates()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.get_community_impact_aggregates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.age_bracket(date) TO authenticated, anon;