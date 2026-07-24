CREATE OR REPLACE FUNCTION public.get_propriete_biodiversity(p_propriete_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result jsonb;
BEGIN
  WITH linked_events AS (
    SELECT me.id, me.title, me.date_marche, me.exploration_id
    FROM public.propriete_marche_events pme
    JOIN public.marche_events me ON me.id = pme.marche_event_id
    WHERE pme.propriete_id = p_propriete_id
  ),
  linked_marches AS (
    SELECT DISTINCT em.marche_id
    FROM linked_events le
    JOIN public.exploration_marches em ON em.exploration_id = le.exploration_id
    WHERE le.exploration_id IS NOT NULL
  ),
  ctx AS (
    SELECT
      m.id AS marche_id,
      m.latitude AS m_lat,
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
    WHERE m.id IN (SELECT marche_id FROM linked_marches)
  ),
  snap_rows AS (
    SELECT c.marche_id, c.m_lat, c.m_lon, c.radius_m, bs.radius_meters AS snap_radius, sp
    FROM public.biodiversity_snapshots bs
    JOIN ctx c ON c.marche_id = bs.marche_id,
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(bs.species_data) = 'array' THEN bs.species_data ELSE '[]'::jsonb END
    ) AS sp
  ),
  snap_in_radius AS (
    SELECT sr.*
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
  snap_species_raw AS (
    SELECT
      sr.marche_id,
      lower(extensions.unaccent(trim(coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name', '')))) AS raw_key,
      coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name') AS sci,
      coalesce(sr.sp->>'commonName', sr.sp->>'common_name') AS raw_com,
      coalesce(sr.sp->>'kingdom', 'Unknown') AS kingdom
    FROM snap_in_radius sr
  ),
  snap_species AS (
    SELECT
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), ssr.raw_key) AS key,
      COALESCE(al.canonical_scientific_name, ssr.sci) AS sci,
      ssr.raw_com AS com,
      ssr.kingdom
    FROM snap_species_raw ssr
    LEFT JOIN LATERAL (
      SELECT a.canonical_scientific_name
      FROM public.species_taxonomy_aliases a
      WHERE (a.marche_id = ssr.marche_id OR a.marche_id IS NULL)
        AND (a.alias_key = ssr.raw_key
             OR a.alias_key = lower(extensions.unaccent(trim(coalesce(ssr.raw_com,'')))))
      ORDER BY (a.marche_id IS NOT NULL) DESC
      LIMIT 1
    ) al ON true
  ),
  marcheur_species_raw AS (
    SELECT
      c.marche_id,
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS raw_key,
      mo.species_scientific_name AS sci,
      mo.taxon_common_name_fr AS raw_com,
      COALESCE(mo.kingdom, 'Unknown') AS kingdom
    FROM public.marcheur_observations mo
    JOIN ctx c ON c.marche_id = mo.marche_id
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND (mo.latitude IS NULL OR mo.longitude IS NULL
           OR public.haversine_m(c.m_lat, c.m_lon, mo.latitude, mo.longitude) <= c.radius_m)
  ),
  marcheur_species AS (
    SELECT
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), msr.raw_key) AS key,
      COALESCE(al.canonical_scientific_name, msr.sci) AS sci,
      msr.raw_com AS com,
      msr.kingdom
    FROM marcheur_species_raw msr
    LEFT JOIN LATERAL (
      SELECT a.canonical_scientific_name
      FROM public.species_taxonomy_aliases a
      WHERE (a.marche_id = msr.marche_id OR a.marche_id IS NULL)
        AND (a.alias_key = msr.raw_key
             OR a.alias_key = lower(extensions.unaccent(trim(coalesce(msr.raw_com,'')))))
      ORDER BY (a.marche_id IS NOT NULL) DESC
      LIMIT 1
    ) al ON true
  ),
  unioned AS (
    SELECT key, sci, com, kingdom FROM snap_species WHERE key <> ''
    UNION ALL
    SELECT key, sci, com, kingdom FROM marcheur_species WHERE key <> ''
  ),
  per_species AS (
    SELECT
      key,
      (array_agg(sci ORDER BY (sci IS NOT NULL) DESC))[1] AS sci,
      (array_agg(com ORDER BY (com IS NOT NULL) DESC))[1] AS com,
      (array_agg(kingdom ORDER BY (kingdom <> 'Unknown') DESC))[1] AS kingdom,
      count(*) AS cnt
    FROM unioned
    GROUP BY key
  ),
  kingdoms_agg AS (
    SELECT jsonb_object_agg(kingdom, c) AS obj FROM (
      SELECT kingdom, count(*) AS c FROM per_species GROUP BY kingdom
    ) k
  ),
  top12 AS (
    SELECT jsonb_agg(jsonb_build_object(
      'scientific', sci, 'common', com, 'kingdom', kingdom, 'count', cnt
    ) ORDER BY cnt DESC) AS arr
    FROM (SELECT * FROM per_species ORDER BY cnt DESC LIMIT 12) t
  ),
  events_agg AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', id, 'title', title, 'date_marche', date_marche
    ) ORDER BY date_marche DESC NULLS LAST) AS arr,
    max(date_marche) AS last_date,
    count(*) AS ev_count
    FROM linked_events
  ),
  last_marcheur_obs AS (
    SELECT max(mo.observation_date::timestamptz) AS d
    FROM public.marcheur_observations mo
    JOIN ctx c ON c.marche_id = mo.marche_id
    WHERE mo.observation_date IS NOT NULL
      AND (mo.latitude IS NULL OR mo.longitude IS NULL
           OR public.haversine_m(c.m_lat, c.m_lon, mo.latitude, mo.longitude) <= c.radius_m)
  ),
  last_snap_sp_obs AS (
    SELECT max(v.date_text::timestamptz) AS d
    FROM snap_in_radius sr
    CROSS JOIN LATERAL (
      VALUES
        (NULLIF(sr.sp->>'lastSeen', '')),
        (NULLIF(sr.sp->>'last_seen', '')),
        (NULLIF(sr.sp->>'observationDate', '')),
        (NULLIF(sr.sp->>'observedDate', '')),
        (NULLIF(sr.sp->>'observedOn', '')),
        (NULLIF(sr.sp->>'lastObservedAt', '')),
        (NULLIF(sr.sp->>'observed_on', ''))
    ) AS v(date_text)
    WHERE v.date_text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}([T ][0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:?[0-9]{2})?)?$'
  ),
  last_snap_att_obs AS (
    SELECT max(v.date_text::timestamptz) AS d
    FROM snap_in_radius sr,
    LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(sr.sp->'attributions') = 'array' THEN sr.sp->'attributions' ELSE '[]'::jsonb END
    ) AS att
    CROSS JOIN LATERAL (
      VALUES
        (NULLIF(att->>'lastSeen', '')),
        (NULLIF(att->>'last_seen', '')),
        (NULLIF(att->>'observationDate', '')),
        (NULLIF(att->>'observedDate', '')),
        (NULLIF(att->>'observedOn', '')),
        (NULLIF(att->>'lastObservedAt', '')),
        (NULLIF(att->>'observed_on', ''))
    ) AS v(date_text)
    WHERE v.date_text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}([T ][0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:?[0-9]{2})?)?$'
  )
  SELECT jsonb_build_object(
    'events', COALESCE((SELECT arr FROM events_agg), '[]'::jsonb),
    'events_count', COALESCE((SELECT ev_count FROM events_agg), 0),
    'lastEventDate', (SELECT last_date FROM events_agg),
    'lastObservationDate', GREATEST(
      (SELECT d FROM last_marcheur_obs),
      (SELECT d FROM last_snap_sp_obs),
      (SELECT d FROM last_snap_att_obs)
    ),
    'speciesTotal', (SELECT count(*) FROM per_species),
    'kingdoms', COALESCE((SELECT obj FROM kingdoms_agg), '{}'::jsonb),
    'topSpecies', COALESCE((SELECT arr FROM top12), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_propriete_biodiversity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_propriete_biodiversity(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_propriete_biodiversity(uuid) TO service_role;