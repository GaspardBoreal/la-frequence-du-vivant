CREATE OR REPLACE FUNCTION public.get_exploration_species_export(p_exploration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
      coalesce(sr.sp->>'commonName', sr.sp->>'common_name', '') AS common_name,
      coalesce(sr.sp->>'kingdom', 'Unknown') AS kingdom,
      coalesce(sr.sp->>'rank', sr.sp->>'taxonRank', '') AS rank,
      sr.sp AS raw
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
  snap_attributions AS (
    SELECT
      ss.key,
      att->>'observer_login' AS observer,
      COALESCE(att->>'observed_on', att->>'observedOn') AS observed_on,
      round(COALESCE((att->>'exactLatitude')::numeric, 0), 4) AS lat4,
      round(COALESCE((att->>'exactLongitude')::numeric, 0), 4) AS lon4
    FROM snap_species ss,
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(ss.raw->'attributions') = 'array'
           THEN ss.raw->'attributions' ELSE '[]'::jsonb END
    ) AS att
    WHERE ss.key <> ''
  ),
  snap_obs_dedup AS (
    SELECT key,
           count(DISTINCT (observer, observed_on, lat4, lon4)) AS obs_count,
           min(observed_on) FILTER (WHERE observed_on IS NOT NULL AND observed_on <> '') AS first_seen,
           max(observed_on) FILTER (WHERE observed_on IS NOT NULL AND observed_on <> '') AS last_seen
    FROM snap_attributions
    GROUP BY key
  ),
  marcheur_species AS (
    SELECT
      mc.marche_id,
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS key,
      mo.species_scientific_name AS sci,
      coalesce(mo.taxon_common_name_fr, '') AS common_name,
      coalesce(mo.kingdom, 'Unknown') AS kingdom,
      mo.id AS obs_id,
      mo.observation_date::text AS observed_on
    FROM public.marcheur_observations mo
    JOIN marche_ctx mc USING (marche_id)
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND (
        mo.latitude IS NULL OR mo.longitude IS NULL
        OR public.haversine_m(mc.m_lat, mc.m_lon, mo.latitude, mo.longitude) <= mc.radius_m
      )
  ),
  marcheur_obs_dedup AS (
    SELECT key,
           count(DISTINCT obs_id) AS obs_count,
           min(observed_on) FILTER (WHERE observed_on IS NOT NULL) AS first_seen,
           max(observed_on) FILTER (WHERE observed_on IS NOT NULL) AS last_seen
    FROM marcheur_species
    WHERE key <> ''
    GROUP BY key
  ),
  meta AS (
    SELECT
      key,
      max(sci) FILTER (WHERE sci IS NOT NULL AND sci <> '') AS sci,
      max(common_name) FILTER (WHERE common_name IS NOT NULL AND common_name <> '') AS common_name,
      coalesce(max(kingdom) FILTER (WHERE kingdom <> 'Unknown'), 'Unknown') AS kingdom,
      max(rank) FILTER (WHERE rank IS NOT NULL AND rank <> '') AS rank,
      bool_or(source = 'snapshot') AS in_snapshot,
      bool_or(source = 'marcheur') AS in_marcheur
    FROM (
      SELECT key, sci, common_name, kingdom, rank, 'snapshot'::text AS source FROM snap_species WHERE key <> ''
      UNION ALL
      SELECT key, sci, common_name, kingdom, ''::text AS rank, 'marcheur'::text AS source FROM marcheur_species WHERE key <> ''
    ) u
    GROUP BY key
  ),
  final AS (
    SELECT
      m.key,
      m.sci,
      m.common_name,
      m.kingdom,
      m.rank,
      m.in_snapshot,
      m.in_marcheur,
      COALESCE(s.obs_count, 0) + COALESCE(x.obs_count, 0) AS obs_count,
      LEAST(NULLIF(s.first_seen, ''), NULLIF(x.first_seen, '')) AS first_seen,
      GREATEST(NULLIF(s.last_seen, ''), NULLIF(x.last_seen, '')) AS last_seen
    FROM meta m
    LEFT JOIN snap_obs_dedup s USING (key)
    LEFT JOIN marcheur_obs_dedup x USING (key)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM final),
    'by_kingdom', jsonb_build_object(
      'animalia', (SELECT count(*) FROM final WHERE kingdom = 'Animalia'),
      'plantae',  (SELECT count(*) FROM final WHERE kingdom = 'Plantae'),
      'fungi',    (SELECT count(*) FROM final WHERE kingdom = 'Fungi'),
      'others',   (SELECT count(*) FROM final WHERE kingdom NOT IN ('Animalia','Plantae','Fungi'))
    ),
    'by_source', jsonb_build_object(
      'snapshots_only', (SELECT count(*) FROM final WHERE in_snapshot AND NOT in_marcheur),
      'marcheur_only',  (SELECT count(*) FROM final WHERE in_marcheur AND NOT in_snapshot),
      'both',           (SELECT count(*) FROM final WHERE in_snapshot AND in_marcheur)
    ),
    'species', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'sci', sci,
          'common_name', common_name,
          'kingdom', kingdom,
          'rank', rank,
          'obs_count', obs_count,
          'first_seen', first_seen,
          'last_seen', last_seen,
          'in_snapshot', in_snapshot,
          'in_marcheur', in_marcheur
        )
        ORDER BY obs_count DESC NULLS LAST, sci
      )
      FROM final
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_exploration_species_export(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exploration_species_export(uuid) TO service_role;