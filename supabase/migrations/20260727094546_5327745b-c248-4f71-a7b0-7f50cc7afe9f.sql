-- Clé de ciblage d'une attribution de snapshot (miroir exact de la logique client)
CREATE OR REPLACE FUNCTION public.gps_override_attr_key(_sci text, _att jsonb)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT COALESCE(
    NULLIF(_att->>'originalUrl', ''),
    lower(extensions.unaccent(trim(coalesce(_sci, '')))) || '|' ||
    to_char((_att->>'exactLatitude')::numeric, 'FM999990.00000') || '|' ||
    to_char((_att->>'exactLongitude')::numeric, 'FM999990.00000')
  );
$$;

GRANT EXECUTE ON FUNCTION public.gps_override_attr_key(text, jsonb) TO anon, authenticated, service_role;

-- ---------- get_exploration_species_pool (overrides appliqués côté base) ----------
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
          AND public.haversine_m(sr.m_lat, sr.m_lon,
                (att->>'exactLatitude')::numeric,
                (att->>'exactLongitude')::numeric) <= sr.radius_m
      )
      OR (
        (sr.sp->>'exactLatitude') IS NOT NULL AND (sr.sp->>'exactLongitude') IS NOT NULL
        AND public.haversine_m(sr.m_lat, sr.m_lon,
              (sr.sp->>'exactLatitude')::numeric,
              (sr.sp->>'exactLongitude')::numeric) <= sr.radius_m
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
  -- Application des corrections éditoriales sur les attributions iNaturalist
  snap_fixed AS (
    SELECT
      sk.*,
      af.attrs        AS fixed_attributions,
      af.excluded_n   AS attr_excluded_n,
      af.total_n      AS attr_total_n
    FROM snap_kept sk
    LEFT JOIN LATERAL (
      SELECT
        jsonb_agg(
          CASE
            WHEN ov.id IS NULL THEN att
            ELSE att
              || jsonb_build_object(
                   'gpsOverrideStatus', ov.status,
                   'gpsOverrideReason', ov.reason,
                   'originalLatitude',  COALESCE(ov.original_lat, (att->>'exactLatitude')::numeric),
                   'originalLongitude', COALESCE(ov.original_lon, (att->>'exactLongitude')::numeric)
                 )
              || CASE
                   WHEN ov.status = 'repositioned' AND ov.lat IS NOT NULL AND ov.lon IS NOT NULL
                   THEN jsonb_build_object('exactLatitude', ov.lat, 'exactLongitude', ov.lon)
                   ELSE '{}'::jsonb
                 END
          END
        ) FILTER (WHERE ov.status IS DISTINCT FROM 'excluded') AS attrs,
        count(*) FILTER (WHERE ov.status = 'excluded')::int AS excluded_n,
        count(*)::int AS total_n
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(sk.sp->'attributions') = 'array'
             THEN sk.sp->'attributions' ELSE '[]'::jsonb END
      ) AS att
      LEFT JOIN public.observation_gps_overrides ov
        ON ov.target_kind = 'snapshot_attr'
       AND ov.target_key = public.gps_override_attr_key(
             coalesce(sk.sp->>'scientificName', sk.sp->>'scientific_name', ''), att)
    ) af ON true
    -- une espèce dont toutes les attributions sont écartées disparaît du pool
    WHERE NOT (COALESCE(af.total_n, 0) > 0 AND af.attrs IS NULL)
  ),
  snap_species_raw AS (
    SELECT
      sk.marche_id,
      lower(extensions.unaccent(trim(coalesce(sk.sp->>'scientificName', sk.sp->>'scientific_name', '')))) AS raw_key,
      coalesce(sk.sp->>'scientificName', sk.sp->>'scientific_name') AS raw_sci,
      coalesce(sk.sp->>'commonName', sk.sp->>'common_name') AS raw_com,
      coalesce(sk.sp->>'kingdom', 'Unknown') AS kingdom,
      NULLIF(sk.sp->>'family', '') AS family,
      NULLIF(sk.sp->>'iconicTaxon', '') AS iconic_taxon,
      sk.sp->'photos' AS photos,
      sk.fixed_attributions AS attributions,
      sk.snapshot_date
    FROM snap_fixed sk
  ),
  snap_species AS (
    SELECT
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), ssr.raw_key) AS key,
      COALESCE(al.canonical_scientific_name, ssr.raw_sci) AS sci,
      COALESCE(al.canonical_common_name_fr, ssr.raw_com) AS com,
      ssr.kingdom, ssr.family, ssr.iconic_taxon, ssr.photos, ssr.attributions,
      ssr.snapshot_date, ssr.marche_id
    FROM snap_species_raw ssr
    LEFT JOIN LATERAL (
      SELECT a.canonical_scientific_name, a.canonical_common_name_fr
      FROM public.species_taxonomy_aliases a
      WHERE (a.marche_id = ssr.marche_id OR a.marche_id IS NULL)
        AND (
          a.alias_key = ssr.raw_key
          OR a.alias_key = lower(extensions.unaccent(trim(coalesce(ssr.raw_com,''))))
        )
      ORDER BY (a.marche_id IS NOT NULL) DESC
      LIMIT 1
    ) al ON true
  ),
  marcheur_all AS (
    SELECT
      mc.marche_id,
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS raw_key,
      mo.species_scientific_name AS raw_sci,
      mo.taxon_common_name_fr AS raw_com,
      mo.photo_url,
      mo.observation_date,
      COALESCE(
        CASE WHEN ov.status = 'repositioned' THEN ov.lat ELSE NULL END, mo.latitude
      ) AS latitude,
      COALESCE(
        CASE WHEN ov.status = 'repositioned' THEN ov.lon ELSE NULL END, mo.longitude
      ) AS longitude,
      ov.status AS override_status,
      ov.reason AS override_reason,
      ov.original_lat, ov.original_lon,
      mo.inaturalist_observation_id, mo.marcheur_id,
      mo.id AS obs_id,
      mo.positional_accuracy, mo.obscured, mo.gps_source,
      mc.m_lat, mc.m_lon, mc.radius_m
    FROM public.marcheur_observations mo
    JOIN marche_ctx mc USING (marche_id)
    LEFT JOIN public.observation_gps_overrides ov
      ON ov.target_kind = 'observation' AND ov.target_key = mo.id::text
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
  ),
  marcheur_species_raw AS (
    SELECT * FROM marcheur_all ma
    WHERE ma.override_status IS DISTINCT FROM 'excluded'
      AND (
        ma.latitude IS NULL OR ma.longitude IS NULL
        OR public.haversine_m(ma.m_lat, ma.m_lon, ma.latitude, ma.longitude) <= ma.radius_m
      )
  ),
  marcheur_species AS (
    SELECT
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), msr.raw_key) AS key,
      COALESCE(al.canonical_scientific_name, msr.raw_sci) AS sci,
      msr.photo_url, msr.observation_date, msr.latitude, msr.longitude,
      msr.inaturalist_observation_id, msr.marche_id, msr.marcheur_id,
      msr.obs_id, msr.positional_accuracy, msr.obscured, msr.gps_source,
      msr.override_status, msr.override_reason, msr.original_lat, msr.original_lon
    FROM marcheur_species_raw msr
    LEFT JOIN LATERAL (
      SELECT a.canonical_scientific_name
      FROM public.species_taxonomy_aliases a
      WHERE (a.marche_id = msr.marche_id OR a.marche_id IS NULL)
        AND (
          a.alias_key = msr.raw_key
          OR a.alias_key = lower(extensions.unaccent(trim(coalesce(msr.raw_com,''))))
        )
      ORDER BY (a.marche_id IS NOT NULL) DESC
      LIMIT 1
    ) al ON true
  ),
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
        'obs_id', obs_id,
        'photo_url', photo_url,
        'observation_date', observation_date,
        'latitude', latitude,
        'longitude', longitude,
        'inaturalist_id', inaturalist_observation_id,
        'marcheur_id', marcheur_id,
        'marche_id', marche_id,
        'positional_accuracy', positional_accuracy,
        'obscured', obscured,
        'gps_source', gps_source,
        'gps_override_status', override_status,
        'gps_override_reason', override_reason,
        'original_latitude', original_lat,
        'original_longitude', original_lon
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
  ),
  curation AS (
    SELECT
      (SELECT count(*) FROM marcheur_all WHERE override_status = 'excluded')::int AS excluded_observations,
      (SELECT count(*) FROM marcheur_all WHERE override_status = 'repositioned')::int AS repositioned_observations,
      (SELECT count(*) FROM marcheur_all WHERE override_status = 'validated')::int AS validated_observations,
      (SELECT COALESCE(sum(attr_excluded_n), 0) FROM snap_fixed)::int AS excluded_attributions
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM combined),
    'curation', (SELECT to_jsonb(c) FROM curation c),
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

