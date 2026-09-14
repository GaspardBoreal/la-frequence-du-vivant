
-- Droit GPS élargi aux curateurs d'une propriété
CREATE OR REPLACE FUNCTION public.can_curate_propriete_gps(_user_id uuid, _propriete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_gps_curator(_user_id)
     OR (
       _propriete_id IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM public.propriete_marcheurs pm
         JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
         WHERE pm.propriete_id = _propriete_id
           AND cp.user_id = _user_id
           AND pm.role IN ('proprietaire'::public.role_propriete, 'prestataire'::public.role_propriete)
       )
     );
$$;

-- Vérifie que la position reste dans le périmètre du jardin
CREATE OR REPLACE FUNCTION public.is_within_propriete_scope(_propriete_id uuid, _lat numeric, _lon numeric)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plat double precision;
  _plon double precision;
  _radius numeric;
  _dist double precision;
BEGIN
  IF _propriete_id IS NULL OR _lat IS NULL OR _lon IS NULL THEN RETURN true; END IF;
  SELECT latitude, longitude, COALESCE(geofence_buffer_m, 2000)
    INTO _plat, _plon, _radius
  FROM public.proprietes WHERE id = _propriete_id;
  IF _plat IS NULL OR _plon IS NULL THEN RETURN true; END IF;
  IF _radius IS NULL OR _radius <= 0 THEN _radius := 2000; END IF;
  -- Haversine (mètres)
  _dist := 6371000 * 2 * asin(sqrt(
      power(sin(radians(_lat::double precision - _plat) / 2), 2)
    + cos(radians(_plat)) * cos(radians(_lat::double precision))
    * power(sin(radians(_lon::double precision - _plon) / 2), 2)
  ));
  RETURN _dist <= GREATEST(_radius, 2000)::double precision;
END;
$$;

