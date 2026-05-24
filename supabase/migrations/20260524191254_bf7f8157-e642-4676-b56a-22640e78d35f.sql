CREATE OR REPLACE FUNCTION public.get_event_scenography_data(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event public.marche_events%ROWTYPE;
  v_marche_ids uuid[];
  v_first_marche record;
  v_is_admin boolean := false;
  v_result jsonb;
BEGIN
  BEGIN
    v_is_admin := public.is_admin_user();
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := false;
  END;

  SELECT * INTO v_event
  FROM public.marche_events
  WHERE public_slug = _slug
    AND is_public = true
    AND (scenography_enabled = true OR v_is_admin)
  LIMIT 1;

  IF v_event.id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Marches liées à l'event via exploration
  SELECT COALESCE(array_agg(em.marche_id), ARRAY[]::uuid[])
    INTO v_marche_ids
  FROM public.exploration_marches em
  WHERE em.exploration_id = v_event.exploration_id;

  -- Première marche (pour lat/lng/lieu de fallback)
  SELECT m.latitude, m.longitude, m.nom_marche, m.ville, m.date
    INTO v_first_marche
  FROM public.exploration_marches em
  JOIN public.marches m ON m.id = em.marche_id
  WHERE em.exploration_id = v_event.exploration_id
  ORDER BY em.ordre NULLS LAST, m.date NULLS LAST
  LIMIT 1;

  WITH
    -- Dernier snapshot non quarantaine par marche
    latest_snap AS (
      SELECT DISTINCT ON (s.marche_id) s.marche_id, s.species_data
      FROM public.biodiversity_snapshots s
      WHERE s.marche_id = ANY(v_marche_ids)
        AND COALESCE(s.status, 'active') <> 'quarantine'
      ORDER BY s.marche_id, s.created_at DESC
    ),
    snap_species AS (
      SELECT
        lower(sp->>'scientificName') AS key,
        max(sp->>'scientificName') AS scientific_name,
        max(sp->>'commonName') AS common_name,
        max(sp->>'iconicTaxon') AS iconic_taxon,
        max(COALESCE(sp->'photoData'->>'url', sp->'photos'->>0)) AS photo_url,
        sum(GREATEST(COALESCE((sp->>'observations')::int, 1), 1)) AS obs_count
      FROM latest_snap, jsonb_array_elements(latest_snap.species_data) sp
      WHERE sp->>'scientificName' IS NOT NULL
      GROUP BY 1
    ),
    obs_species AS (
      SELECT
        lower(o.species_scientific_name) AS key,
        max(o.species_scientific_name) AS scientific_name,
        NULL::text AS common_name,
        NULL::text AS iconic_taxon,
        max(o.photo_url) AS photo_url,
        count(*)::bigint AS obs_count
      FROM public.marcheur_observations o
      WHERE o.marche_id = ANY(v_marche_ids)
        AND o.species_scientific_name IS NOT NULL
      GROUP BY 1
    ),
    fused_species AS (
      SELECT
        key,
        max(scientific_name) AS scientific_name,
        max(common_name) AS common_name,
        max(iconic_taxon) AS iconic_taxon,
        max(photo_url) AS photo_url,
        sum(obs_count) AS observations_count
      FROM (
        SELECT * FROM snap_species
        UNION ALL
        SELECT * FROM obs_species
      ) u
      GROUP BY key
    ),
    species_arr AS (
      SELECT jsonb_agg(jsonb_build_object(
        'scientific_name', scientific_name,
        'common_name', common_name,
        'iconic_taxon', iconic_taxon,
        'photo_url', photo_url,
        'observations_count', observations_count
      ) ORDER BY observations_count DESC) AS arr
      FROM fused_species
    ),
    photos_arr AS (
      SELECT jsonb_agg(jsonb_build_object(
        'url', COALESCE(m.url_fichier, m.external_url),
        'thumbnail_url', NULL,
        'caption', m.description,
        'latitude', NULLIF(m.metadata->>'latitude','')::float,
        'longitude', NULLIF(m.metadata->>'longitude','')::float,
        'taken_at', NULLIF(m.metadata->>'taken_at',''),
        'author', COALESCE(
          NULLIF(trim(concat_ws(' ', cp.prenom, cp.nom)), ''),
          'Marcheur'
        )
      ) ORDER BY m.created_at) AS arr
      FROM public.marcheur_medias m
      LEFT JOIN public.community_profiles cp
        ON cp.user_id = COALESCE(m.attributed_marcheur_id, m.user_id)
      WHERE m.marche_event_id = v_event.id
        AND m.type_media = 'photo'
        AND COALESCE(m.url_fichier, m.external_url) IS NOT NULL
    ),
    waypoints_arr AS (
      SELECT jsonb_agg(jsonb_build_object(
        'latitude', w.latitude,
        'longitude', w.longitude,
        'ordre', w.ordre,
        'title', w.label
      ) ORDER BY w.ordre) AS arr
      FROM public.exploration_waypoints w
      WHERE w.marche_event_id = v_event.id
    ),
    testimonies_arr AS (
      SELECT jsonb_agg(jsonb_build_object(
        'text', t.quote,
        'author', COALESCE(t.author_name, 'Marcheur'),
        'created_at', t.created_at
      ) ORDER BY t.display_order NULLS LAST, t.created_at DESC) AS arr
      FROM public.event_testimonies t
      WHERE t.event_id = v_event.id
        AND (t.is_published = true OR v_is_admin)
    )
  SELECT jsonb_build_object(
    'event', jsonb_build_object(
      'id', v_event.id,
      'title', v_event.title,
      'slug', v_event.public_slug,
      'date', COALESCE(v_event.date_marche::text, v_first_marche.date::text),
      'lieu', COALESCE(v_event.lieu, v_first_marche.nom_marche, v_first_marche.ville),
      'latitude', v_first_marche.latitude,
      'longitude', v_first_marche.longitude,
      'event_type', v_event.event_type,
      'cover_image_url', v_event.cover_image_url,
      'description', v_event.description,
      'scenography_title', v_event.scenography_title
    ),
    'species', COALESCE((SELECT arr FROM species_arr), '[]'::jsonb),
    'photos', COALESCE((SELECT arr FROM photos_arr), '[]'::jsonb),
    'waypoints', COALESCE((SELECT arr FROM waypoints_arr), '[]'::jsonb),
    'testimonies', COALESCE((SELECT arr FROM testimonies_arr), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;