
-- ============================================================
-- 1) RPC: get_exploration_species_pool(exploration_id)
--    Source unique de vérité pour la liste d'espèces d'une exploration.
--    Mêmes règles de filtrage que get_exploration_species_count :
--    - fusion biodiversity_snapshots ∪ marcheur_observations
--    - filtre rayon strict (GPS attribution iNat OU GPS marcheur ≤ radius_m)
--    - fallback legacy si aucune coord disponible
--    - dedup par lower(unaccent(scientificName))
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_exploration_species_pool(p_exploration_id uuid)
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
  -- ───────────── Snapshots iNat (filtrés rayon) ─────────────
  snap_rows AS (
    SELECT
      mc.marche_id, mc.m_lat, mc.m_lon, mc.radius_m,
      bs.snapshot_date,
      bs.radius_meters AS snap_radius,
      sp
    FROM public.biodiversity_snapshots bs
    JOIN marche_ctx mc USING (marche_id),
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(bs.species_data) = 'array' THEN bs.species_data ELSE '[]'::jsonb END
    ) AS sp
  ),
  snap_kept AS (
    SELECT sr.*
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
  snap_species AS (
    SELECT
      lower(extensions.unaccent(trim(coalesce(sp->>'scientificName', sp->>'scientific_name', '')))) AS key,
      coalesce(sp->>'scientificName', sp->>'scientific_name') AS sci,
      coalesce(sp->>'commonName', sp->>'common_name') AS com,
      coalesce(sp->>'kingdom', 'Unknown') AS kingdom,
      NULLIF(sp->>'family', '') AS family,
      NULLIF(sp->>'iconicTaxon', '') AS iconic_taxon,
      sp->'photos' AS photos,
      sp->'attributions' AS attributions,
      snapshot_date,
      marche_id
    FROM snap_kept
  ),
  -- ───────────── Marcheur observations (filtrées rayon) ─────────────
  marcheur_species AS (
    SELECT
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS key,
      mo.species_scientific_name AS sci,
      NULL::text AS com,
      'Unknown'::text AS kingdom,
      NULL::text AS family,
      NULL::text AS iconic_taxon,
      mo.photo_url,
      mo.observation_date,
      mo.latitude,
      mo.longitude,
      mo.inaturalist_observation_id,
      mo.marche_id,
      mo.marcheur_id
    FROM public.marcheur_observations mo
    JOIN marche_ctx mc USING (marche_id)
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND (
        mo.latitude IS NULL OR mo.longitude IS NULL
        OR public.haversine_m(mc.m_lat, mc.m_lon, mo.latitude, mo.longitude) <= mc.radius_m
      )
  ),
  -- ───────────── Agrégation par espèce ─────────────
  snap_grouped AS (
    SELECT
      key,
      max(sci) FILTER (WHERE sci IS NOT NULL) AS sci,
      max(com) FILTER (WHERE com IS NOT NULL) AS com,
      max(kingdom) FILTER (WHERE kingdom <> 'Unknown') AS kingdom,
      max(family) FILTER (WHERE family IS NOT NULL) AS family,
      max(iconic_taxon) FILTER (WHERE iconic_taxon IS NOT NULL) AS iconic_taxon,
      count(*)::int AS snap_obs,
      max(snapshot_date) AS last_snapshot,
      jsonb_agg(DISTINCT photos) FILTER (WHERE photos IS NOT NULL) AS all_photos,
      jsonb_agg(attributions) FILTER (WHERE attributions IS NOT NULL) AS all_attributions
    FROM snap_species
    WHERE key <> ''
    GROUP BY key
  ),
  marcheur_grouped AS (
    SELECT
      key,
      max(sci) FILTER (WHERE sci IS NOT NULL) AS sci,
      count(*)::int AS m_obs,
      max(observation_date) AS last_obs_date,
      jsonb_agg(jsonb_build_object(
        'photo_url', photo_url,
        'observation_date', observation_date,
        'latitude', latitude,
        'longitude', longitude,
        'inaturalist_id', inaturalist_observation_id,
        'marcheur_id', marcheur_id,
        'marche_id', marche_id
      ) ORDER BY observation_date DESC) AS marcheur_attrs
    FROM marcheur_species
    WHERE key <> ''
    GROUP BY key
  ),
  combined AS (
    SELECT
      COALESCE(sg.key, mg.key) AS key,
      COALESCE(sg.sci, mg.sci) AS scientific_name,
      sg.com AS common_name,
      COALESCE(sg.kingdom, 'Unknown') AS kingdom,
      sg.family,
      sg.iconic_taxon,
      COALESCE(sg.snap_obs, 0) + COALESCE(mg.m_obs, 0) AS observations,
      sg.key IS NOT NULL AS in_snapshot,
      mg.key IS NOT NULL AS in_marcheur,
      GREATEST(
        COALESCE(sg.last_snapshot::date, '1900-01-01'::date),
        COALESCE(mg.last_obs_date, '1900-01-01'::date)
      ) AS last_seen,
      sg.all_photos,
      sg.all_attributions,
      mg.marcheur_attrs
    FROM snap_grouped sg
    FULL OUTER JOIN marcheur_grouped mg USING (key)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM combined),
    'species', COALESCE(jsonb_agg(
      jsonb_build_object(
        'key', key,
        'scientific_name', scientific_name,
        'common_name', common_name,
        'kingdom', kingdom,
        'family', family,
        'iconic_taxon', iconic_taxon,
        'observations', observations,
        'in_snapshot', in_snapshot,
        'in_marcheur', in_marcheur,
        'last_seen', last_seen,
        'photos', all_photos,
        'attributions', all_attributions,
        'marcheur_attrs', marcheur_attrs
      ) ORDER BY observations DESC, scientific_name ASC
    ), '[]'::jsonb)
  )
  INTO result
  FROM combined;

  RETURN COALESCE(result, jsonb_build_object('total', 0, 'species', '[]'::jsonb));
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_exploration_species_pool(uuid) TO authenticated, anon, service_role;


