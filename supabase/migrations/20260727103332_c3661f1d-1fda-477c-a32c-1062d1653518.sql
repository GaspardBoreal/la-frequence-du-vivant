CREATE OR REPLACE FUNCTION public.set_observation_gps_override(
  _target_kind text,
  _target_key text,
  _status text,
  _lat numeric DEFAULT NULL,
  _lon numeric DEFAULT NULL,
  _original_lat numeric DEFAULT NULL,
  _original_lon numeric DEFAULT NULL,
  _reason text DEFAULT NULL,
  _propriete_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _obs_id uuid := NULL;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.is_gps_curator(_user) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _target_kind NOT IN ('observation','snapshot_attr') THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
  IF _status NOT IN ('repositioned','excluded','validated') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF _status = 'repositioned' AND (
       _lat IS NULL OR _lon IS NULL OR _lat < -90 OR _lat > 90 OR _lon < -180 OR _lon > 180
     ) THEN
    RAISE EXCEPTION 'INVALID_COORDS';
  END IF;

  -- Les cibles iNaturalist ont pour clé une URL : pas d'identifiant interne.
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
$$;

CREATE OR REPLACE FUNCTION public.clear_observation_gps_override(
  _target_kind text,
  _target_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _row public.observation_gps_overrides;
  _obs_id uuid := NULL;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.is_gps_curator(_user) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT * INTO _row FROM public.observation_gps_overrides
   WHERE target_kind = _target_kind AND target_key = _target_key;

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
$$;