GRANT EXECUTE ON FUNCTION public.get_exploration_species_pool(uuid) TO anon, authenticated, service_role;

-- ---------- get_exploration_species_count (mêmes exclusions) ----------
CREATE OR REPLACE FUNCTION public.get_exploration_species_count(p_exploration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
  snap_species_raw AS (
    SELECT
      sr.marche_id,
      lower(extensions.unaccent(trim(coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name', '')))) AS raw_key,
      coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name') AS raw_sci,
      coalesce(sr.sp->>'commonName', sr.sp->>'common_name') AS raw_com,
      coalesce(sr.sp->>'kingdom', 'Unknown') AS kingdom
    FROM snap_rows sr
    WHERE
      (
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array'
                 THEN sr.sp->'attributions' ELSE '[]'::jsonb END
          ) AS att
          WHERE (att->>'exactLatitude')  IS NOT NULL
            AND (att->>'exactLongitude') IS NOT NULL
            AND public.haversine_m(sr.m_lat, sr.m_lon,
                  (att->>'exactLatitude')::numeric,
                  (att->>'exactLongitude')::numeric) <= sr.radius_m
        )
        OR (
          (sr.sp->>'exactLatitude') IS NOT NULL AND (sr.sp->>'exactLongitude') IS NOT NULL
          AND public.haversine_m(sr.m_lat, sr.m_lon,
                (sr.sp->>'exactLatitude')::numeric,
                (sr.sp->>'exactLongitude')::numeric) <= sr.radius_m
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
      )
      -- une espèce dont toutes les attributions ont été écartées ne compte plus
      AND NOT (
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array'
                 THEN sr.sp->'attributions' ELSE '[]'::jsonb END
          ) AS a3 WHERE true
        )
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array'
                 THEN sr.sp->'attributions' ELSE '[]'::jsonb END
          ) AS a4
          LEFT JOIN public.observation_gps_overrides ov
            ON ov.target_kind = 'snapshot_attr'
           AND ov.target_key = public.gps_override_attr_key(
                 coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name', ''), a4)
          WHERE ov.status IS DISTINCT FROM 'excluded'
        )
      )
  ),
  snap_species AS (
    SELECT
      ssr.marche_id,
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), ssr.raw_key) AS key,
      COALESCE(al.canonical_scientific_name, ssr.raw_sci) AS sci,
      ssr.kingdom
    FROM snap_species_raw ssr
    LEFT JOIN LATERAL (
      SELECT a.canonical_scientific_name
      FROM public.species_taxonomy_aliases a
      WHERE (a.marche_id = ssr.marche_id OR a.marche_id IS NULL)
        AND (
          a.alias_key = ssr.raw_key
          OR a.alias_key = lower(extensions.unaccent(trim(coalesce(ssr.raw_com,''))))
        )
      ORDER BY (a.marche_id IS NOT NULL) DESC
      LIMIT 1
    ) al ON true
  ),
  marcheur_species_raw AS (
    SELECT
      mc.marche_id,
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS raw_key,
      mo.species_scientific_name AS raw_sci,
      mo.taxon_common_name_fr AS raw_com,
      'Unknown'::text AS kingdom
    FROM public.marcheur_observations mo
    JOIN marche_ctx mc USING (marche_id)
    LEFT JOIN public.observation_gps_overrides ov
      ON ov.target_kind = 'observation' AND ov.target_key = mo.id::text
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND ov.status IS DISTINCT FROM 'excluded'
      AND (
        COALESCE(CASE WHEN ov.status = 'repositioned' THEN ov.lat END, mo.latitude) IS NULL
        OR COALESCE(CASE WHEN ov.status = 'repositioned' THEN ov.lon END, mo.longitude) IS NULL
        OR public.haversine_m(
             mc.m_lat, mc.m_lon,
             COALESCE(CASE WHEN ov.status = 'repositioned' THEN ov.lat END, mo.latitude),
             COALESCE(CASE WHEN ov.status = 'repositioned' THEN ov.lon END, mo.longitude)
           ) <= mc.radius_m
      )
  ),
  marcheur_species AS (
    SELECT
      msr.marche_id,
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), msr.raw_key) AS key,
      COALESCE(al.canonical_scientific_name, msr.raw_sci) AS sci,
      msr.kingdom
    FROM marcheur_species_raw msr
    LEFT JOIN LATERAL (
      SELECT a.canonical_scientific_name
      FROM public.species_taxonomy_aliases a
      WHERE (a.marche_id = msr.marche_id OR a.marche_id IS NULL)
        AND (
          a.alias_key = msr.raw_key
          OR a.alias_key = lower(extensions.unaccent(trim(coalesce(msr.raw_com,''))))
        )
      ORDER BY (a.marche_id IS NOT NULL) DESC
      LIMIT 1
    ) al ON true
  ),
  unioned AS (
    SELECT marche_id, key, sci, kingdom, 'snapshot'::text AS source FROM snap_species WHERE key <> ''
    UNION ALL
    SELECT marche_id, key, sci, kingdom, 'marcheur'::text AS source FROM marcheur_species WHERE key <> ''
  ),
  per_marche_species AS (
    SELECT DISTINCT marche_id, key FROM unioned
  ),
  by_marche AS (
    SELECT mc.marche_id,
           coalesce((SELECT count(*) FROM per_marche_species pms WHERE pms.marche_id = mc.marche_id), 0) AS species_count
    FROM marche_ctx mc
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

GRANT EXECUTE ON FUNCTION public.get_exploration_species_count(uuid) TO anon, authenticated, service_role;