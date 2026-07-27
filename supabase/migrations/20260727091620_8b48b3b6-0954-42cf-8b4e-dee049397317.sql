-- 1. Table des overrides GPS éditoriaux
CREATE TABLE IF NOT EXISTS public.observation_gps_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind text NOT NULL CHECK (target_kind IN ('observation','snapshot_attr')),
  target_key text NOT NULL,
  status text NOT NULL DEFAULT 'repositioned' CHECK (status IN ('repositioned','excluded','validated')),
  lat numeric,
  lon numeric,
  original_lat numeric,
  original_lon numeric,
  reason text,
  propriete_id uuid,
  curated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_obs_gps_override_target
  ON public.observation_gps_overrides (target_kind, target_key);

GRANT SELECT ON public.observation_gps_overrides TO anon;
GRANT SELECT ON public.observation_gps_overrides TO authenticated;
GRANT ALL ON public.observation_gps_overrides TO service_role;

ALTER TABLE public.observation_gps_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Overrides readable by all" ON public.observation_gps_overrides;
CREATE POLICY "Overrides readable by all"
ON public.observation_gps_overrides FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Curators manage overrides" ON public.observation_gps_overrides;
CREATE POLICY "Curators manage overrides"
ON public.observation_gps_overrides FOR ALL
TO authenticated
USING (public.is_gps_curator(auth.uid()))
WITH CHECK (public.is_gps_curator(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_observation_gps_overrides()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_obs_gps_overrides ON public.observation_gps_overrides;
CREATE TRIGGER trg_touch_obs_gps_overrides
BEFORE UPDATE ON public.observation_gps_overrides
FOR EACH ROW EXECUTE FUNCTION public.touch_observation_gps_overrides();

-- 2. Métadonnées de fiabilité iNaturalist
ALTER TABLE public.marcheur_observations
  ADD COLUMN IF NOT EXISTS positional_accuracy numeric,
  ADD COLUMN IF NOT EXISTS geoprivacy text,
  ADD COLUMN IF NOT EXISTS obscured boolean;

-- 3. Marge de géofence par propriété
ALTER TABLE public.proprietes
  ADD COLUMN IF NOT EXISTS geofence_buffer_m integer NOT NULL DEFAULT 25;

-- 4. RPC d'écriture (curateurs uniquement)
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

  -- Miroir sur la ligne source pour les observations marcheurs (protège des resyncs)
  IF _target_kind = 'observation' AND _status = 'repositioned' THEN
    UPDATE public.marcheur_observations
       SET latitude = _lat, longitude = _lon, gps_source = 'manual'
     WHERE id = _target_key::uuid;
  END IF;

  INSERT INTO public.marcheur_media_gps_audit(
    target_type, target_id, previous_lat, previous_lon, previous_source,
    new_lat, new_lon, new_source, note, repositioned_by
  )
  SELECT 'observation', _target_key::uuid, _original_lat, _original_lon, 'inaturalist',
         COALESCE(_lat, _original_lat, 0), COALESCE(_lon, _original_lon, 0),
         _status, _reason, _user
  WHERE _target_kind = 'observation';

  RETURN jsonb_build_object('ok', true, 'status', _status);
END;
$$;

REVOKE ALL ON FUNCTION public.set_observation_gps_override(text,text,text,numeric,numeric,numeric,numeric,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_observation_gps_override(text,text,text,numeric,numeric,numeric,numeric,text,uuid) TO authenticated;

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
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT public.is_gps_curator(_user) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT * INTO _row FROM public.observation_gps_overrides
   WHERE target_kind = _target_kind AND target_key = _target_key;

  IF _row.id IS NULL THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF _target_kind = 'observation' AND _row.original_lat IS NOT NULL THEN
    UPDATE public.marcheur_observations
       SET latitude = _row.original_lat, longitude = _row.original_lon, gps_source = NULL
     WHERE id = _target_key::uuid;
  END IF;

  DELETE FROM public.observation_gps_overrides WHERE id = _row.id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.clear_observation_gps_override(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_observation_gps_override(text,text) TO authenticated;

-- 5. Exposer l'id d'observation dans le pool (nécessaire pour cibler un override)
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
      mo.inaturalist_observation_id, mo.marcheur_id,
      mo.id AS obs_id,
      mo.positional_accuracy, mo.obscured, mo.gps_source
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
      msr.inaturalist_observation_id, msr.marche_id, msr.marcheur_id,
      msr.obs_id, msr.positional_accuracy, msr.obscured, msr.gps_source
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
        'gps_source', gps_source
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
$function$;