-- 1. Table des suggestions ignorées
CREATE TABLE IF NOT EXISTS public.community_science_account_suggestions_ignored (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
  network public.science_network NOT NULL,
  observer_name text NOT NULL,
  ignored_by uuid,
  ignored_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, network, observer_name)
);

CREATE INDEX IF NOT EXISTS idx_csasi_profile ON public.community_science_account_suggestions_ignored(profile_id);

ALTER TABLE public.community_science_account_suggestions_ignored ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read suggestions ignored" ON public.community_science_account_suggestions_ignored;
CREATE POLICY "admins read suggestions ignored"
  ON public.community_science_account_suggestions_ignored
  FOR SELECT TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "admins write suggestions ignored" ON public.community_science_account_suggestions_ignored;
CREATE POLICY "admins write suggestions ignored"
  ON public.community_science_account_suggestions_ignored
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 2. Activer unaccent (idempotent)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 3. RPC: suggest_science_accounts (admin only)
CREATE OR REPLACE FUNCTION public.suggest_science_accounts()
RETURNS TABLE (
  profile_id uuid,
  prenom text,
  nom text,
  ville text,
  avatar_url text,
  network public.science_network,
  observer_name text,
  observer_count bigint,
  species_count bigint,
  last_observation_date date,
  sample_url text,
  confidence text,
  homonym_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH attribs AS (
    SELECT
      LOWER(unaccent(TRIM(a->>'observerName'))) AS norm_name,
      TRIM(a->>'observerName') AS raw_name,
      CASE
        WHEN LOWER(COALESCE(a->>'source','')) LIKE '%inat%'  THEN 'inaturalist'::public.science_network
        WHEN LOWER(COALESCE(a->>'source','')) LIKE '%ebird%' THEN 'ebird'::public.science_network
        WHEN LOWER(COALESCE(a->>'source','')) LIKE '%gbif%'  THEN 'gbif'::public.science_network
        ELSE NULL
      END AS net,
      a->>'originalUrl' AS url,
      NULLIF(a->>'date','')::date AS obs_date,
      sp->>'scientificName' AS sci_name
    FROM public.biodiversity_snapshots bs,
         LATERAL jsonb_array_elements(bs.species_data) sp,
         LATERAL jsonb_array_elements(COALESCE(sp->'attributions','[]'::jsonb)) a
    WHERE COALESCE(a->>'observerName','') <> ''
  ),
  agg AS (
    SELECT
      raw_name,
      norm_name,
      net,
      COUNT(DISTINCT url) AS obs_count,
      COUNT(DISTINCT sci_name) AS sp_count,
      MAX(obs_date) AS last_date,
      (ARRAY_AGG(url ORDER BY obs_date DESC NULLS LAST))[1] AS sample
    FROM attribs
    WHERE net IS NOT NULL
    GROUP BY raw_name, norm_name, net
  ),
  profiles_norm AS (
    SELECT
      cp.id,
      cp.prenom,
      cp.nom,
      cp.ville,
      cp.avatar_url,
      LOWER(unaccent(TRIM(cp.prenom || ' ' || cp.nom))) AS full_norm
    FROM public.community_profiles cp
  ),
  homonyms AS (
    SELECT full_norm, COUNT(*)::int AS c
    FROM profiles_norm
    GROUP BY full_norm
  ),
  matches AS (
    SELECT
      p.id AS profile_id,
      p.prenom, p.nom, p.ville, p.avatar_url,
      g.net AS network,
      g.raw_name,
      g.obs_count, g.sp_count, g.last_date, g.sample,
      h.c AS homonym_count
    FROM agg g
    JOIN profiles_norm p ON p.full_norm = g.norm_name
    JOIN homonyms h ON h.full_norm = p.full_norm
  )
  SELECT
    m.profile_id,
    m.prenom, m.nom, m.ville, m.avatar_url,
    m.network,
    m.raw_name AS observer_name,
    m.obs_count AS observer_count,
    m.sp_count AS species_count,
    m.last_date AS last_observation_date,
    m.sample AS sample_url,
    CASE
      WHEN m.homonym_count > 1 THEN 'fuzzy'
      ELSE 'exact'
    END AS confidence,
    m.homonym_count
  FROM matches m
  -- Exclure suggestions déjà liées
  WHERE NOT EXISTS (
    SELECT 1 FROM public.community_profile_science_accounts s
    WHERE s.profile_id = m.profile_id AND s.network = m.network
  )
  -- Exclure suggestions ignorées
  AND NOT EXISTS (
    SELECT 1 FROM public.community_science_account_suggestions_ignored i
    WHERE i.profile_id = m.profile_id
      AND i.network = m.network
      AND LOWER(unaccent(i.observer_name)) = LOWER(unaccent(m.raw_name))
  )
  ORDER BY m.obs_count DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.suggest_science_accounts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.suggest_science_accounts() TO authenticated;