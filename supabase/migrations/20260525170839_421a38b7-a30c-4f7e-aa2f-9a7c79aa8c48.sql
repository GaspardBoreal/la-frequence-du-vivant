
CREATE OR REPLACE FUNCTION public.get_curation_media_context(p_media_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_media record;
  v_marche record;
  v_gps jsonb;
  v_lat double precision;
  v_lng double precision;
  v_dist double precision;
  v_radius integer;
  v_candidates jsonb;
  v_attributed jsonb;
  v_species_already boolean;
  v_obs_count integer;
  v_top_suggestion jsonb;
BEGIN
  SELECT public.check_is_admin_user(auth.uid()) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT m.*, e.exploration_id, e.id AS event_id
  INTO v_media
  FROM marcheur_medias m
  LEFT JOIN marche_events e ON e.id = m.marche_event_id
  WHERE m.id = p_media_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'media_not_found'; END IF;

  v_gps := COALESCE(v_media.metadata->'gps', '{}'::jsonb);
  v_lat := NULLIF(v_gps->>'latitude','')::double precision;
  v_lng := NULLIF(v_gps->>'longitude','')::double precision;

  -- Marche associée
  IF v_media.marche_id IS NOT NULL THEN
    SELECT id, nom_marche,
           latitude::double precision AS latitude,
           longitude::double precision AS longitude,
           COALESCE(radius_m, 500) AS radius_m, date
    INTO v_marche
    FROM marches WHERE id = v_media.marche_id;
    v_radius := v_marche.radius_m;
    IF v_lat IS NOT NULL AND v_marche.latitude IS NOT NULL THEN
      v_dist := public.haversine_m(v_lat, v_lng, v_marche.latitude, v_marche.longitude);
    END IF;
  END IF;

  -- Participants candidats : participations validées ∪ uploader original
  WITH cand_users AS (
    SELECT p.user_id
    FROM marche_participations p
    WHERE p.marche_event_id = v_media.marche_event_id
      AND p.validated_at IS NOT NULL
      AND p.user_id IS NOT NULL
    UNION
    SELECT v_media.user_id WHERE v_media.user_id IS NOT NULL
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', cu.user_id,
    'display_name', COALESCE(NULLIF(TRIM(COALESCE(cp.prenom,'')||' '||COALESCE(cp.nom,'')),''), cp.slug, ''),
    'avatar_url', cp.avatar_url,
    'slug', cp.slug
  ) ORDER BY COALESCE(NULLIF(TRIM(COALESCE(cp.prenom,'')||' '||COALESCE(cp.nom,'')),''), cp.slug)), '[]'::jsonb)
  INTO v_candidates
  FROM cand_users cu
  LEFT JOIN community_profiles cp ON cp.user_id = cu.user_id;

  -- Marcheur déjà attribué
  IF v_media.attributed_marcheur_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'crew_id', em.id,
      'user_id', em.user_id,
      'display_name', COALESCE(
        NULLIF(TRIM(COALESCE(em.prenom,'')||' '||COALESCE(em.nom,'')),''),
        NULLIF(TRIM(COALESCE(cp.prenom,'')||' '||COALESCE(cp.nom,'')),''),
        cp.slug, em.nom, ''
      )
    )
    INTO v_attributed
    FROM exploration_marcheurs em
    LEFT JOIN community_profiles cp ON cp.user_id = em.user_id
    WHERE em.id = v_media.attributed_marcheur_id;
  END IF;

  -- Impact : top suggestion + esp déjà présente
  SELECT jsonb_build_object(
    'scientific_name', s.taxon_scientific_name,
    'common_name_fr', s.taxon_common_name_fr,
    'kingdom', s.kingdom,
    'confidence', s.confidence,
    'provider', s.ai_provider
  )
  INTO v_top_suggestion
  FROM marcheur_photo_ai_suggestions s
  WHERE s.media_id = p_media_id
  ORDER BY s.rank ASC
  LIMIT 1;

  IF v_top_suggestion IS NOT NULL AND v_media.marche_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_obs_count
    FROM marcheur_observations o
    WHERE o.marche_id = v_media.marche_id
      AND lower(o.species_scientific_name) = lower(v_top_suggestion->>'scientific_name');
    v_species_already := v_obs_count > 0;
  END IF;

  RETURN jsonb_build_object(
    'media', jsonb_build_object(
      'id', v_media.id,
      'url', COALESCE(v_media.url_fichier, v_media.external_url),
      'date_taken', v_media.metadata->>'date_taken',
      'gps', jsonb_build_object(
        'lat', v_lat, 'lng', v_lng,
        'altitude', v_gps->>'altitude',
        'source', COALESCE(v_gps->>'source','exif')
      ),
      'ai_status', v_media.ai_status,
      'ai_kingdom_hint', v_media.ai_kingdom_hint
    ),
    'marche', CASE WHEN v_marche.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_marche.id,
      'nom_marche', v_marche.nom_marche,
      'date', v_marche.date,
      'latitude', v_marche.latitude,
      'longitude', v_marche.longitude,
      'radius_m', v_radius,
      'distance_m', v_dist,
      'out_of_radius', (v_dist IS NOT NULL AND v_dist > v_radius)
    ) END,
    'event_id', v_media.event_id,
    'exploration_id', v_media.exploration_id,
    'candidates', v_candidates,
    'attributed', v_attributed,
    'top_suggestion', v_top_suggestion,
    'impact', jsonb_build_object(
      'species_already_in_marche', COALESCE(v_species_already, false),
      'current_obs_count_for_species', COALESCE(v_obs_count, 0)
    )
  );
END;
$function$;
