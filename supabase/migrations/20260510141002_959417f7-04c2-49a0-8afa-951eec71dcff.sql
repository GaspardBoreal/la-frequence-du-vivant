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
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH attribs AS (
    SELECT
      LOWER(extensions.unaccent(TRIM(a->>'observerName'))) AS norm_name,
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
      REPLACE(norm_name, ' ', '') AS compact_name,
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
      cp.id, cp.prenom, cp.nom, cp.ville, cp.avatar_url,
      LOWER(extensions.unaccent(TRIM(cp.prenom || ' ' || cp.nom))) AS full_norm,
      REPLACE(LOWER(extensions.unaccent(TRIM(cp.prenom || ' ' || cp.nom))), ' ', '') AS full_compact,
      LOWER(extensions.unaccent(TRIM(cp.nom || ' ' || cp.prenom))) AS full_reversed
    FROM public.community_profiles cp
    WHERE COALESCE(cp.prenom,'') <> '' AND COALESCE(cp.nom,'') <> ''
  ),
  candidates AS (
    SELECT
      p.id AS profile_id,
      p.prenom, p.nom, p.ville, p.avatar_url,
      g.net AS network, g.raw_name, g.norm_name,
      g.obs_count, g.sp_count, g.last_date, g.sample
    FROM agg g
    JOIN profiles_norm p ON (
         p.full_norm     = g.norm_name
      OR p.full_compact  = g.compact_name
      OR p.full_reversed = g.norm_name
    )
  ),
  with_homonyms AS (
    SELECT
      c.*,
      COUNT(*) OVER (PARTITION BY c.network, c.norm_name)::int AS homonym_count
    FROM candidates c
  )
  SELECT
    m.profile_id, m.prenom, m.nom, m.ville, m.avatar_url,
    m.network,
    m.raw_name AS observer_name,
    m.obs_count AS observer_count,
    m.sp_count AS species_count,
    m.last_date AS last_observation_date,
    m.sample AS sample_url,
    CASE WHEN m.homonym_count > 1 THEN 'fuzzy' ELSE 'exact' END AS confidence,
    m.homonym_count
  FROM with_homonyms m
  WHERE NOT EXISTS (
    SELECT 1 FROM public.community_profile_science_accounts s
    WHERE s.profile_id = m.profile_id AND s.network = m.network
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.community_science_account_suggestions_ignored i
    WHERE i.profile_id = m.profile_id
      AND i.network = m.network
      AND LOWER(extensions.unaccent(i.observer_name)) = LOWER(extensions.unaccent(m.raw_name))
  )
  ORDER BY m.obs_count DESC;
END;
$$;