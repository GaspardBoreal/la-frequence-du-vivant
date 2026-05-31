-- 1. Extend get_exploration_species_count to also return per-marche breakdown
CREATE OR REPLACE FUNCTION public.get_exploration_species_count(p_exploration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH marche_ctx AS (
    SELECT
      em.marche_id,
      m.latitude  AS m_lat,
      m.longitude AS m_lon,
      COALESCE(m.radius_m, e.default_radius_m, 500) AS radius_m
    FROM public.exploration_marches em
    JOIN public.marches m       ON m.id = em.marche_id
    JOIN public.explorations e  ON e.id = em.exploration_id
    WHERE em.exploration_id = p_exploration_id
  ),
  snap_rows AS (
    SELECT
      mc.marche_id, mc.m_lat, mc.m_lon, mc.radius_m,
      bs.radius_meters AS snap_radius,
      sp
    FROM public.biodiversity_snapshots bs
    JOIN marche_ctx mc USING (marche_id),
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(bs.species_data) = 'array' THEN bs.species_data ELSE '[]'::jsonb END
    ) AS sp
  ),
  snap_species AS (
    SELECT
      sr.marche_id,
      lower(extensions.unaccent(trim(coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name', '')))) AS key,
      coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name') AS sci,
      coalesce(sr.sp->>'kingdom', 'Unknown') AS kingdom
    FROM snap_rows sr
    WHERE
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array'
               THEN sr.sp->'attributions' ELSE '[]'::jsonb END
        ) AS att
        WHERE (att->>'exactLatitude')  IS NOT NULL
          AND (att->>'exactLongitude') IS NOT NULL
          AND public.haversine_m(
                sr.m_lat, sr.m_lon,
                (att->>'exactLatitude')::numeric,
                (att->>'exactLongitude')::numeric
              ) <= sr.radius_m
      )
      OR (
        (sr.sp->>'exactLatitude') IS NOT NULL AND (sr.sp->>'exactLongitude') IS NOT NULL
        AND public.haversine_m(
              sr.m_lat, sr.m_lon,
              (sr.sp->>'exactLatitude')::numeric,
              (sr.sp->>'exactLongitude')::numeric
            ) <= sr.radius_m
      )
      OR (
        NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array'
                 THEN sr.sp->'attributions' ELSE '[]'::jsonb END
          ) AS a2
          WHERE (a2->>'exactLatitude') IS NOT NULL AND (a2->>'exactLongitude') IS NOT NULL
        )
        AND (sr.sp->>'exactLatitude') IS NULL
        AND sr.radius_m >= COALESCE(sr.snap_radius, 500)
      )
  ),
  marcheur_species AS (
    SELECT
      mc.marche_id,
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS key,
      mo.species_scientific_name AS sci,
      'Unknown'::text AS kingdom
    FROM public.marcheur_observations mo
    JOIN marche_ctx mc USING (marche_id)
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND (
        mo.latitude IS NULL OR mo.longitude IS NULL
        OR public.haversine_m(mc.m_lat, mc.m_lon, mo.latitude, mo.longitude) <= mc.radius_m
      )
  ),
  unioned AS (
    SELECT marche_id, key, sci, kingdom, 'snapshot'::text AS source FROM snap_species WHERE key <> ''
    UNION ALL
    SELECT marche_id, key, sci, kingdom, 'marcheur'::text AS source FROM marcheur_species WHERE key <> ''
  ),
  -- Per-marche dedup (a species counted once per marche where it appears)
  per_marche_species AS (
    SELECT DISTINCT marche_id, key FROM unioned
  ),
  by_marche AS (
    SELECT mc.marche_id,
           coalesce((SELECT count(*) FROM per_marche_species pms WHERE pms.marche_id = mc.marche_id), 0) AS species_count
    FROM marche_ctx mc
  ),
  -- Global dedup across the whole exploration
  grouped AS (
    SELECT
      key,
      max(sci) FILTER (WHERE sci IS NOT NULL) AS sci,
      coalesce(max(kingdom) FILTER (WHERE kingdom <> 'Unknown'), 'Unknown') AS kingdom,
      bool_or(source = 'snapshot') AS in_snapshot,
      bool_or(source = 'marcheur') AS in_marcheur
    FROM unioned GROUP BY key
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM grouped),
    'by_kingdom', jsonb_build_object(
      'animalia', (SELECT count(*) FROM grouped WHERE kingdom = 'Animalia'),
      'plantae',  (SELECT count(*) FROM grouped WHERE kingdom = 'Plantae'),
      'fungi',    (SELECT count(*) FROM grouped WHERE kingdom = 'Fungi'),
      'others',   (SELECT count(*) FROM grouped WHERE kingdom NOT IN ('Animalia','Plantae','Fungi'))
    ),
    'by_source', jsonb_build_object(
      'snapshots_only', (SELECT count(*) FROM grouped WHERE in_snapshot AND NOT in_marcheur),
      'marcheur_only',  (SELECT count(*) FROM grouped WHERE in_marcheur AND NOT in_snapshot),
      'both',           (SELECT count(*) FROM grouped WHERE in_snapshot AND in_marcheur)
    ),
    'by_marche', coalesce((
      SELECT jsonb_agg(jsonb_build_object('marche_id', marche_id, 'species_count', species_count))
      FROM by_marche
    ), '[]'::jsonb),
    'species', coalesce((
      SELECT jsonb_agg(jsonb_build_object('sci', sci, 'kingdom', kingdom, 'in_snapshot', in_snapshot, 'in_marcheur', in_marcheur) ORDER BY sci)
      FROM grouped
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exploration_species_count(uuid) TO anon, authenticated;

-- 2. Per-marche canonical species count (respects marche radius override or exploration default)
CREATE OR REPLACE FUNCTION public.get_marche_species_count(p_marche_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH ctx AS (
    SELECT
      m.id AS marche_id,
      m.latitude  AS m_lat,
      m.longitude AS m_lon,
      COALESCE(
        m.radius_m,
        (SELECT min(e.default_radius_m)
           FROM public.exploration_marches em
           JOIN public.explorations e ON e.id = em.exploration_id
          WHERE em.marche_id = m.id),
        500
      ) AS radius_m
    FROM public.marches m
    WHERE m.id = p_marche_id
  ),
  snap_rows AS (
    SELECT c.marche_id, c.m_lat, c.m_lon, c.radius_m, bs.radius_meters AS snap_radius, sp
    FROM public.biodiversity_snapshots bs
    JOIN ctx c ON c.marche_id = bs.marche_id,
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(bs.species_data) = 'array' THEN bs.species_data ELSE '[]'::jsonb END
    ) AS sp
  ),
  snap_species AS (
    SELECT
      lower(extensions.unaccent(trim(coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name', '')))) AS key,
      coalesce(sr.sp->>'kingdom', 'Unknown') AS kingdom
    FROM snap_rows sr
    WHERE
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array' THEN sr.sp->'attributions' ELSE '[]'::jsonb END
        ) AS att
        WHERE (att->>'exactLatitude') IS NOT NULL AND (att->>'exactLongitude') IS NOT NULL
          AND public.haversine_m(sr.m_lat, sr.m_lon,
                (att->>'exactLatitude')::numeric, (att->>'exactLongitude')::numeric) <= sr.radius_m
      )
      OR (
        (sr.sp->>'exactLatitude') IS NOT NULL AND (sr.sp->>'exactLongitude') IS NOT NULL
        AND public.haversine_m(sr.m_lat, sr.m_lon,
              (sr.sp->>'exactLatitude')::numeric, (sr.sp->>'exactLongitude')::numeric) <= sr.radius_m
      )
      OR (
        NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array' THEN sr.sp->'attributions' ELSE '[]'::jsonb END
          ) AS a2 WHERE (a2->>'exactLatitude') IS NOT NULL AND (a2->>'exactLongitude') IS NOT NULL
        )
        AND (sr.sp->>'exactLatitude') IS NULL
        AND sr.radius_m >= COALESCE(sr.snap_radius, 500)
      )
  ),
  marcheur_species AS (
    SELECT
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS key,
      'Unknown'::text AS kingdom
    FROM public.marcheur_observations mo
    JOIN ctx c ON c.marche_id = mo.marche_id
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND (mo.latitude IS NULL OR mo.longitude IS NULL
           OR public.haversine_m(c.m_lat, c.m_lon, mo.latitude, mo.longitude) <= c.radius_m)
  ),
  unioned AS (
    SELECT key, kingdom FROM snap_species WHERE key <> ''
    UNION
    SELECT key, kingdom FROM marcheur_species WHERE key <> ''
  ),
  grouped AS (
    SELECT key, coalesce(max(kingdom) FILTER (WHERE kingdom <> 'Unknown'), 'Unknown') AS kingdom
    FROM unioned GROUP BY key
  )
  SELECT jsonb_build_object(
    'marche_id', p_marche_id,
    'radius_m', (SELECT radius_m FROM ctx),
    'total', (SELECT count(*) FROM grouped),
    'by_kingdom', jsonb_build_object(
      'animalia', (SELECT count(*) FROM grouped WHERE kingdom = 'Animalia'),
      'plantae',  (SELECT count(*) FROM grouped WHERE kingdom = 'Plantae'),
      'fungi',    (SELECT count(*) FROM grouped WHERE kingdom = 'Fungi'),
      'others',   (SELECT count(*) FROM grouped WHERE kingdom NOT IN ('Animalia','Plantae','Fungi'))
    )
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marche_species_count(uuid) TO anon, authenticated;

-- 3. Batch helper: per-marche counts for a list of marche ids (used by global lists)
CREATE OR REPLACE FUNCTION public.get_marches_species_counts(p_marche_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'marche_id', mid,
    'species_count', (public.get_marche_species_count(mid)->>'total')::int
  )), '[]'::jsonb)
  FROM unnest(p_marche_ids) AS mid;
$$;

GRANT EXECUTE ON FUNCTION public.get_marches_species_counts(uuid[]) TO anon, authenticated;