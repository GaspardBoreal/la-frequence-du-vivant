-- Helper curator (admin via check_is_admin_user OU community_profiles.role)
CREATE OR REPLACE FUNCTION public.is_gps_curator(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _role text;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  SELECT public.check_is_admin_user(_user_id) INTO _is_admin;
  IF _is_admin THEN RETURN true; END IF;
  SELECT role::text INTO _role FROM public.community_profiles WHERE user_id = _user_id;
  RETURN _role IN ('ambassadeur','sentinelle');
END;
$$;

-- Table audit
CREATE TABLE IF NOT EXISTS public.marcheur_media_gps_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('media','observation')),
  target_id uuid NOT NULL,
  previous_lat numeric,
  previous_lon numeric,
  previous_source text,
  new_lat numeric NOT NULL,
  new_lon numeric NOT NULL,
  new_source text NOT NULL DEFAULT 'manual',
  note text,
  repositioned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmga_target ON public.marcheur_media_gps_audit (target_type, target_id);
ALTER TABLE public.marcheur_media_gps_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Curators can read audit" ON public.marcheur_media_gps_audit;
CREATE POLICY "Curators can read audit"
ON public.marcheur_media_gps_audit FOR SELECT
TO authenticated
USING (public.is_gps_curator(auth.uid()));

DROP POLICY IF EXISTS "Owners can read their media audit" ON public.marcheur_media_gps_audit;
CREATE POLICY "Owners can read their media audit"
ON public.marcheur_media_gps_audit FOR SELECT
TO authenticated
USING (
  target_type = 'media' AND EXISTS (
    SELECT 1 FROM public.marcheur_medias m
    WHERE m.id = target_id AND m.user_id = auth.uid()
  )
);

-- Colonnes lat/lon observations
ALTER TABLE public.marcheur_observations
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS gps_source text;

-- RPC reposition media
CREATE OR REPLACE FUNCTION public.reposition_marcheur_media_gps(
  _media_id uuid,
  _lat numeric,
  _lon numeric,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _meta jsonb;
  _prev_gps jsonb;
  _has_original boolean;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.is_gps_curator(_user) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _lat IS NULL OR _lon IS NULL OR _lat < -90 OR _lat > 90 OR _lon < -180 OR _lon > 180 THEN
    RAISE EXCEPTION 'INVALID_COORDS';
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
$$;

-- RPC reposition observation
CREATE OR REPLACE FUNCTION public.reposition_marcheur_observation_gps(
  _obs_id uuid,
  _lat numeric,
  _lon numeric,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _prev_lat numeric;
  _prev_lon numeric;
  _prev_src text;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.is_gps_curator(_user) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _lat IS NULL OR _lon IS NULL OR _lat < -90 OR _lat > 90 OR _lon < -180 OR _lon > 180 THEN
    RAISE EXCEPTION 'INVALID_COORDS';
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
$$;

REVOKE ALL ON FUNCTION public.reposition_marcheur_media_gps(uuid,numeric,numeric,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reposition_marcheur_observation_gps(uuid,numeric,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reposition_marcheur_media_gps(uuid,numeric,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reposition_marcheur_observation_gps(uuid,numeric,numeric,text) TO authenticated;