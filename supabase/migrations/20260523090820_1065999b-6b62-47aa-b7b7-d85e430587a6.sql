
CREATE OR REPLACE FUNCTION public.get_exploration_export_data(
  p_exploration_id uuid,
  p_level text DEFAULT 'public'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exploration jsonb;
  v_marche_ids uuid[];
  v_observations jsonb;
  v_species jsonb;
  v_metadata jsonb;
  v_anonymize boolean;
BEGIN
  v_anonymize := (p_level = 'public');

  SELECT to_jsonb(e.*) INTO v_exploration
  FROM explorations e
  WHERE e.id = p_exploration_id;

  IF v_exploration IS NULL THEN
    RETURN jsonb_build_object('error', 'exploration_not_found');
  END IF;

  SELECT array_agg(marche_id) INTO v_marche_ids
  FROM exploration_marches
  WHERE exploration_id = p_exploration_id;

  IF v_marche_ids IS NULL OR array_length(v_marche_ids, 1) = 0 THEN
    RETURN jsonb_build_object(
      'exploration', v_exploration,
      'observations', '[]'::jsonb,
      'species', '[]'::jsonb,
      'metadata', jsonb_build_object('generated_at', now(), 'level', p_level)
    );
  END IF;

  WITH marcheur_obs AS (
    SELECT
      'marcheur'::text AS source,
      mo.id::text AS observation_id,
      lower(trim(mo.species_scientific_name)) AS sci_key,
      mo.species_scientific_name AS scientific_name,
      mo.observation_date::text AS observation_date,
      mo.latitude,
      mo.longitude,
      mo.photo_url,
      mo.notes,
      mo.inaturalist_observation_id,
      mo.marche_id,
      CASE
        WHEN v_anonymize THEN 'Marcheur·euse anonyme'
        ELSE COALESCE(NULLIF(trim(coalesce(cp.prenom,'') || ' ' || coalesce(cp.nom,'')), ''), 'Marcheur·euse')
      END AS observer_name,
      CASE WHEN v_anonymize THEN NULL ELSE mo.marcheur_id::text END AS observer_id
    FROM marcheur_observations mo
    LEFT JOIN community_profiles cp ON cp.user_id = mo.marcheur_id
    WHERE mo.marche_id = ANY(v_marche_ids)
  ),
  snapshot_obs AS (
    SELECT
      'inaturalist'::text AS source,
      COALESCE((sp->>'id')::text, (sp->>'inaturalistId')::text, gen_random_uuid()::text) AS observation_id,
      lower(trim(COALESCE(sp->>'scientificName', sp->>'scientific_name'))) AS sci_key,
      COALESCE(sp->>'scientificName', sp->>'scientific_name') AS scientific_name,
      COALESCE(sp->>'observationDate', sp->>'observation_date', bs.snapshot_date::text) AS observation_date,
      COALESCE((sp->>'latitude')::numeric, bs.latitude) AS latitude,
      COALESCE((sp->>'longitude')::numeric, bs.longitude) AS longitude,
      COALESCE(sp->>'photoUrl', sp->>'photo_url', sp->>'imageUrl') AS photo_url,
      sp->>'commonName' AS notes,
      NULLIF((sp->>'inaturalistId'), '')::bigint AS inaturalist_observation_id,
      bs.marche_id,
      CASE
        WHEN v_anonymize THEN 'Observateur iNaturalist'
        ELSE COALESCE(sp->>'observer', 'Observateur iNaturalist')
      END AS observer_name,
      NULL::text AS observer_id
    FROM biodiversity_snapshots bs
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(bs.species_data, '[]'::jsonb)) sp
    WHERE bs.marche_id = ANY(v_marche_ids)
      AND COALESCE(sp->>'scientificName', sp->>'scientific_name') IS NOT NULL
  ),
  all_obs AS (
    SELECT * FROM marcheur_obs
    UNION ALL
    SELECT * FROM snapshot_obs
  )
  SELECT jsonb_agg(to_jsonb(o.*)) INTO v_observations FROM all_obs o WHERE o.sci_key IS NOT NULL AND o.sci_key <> '';

  WITH all_obs AS (
    SELECT
      lower(trim(mo.species_scientific_name)) AS sci_key,
      mo.species_scientific_name AS scientific_name,
      mo.observation_date,
      mo.latitude, mo.longitude,
      'marcheur' AS source,
      mo.marcheur_id::text AS observer
    FROM marcheur_observations mo
    WHERE mo.marche_id = ANY(v_marche_ids)
    UNION ALL
    SELECT
      lower(trim(COALESCE(sp->>'scientificName', sp->>'scientific_name'))) AS sci_key,
      COALESCE(sp->>'scientificName', sp->>'scientific_name') AS scientific_name,
      COALESCE((sp->>'observationDate')::date, (sp->>'observation_date')::date, bs.snapshot_date),
      COALESCE((sp->>'latitude')::numeric, bs.latitude),
      COALESCE((sp->>'longitude')::numeric, bs.longitude),
      'inaturalist',
      COALESCE(sp->>'observer', 'inat')
    FROM biodiversity_snapshots bs
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(bs.species_data, '[]'::jsonb)) sp
    WHERE bs.marche_id = ANY(v_marche_ids)
      AND COALESCE(sp->>'scientificName', sp->>'scientific_name') IS NOT NULL
  )
  SELECT jsonb_agg(s.*) INTO v_species
  FROM (
    SELECT
      sci_key,
      MIN(scientific_name) AS scientific_name,
      COUNT(*) AS observation_count,
      COUNT(DISTINCT observer) AS observer_count,
      MIN(observation_date)::text AS first_observation,
      MAX(observation_date)::text AS last_observation,
      AVG(latitude) FILTER (WHERE latitude IS NOT NULL) AS centroid_lat,
      AVG(longitude) FILTER (WHERE longitude IS NOT NULL) AS centroid_lng,
      array_agg(DISTINCT source) AS sources
    FROM all_obs
    WHERE sci_key IS NOT NULL AND sci_key <> ''
    GROUP BY sci_key
    ORDER BY observation_count DESC
  ) s;

  v_metadata := jsonb_build_object(
    'generated_at', now(),
    'level', p_level,
    'marche_count', array_length(v_marche_ids, 1),
    'marche_ids', to_jsonb(v_marche_ids),
    'pack_version', '1.0'
  );

  RETURN jsonb_build_object(
    'exploration', v_exploration,
    'observations', COALESCE(v_observations, '[]'::jsonb),
    'species', COALESCE(v_species, '[]'::jsonb),
    'metadata', v_metadata
  );
END;
$$;