-- ============================================================
-- 2) RPC: get_exploration_species_timeline(exploration_id, date_source)
--    Courbe « Pouls du vivant » alignée avec le pool unifié.
--    Bucketise par jour les attributions iNat (date) ∪
--    marcheur_observations.observation_date.
--    Param date_source : 'observation' (défaut) | 'collection'
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_exploration_species_timeline(
  p_exploration_id uuid,
  p_date_source text DEFAULT 'observation'
)
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
    SELECT mc.marche_id, mc.m_lat, mc.m_lon, mc.radius_m,
           bs.snapshot_date, bs.radius_meters AS snap_radius, sp
    FROM public.biodiversity_snapshots bs
    JOIN marche_ctx mc USING (marche_id),
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(bs.species_data) = 'array' THEN bs.species_data ELSE '[]'::jsonb END
    ) AS sp
  ),
  snap_kept AS (
    SELECT sr.*
    FROM snap_rows sr
    WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array'
               THEN sr.sp->'attributions' ELSE '[]'::jsonb END
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
        NOT EXISTS (SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array'
                 THEN sr.sp->'attributions' ELSE '[]'::jsonb END
          ) AS a2 WHERE (a2->>'exactLatitude') IS NOT NULL)
        AND (sr.sp->>'exactLatitude') IS NULL
        AND sr.radius_m >= COALESCE(sr.snap_radius, 500)
      )
  ),
  -- Déplier toutes les dates d'observation des snapshots
  snap_obs AS (
    SELECT
      lower(extensions.unaccent(trim(coalesce(sp->>'scientificName','')))) AS key,
      CASE
        WHEN p_date_source = 'observation' THEN
          COALESCE((att->>'date')::date, snapshot_date::date)
        ELSE snapshot_date::date
      END AS bucket_date,
      'inat'::text AS source
    FROM snap_kept,
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(sp->'attributions') = 'array' THEN sp->'attributions' ELSE '[null]'::jsonb END
    ) AS att
    WHERE coalesce(sp->>'scientificName','') <> ''
  ),
  marcheur_obs AS (
    SELECT
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name,'')))) AS key,
      mo.observation_date::date AS bucket_date,
      'marcheur'::text AS source
    FROM public.marcheur_observations mo
    JOIN marche_ctx mc USING (marche_id)
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND mo.observation_date IS NOT NULL
      AND (mo.latitude IS NULL OR mo.longitude IS NULL
           OR public.haversine_m(mc.m_lat, mc.m_lon, mo.latitude, mo.longitude) <= mc.radius_m)
  ),
  all_obs AS (
    SELECT * FROM snap_obs WHERE bucket_date IS NOT NULL AND key <> ''
    UNION ALL
    SELECT * FROM marcheur_obs WHERE bucket_date IS NOT NULL AND key <> ''
  ),
  first_seen_per_species AS (
    SELECT key, min(bucket_date) AS first_day
    FROM all_obs
    GROUP BY key
  ),
  daily AS (
    SELECT
      bucket_date,
      count(*)::int AS observations,
      count(DISTINCT key)::int AS species_count,
      count(*) FILTER (WHERE source = 'marcheur')::int AS marcheur_obs,
      count(*) FILTER (WHERE source = 'inat')::int AS inat_obs
    FROM all_obs
    GROUP BY bucket_date
  ),
  daily_new AS (
    SELECT first_day AS bucket_date, count(*)::int AS new_species
    FROM first_seen_per_species
    GROUP BY first_day
  ),
  series AS (
    SELECT
      d.bucket_date,
      d.observations,
      d.species_count,
      COALESCE(n.new_species, 0) AS new_species,
      d.marcheur_obs,
      d.inat_obs
    FROM daily d
    LEFT JOIN daily_new n USING (bucket_date)
    ORDER BY d.bucket_date
  )
  SELECT jsonb_build_object(
    'date_source', p_date_source,
    'first_date', (SELECT min(bucket_date) FROM all_obs),
    'last_date',  (SELECT max(bucket_date) FROM all_obs),
    'total_species', (SELECT count(*) FROM first_seen_per_species),
    'total_observations', (SELECT count(*) FROM all_obs),
    'series', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', bucket_date,
        'observations', observations,
        'species_count', species_count,
        'new_species', new_species,
        'marcheur_obs', marcheur_obs,
        'inat_obs', inat_obs
      ) ORDER BY bucket_date)
      FROM series
    ), '[]'::jsonb)
  )
  INTO result;

  RETURN COALESCE(result, jsonb_build_object(
    'date_source', p_date_source, 'total_species', 0, 'total_observations', 0, 'series', '[]'::jsonb
  ));
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_exploration_species_timeline(uuid, text) TO authenticated, anon, service_role;
