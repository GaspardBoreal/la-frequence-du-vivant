
-- Helper: Haversine distance in meters
CREATE OR REPLACE FUNCTION public.haversine_m(
  lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric
) RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
  SELECT 2 * 6371000 * asin(
    sqrt(
      sin(radians(((lat2 - lat1)::float8) / 2))^2 +
      cos(radians(lat1::float8)) * cos(radians(lat2::float8)) *
      sin(radians(((lon2 - lon1)::float8) / 2))^2
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.haversine_m(numeric, numeric, numeric, numeric) TO anon, authenticated, service_role;

-- Rewrite: get_exploration_species_count to honor per-marche radius_m
-- Strategy: keep species only if at least one of its iNat attributions
-- (or its own exactLat/Long) falls within the resolved radius of its marche.
-- Fallback when no GPS data on the species: keep only if marche radius >= snapshot radius_meters.
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
      lower(extensions.unaccent(trim(coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name', '')))) AS key,
      coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name') AS sci,
      coalesce(sr.sp->>'kingdom', 'Unknown') AS kingdom
    FROM snap_rows sr
    WHERE
      -- (a) Au moins une attribution iNat dans le rayon
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
      -- (b) ou GPS direct sur l'espèce
      OR (
        (sr.sp->>'exactLatitude') IS NOT NULL AND (sr.sp->>'exactLongitude') IS NOT NULL
        AND public.haversine_m(
              sr.m_lat, sr.m_lon,
              (sr.sp->>'exactLatitude')::numeric,
              (sr.sp->>'exactLongitude')::numeric
            ) <= sr.radius_m
      )
      -- (c) fallback : aucune coord sur cette espèce → on garde si le rayon
      -- demandé est >= au rayon de collecte du snapshot (compat ancien)
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
    SELECT key, sci, kingdom, 'snapshot'::text AS source FROM snap_species WHERE key <> ''
    UNION ALL
    SELECT key, sci, kingdom, 'marcheur'::text AS source FROM marcheur_species WHERE key <> ''
  ),
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
    'species', coalesce((
      SELECT jsonb_agg(jsonb_build_object('sci', sci, 'kingdom', kingdom, 'in_snapshot', in_snapshot, 'in_marcheur', in_marcheur) ORDER BY sci)
      FROM grouped
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exploration_species_count(uuid) TO anon, authenticated;
