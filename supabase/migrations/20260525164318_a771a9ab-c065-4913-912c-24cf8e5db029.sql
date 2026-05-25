
-- 1. Add columns to marcheur_observations
ALTER TABLE public.marcheur_observations
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS curated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS curated_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_media_id uuid REFERENCES public.marcheur_medias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric(4,3),
  ADD COLUMN IF NOT EXISTS taxon_common_name_fr text,
  ADD COLUMN IF NOT EXISTS kingdom text,
  ADD COLUMN IF NOT EXISTS iconic_taxon text;

-- 2. Backfill source on existing rows
UPDATE public.marcheur_observations
SET source = CASE
  WHEN inaturalist_observation_id IS NOT NULL THEN 'inaturalist'
  WHEN notes ILIKE '%Identification IA validée par curateur%' THEN 'manual_mdv'
  ELSE 'walker_upload'
END
WHERE source IS NULL;

-- 3. Default for future inserts
ALTER TABLE public.marcheur_observations ALTER COLUMN source SET DEFAULT 'walker_upload';

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_marcheur_obs_source ON public.marcheur_observations(source);
CREATE INDEX IF NOT EXISTS idx_marcheur_obs_curated_by ON public.marcheur_observations(curated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_marcheur_obs_source_media ON public.marcheur_observations(source_media_id);

-- 5. Haversine helper (idempotent)
CREATE OR REPLACE FUNCTION public.haversine_m(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE AS $$
  SELECT 2 * 6371000 * asin(sqrt(
    sin(radians((lat2-lat1)/2))^2
    + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians((lon2-lon1)/2))^2
  ));
$$;

-- 6. RPC : context complet pour le drawer de curation
CREATE OR REPLACE FUNCTION public.get_curation_media_context(p_media_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_media record;
  v_marche record;
  v_event record;
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
    SELECT id, nom_marche, latitude::double precision AS latitude, longitude::double precision AS longitude,
           COALESCE(radius_m, 500) AS radius_m, date
    INTO v_marche
    FROM marches WHERE id = v_media.marche_id;
    v_radius := v_marche.radius_m;
    IF v_lat IS NOT NULL AND v_marche.latitude IS NOT NULL THEN
      v_dist := public.haversine_m(v_lat, v_lng, v_marche.latitude, v_marche.longitude);
    END IF;
  END IF;

  -- Participants candidats (de l'event)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', p.user_id,
    'display_name', COALESCE(cp.display_name, cp.slug, ''),
    'avatar_url', cp.avatar_url,
    'slug', cp.slug
  ) ORDER BY COALESCE(cp.display_name, cp.slug)), '[]'::jsonb)
  INTO v_candidates
  FROM marche_participations p
  LEFT JOIN community_profiles cp ON cp.user_id = p.user_id
  WHERE p.marche_event_id = v_media.marche_event_id
    AND p.validated_at IS NOT NULL
    AND p.user_id IS NOT NULL;

  -- Marcheur déjà attribué
  IF v_media.attributed_marcheur_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'crew_id', em.id,
      'user_id', em.user_id,
      'display_name', COALESCE(em.prenom||' '||em.nom, cp.display_name, em.nom, '')
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
$$;

GRANT EXECUTE ON FUNCTION public.get_curation_media_context(uuid) TO authenticated;
