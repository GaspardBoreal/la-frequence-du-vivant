-- ============================================================
-- Étage 1 : propagation des alias taxonomiques côté SERVEUR
-- Rewrites : get_exploration_species_count, get_exploration_species_pool,
--            get_marche_species_count
-- Ajoute : trigger de migration douce des curations
-- ============================================================

-- ---------- get_exploration_species_count ----------
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
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND (
        mo.latitude IS NULL OR mo.longitude IS NULL
        OR public.haversine_m(mc.m_lat, mc.m_lon, mo.latitude, mo.longitude) <= mc.radius_m
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


-- ---------- get_exploration_species_pool ----------
CREATE OR REPLACE FUNCTION public.get_exploration_species_pool(p_exploration_id uuid)
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
      sk.sp->'attributions' AS attributions,
      sk.snapshot_date
    FROM snap_kept sk
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
  marcheur_species_raw AS (
    SELECT
      mc.marche_id,
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS raw_key,
      mo.species_scientific_name AS raw_sci,
      mo.taxon_common_name_fr AS raw_com,
      mo.photo_url,
      mo.observation_date,
      mo.latitude, mo.longitude,
      mo.inaturalist_observation_id, mo.marcheur_id
    FROM public.marcheur_observations mo
    JOIN marche_ctx mc USING (marche_id)
    WHERE mo.species_scientific_name IS NOT NULL
      AND trim(mo.species_scientific_name) <> ''
      AND (
        mo.latitude IS NULL OR mo.longitude IS NULL
        OR public.haversine_m(mc.m_lat, mc.m_lon, mo.latitude, mo.longitude) <= mc.radius_m
      )
  ),
  marcheur_species AS (
    SELECT
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), msr.raw_key) AS key,
      COALESCE(al.canonical_scientific_name, msr.raw_sci) AS sci,
      msr.photo_url, msr.observation_date, msr.latitude, msr.longitude,
      msr.inaturalist_observation_id, msr.marche_id, msr.marcheur_id
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
$$;

GRANT EXECUTE ON FUNCTION public.get_exploration_species_pool(uuid) TO authenticated, anon, service_role;


-- ---------- get_marche_species_count ----------
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
  snap_species_raw AS (
    SELECT
      sr.marche_id,
      lower(extensions.unaccent(trim(coalesce(sr.sp->>'scientificName', sr.sp->>'scientific_name', '')))) AS raw_key,
      coalesce(sr.sp->>'commonName', sr.sp->>'common_name') AS raw_com,
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
  snap_species AS (
    SELECT
      COALESCE(lower(extensions.unaccent(trim(al.canonical_scientific_name))), ssr.raw_key) AS key,
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
      c.marche_id,
      lower(extensions.unaccent(trim(coalesce(mo.species_scientific_name, '')))) AS raw_key,
      mo.taxon_common_name_fr AS raw_com,
      'Unknown'::text AS kingdom
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

GRANT EXECUTE ON FUNCTION public.get_marche_species_count(uuid) TO anon, authenticated, service_role;


-- ---------- Trigger : migration douce des curations existantes ----------
CREATE OR REPLACE FUNCTION public.propagate_taxonomy_alias_to_curations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_updated int := 0;
BEGIN
  -- Réattribue les curations pointant sur l'alias vers le canonical.
  -- Match sur entity_id normalisé (les entity_id sont des scientificName ou commonName).
  UPDATE public.exploration_curations c
  SET entity_id = NEW.canonical_scientific_name,
      updated_at = now()
  WHERE lower(extensions.unaccent(trim(c.entity_id))) = NEW.alias_key
    AND c.entity_type = 'species'
    AND (NEW.marche_id IS NULL OR c.marche_id = NEW.marche_id);
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    INSERT INTO public.admin_audit_log (action, target_type, target_id, metadata)
    VALUES (
      'taxonomy_alias_curation_migration',
      'exploration_curations',
      NEW.id,
      jsonb_build_object(
        'alias_key', NEW.alias_key,
        'canonical', NEW.canonical_scientific_name,
        'marche_id', NEW.marche_id,
        'curations_updated', v_updated
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ne bloque jamais l'insertion de l'alias si l'audit échoue
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS species_taxonomy_aliases_propagate ON public.species_taxonomy_aliases;
CREATE TRIGGER species_taxonomy_aliases_propagate
  AFTER INSERT OR UPDATE OF canonical_scientific_name ON public.species_taxonomy_aliases
  FOR EACH ROW EXECUTE FUNCTION public.propagate_taxonomy_alias_to_curations();