-- set_observation_gps_override : droit propriété + garde-fou de portée
CREATE OR REPLACE FUNCTION public.set_observation_gps_override(_target_kind text, _target_key text, _status text, _lat numeric DEFAULT NULL::numeric, _lon numeric DEFAULT NULL::numeric, _original_lat numeric DEFAULT NULL::numeric, _original_lon numeric DEFAULT NULL::numeric, _reason text DEFAULT NULL::text, _propriete_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _obs_id uuid := NULL;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.can_curate_propriete_gps(_user, _propriete_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _target_kind NOT IN ('observation','snapshot_attr') THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
  IF _status NOT IN ('repositioned','excluded','validated') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF _status = 'repositioned' AND (
       _lat IS NULL OR _lon IS NULL OR _lat < -90 OR _lat > 90 OR _lon < -180 OR _lon > 180
     ) THEN
    RAISE EXCEPTION 'INVALID_COORDS';
  END IF;

  IF _status = 'repositioned'
     AND NOT public.is_gps_curator(_user)
     AND NOT public.is_within_propriete_scope(_propriete_id, _lat, _lon) THEN
    RAISE EXCEPTION 'OUT_OF_SCOPE';
  END IF;

  IF _target_kind = 'observation'
     AND _target_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    _obs_id := _target_key::uuid;
  END IF;

  INSERT INTO public.observation_gps_overrides(
    target_kind, target_key, status, lat, lon, original_lat, original_lon,
    reason, propriete_id, curated_by
  ) VALUES (
    _target_kind, _target_key, _status, _lat, _lon, _original_lat, _original_lon,
    _reason, _propriete_id, _user
  )
  ON CONFLICT (target_kind, target_key) DO UPDATE SET
    status = EXCLUDED.status,
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    original_lat = COALESCE(public.observation_gps_overrides.original_lat, EXCLUDED.original_lat),
    original_lon = COALESCE(public.observation_gps_overrides.original_lon, EXCLUDED.original_lon),
    reason = EXCLUDED.reason,
    propriete_id = COALESCE(EXCLUDED.propriete_id, public.observation_gps_overrides.propriete_id),
    curated_by = EXCLUDED.curated_by;

  IF _obs_id IS NOT NULL THEN
    IF _status = 'repositioned' THEN
      UPDATE public.marcheur_observations
         SET latitude = _lat, longitude = _lon, gps_source = 'manual'
       WHERE id = _obs_id;
    END IF;

    INSERT INTO public.marcheur_media_gps_audit(
      target_type, target_id, previous_lat, previous_lon, previous_source,
      new_lat, new_lon, new_source, note, repositioned_by
    ) VALUES (
      'observation', _obs_id, _original_lat, _original_lon, 'inaturalist',
      COALESCE(_lat, _original_lat, 0), COALESCE(_lon, _original_lon, 0),
      _status, _reason, _user
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', _status);
END;
$function$;

-- clear_observation_gps_override : droit propriété via la ligne d'override
CREATE OR REPLACE FUNCTION public.clear_observation_gps_override(_target_kind text, _target_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _row public.observation_gps_overrides;
  _obs_id uuid := NULL;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;

  SELECT * INTO _row FROM public.observation_gps_overrides
   WHERE target_kind = _target_kind AND target_key = _target_key;

  IF NOT public.can_curate_propriete_gps(_user, _row.propriete_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  IF _row.id IS NULL THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF _target_kind = 'observation'
     AND _target_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    _obs_id := _target_key::uuid;
  END IF;

  IF _obs_id IS NOT NULL AND _row.original_lat IS NOT NULL THEN
    UPDATE public.marcheur_observations
       SET latitude = _row.original_lat, longitude = _row.original_lon, gps_source = NULL
     WHERE id = _obs_id;
  END IF;

  DELETE FROM public.observation_gps_overrides WHERE id = _row.id;
  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- Repositionnement direct : paramètre propriété optionnel
CREATE OR REPLACE FUNCTION public.reposition_marcheur_observation_gps(_obs_id uuid, _lat numeric, _lon numeric, _note text DEFAULT NULL::text, _propriete_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _prev_lat numeric;
  _prev_lon numeric;
  _prev_src text;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.can_curate_propriete_gps(_user, _propriete_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _lat IS NULL OR _lon IS NULL OR _lat < -90 OR _lat > 90 OR _lon < -180 OR _lon > 180 THEN
    RAISE EXCEPTION 'INVALID_COORDS';
  END IF;
  IF NOT public.is_gps_curator(_user)
     AND NOT public.is_within_propriete_scope(_propriete_id, _lat, _lon) THEN
    RAISE EXCEPTION 'OUT_OF_SCOPE';
  END IF;

  SELECT latitude, longitude, gps_source INTO _prev_lat, _prev_lon, _prev_src
  FROM public.marcheur_observations WHERE id = _obs_id;

  UPDATE public.marcheur_observations
     SET latitude = _lat, longitude = _lon, gps_source = 'manual'
   WHERE id = _obs_id;

  INSERT INTO public.marcheur_media_gps_audit(
    target_type, target_id, previous_lat, previous_lon, previous_source,
    new_lat, new_lon, new_source, note, repositioned_by
  ) VALUES (
    'observation', _obs_id, _prev_lat, _prev_lon, _prev_src,
    _lat, _lon, 'manual', _note, _user
  );

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reposition_marcheur_media_gps(_media_id uuid, _lat numeric, _lon numeric, _note text DEFAULT NULL::text, _propriete_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _meta jsonb;
  _prev_gps jsonb;
  _has_original boolean;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.can_curate_propriete_gps(_user, _propriete_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _lat IS NULL OR _lon IS NULL OR _lat < -90 OR _lat > 90 OR _lon < -180 OR _lon > 180 THEN
    RAISE EXCEPTION 'INVALID_COORDS';
  END IF;
  IF NOT public.is_gps_curator(_user)
     AND NOT public.is_within_propriete_scope(_propriete_id, _lat, _lon) THEN
    RAISE EXCEPTION 'OUT_OF_SCOPE';
  END IF;

  SELECT COALESCE(metadata, '{}'::jsonb) INTO _meta
  FROM public.marcheur_medias WHERE id = _media_id;
  IF _meta IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  _prev_gps := _meta -> 'gps';
  _has_original := (_meta ? 'gps_original');
  IF NOT _has_original AND _prev_gps IS NOT NULL THEN
    _meta := jsonb_set(_meta, '{gps_original}', _prev_gps);
  END IF;

  _meta := jsonb_set(_meta, '{gps}', jsonb_build_object(
    'latitude', _lat, 'longitude', _lon, 'source', 'manual'
  ));
  _meta := jsonb_set(_meta, '{gps_repositioned_at}', to_jsonb(now()));
  _meta := jsonb_set(_meta, '{gps_repositioned_by}', to_jsonb(_user::text));

  UPDATE public.marcheur_medias SET metadata = _meta WHERE id = _media_id;

  INSERT INTO public.marcheur_media_gps_audit(
    target_type, target_id, previous_lat, previous_lon, previous_source,
    new_lat, new_lon, new_source, note, repositioned_by
  ) VALUES (
    'media', _media_id,
    NULLIF((_prev_gps ->> 'latitude'),'')::numeric,
    NULLIF((_prev_gps ->> 'longitude'),'')::numeric,
    _prev_gps ->> 'source',
    _lat, _lon, 'manual', _note, _user
  );

  RETURN jsonb_build_object('ok', true, 'gps', _meta -> 'gps');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.can_curate_propriete_gps(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_within_propriete_scope(uuid, numeric, numeric) TO authenticated;
