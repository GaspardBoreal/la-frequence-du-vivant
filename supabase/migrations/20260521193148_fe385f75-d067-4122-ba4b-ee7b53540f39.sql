
-- ============================================================
-- PUBLIC EVENTS — Lot 2 : Enrichissement données publiques
-- ============================================================

-- 1) Opt-in marcheur pour apparaître nommément sur les pages publiques
ALTER TABLE public.community_profiles
  ADD COLUMN IF NOT EXISTS public_event_consent boolean NOT NULL DEFAULT false;

-- 2) Typer les événements analytics (view | share | cta_click)
ALTER TABLE public.event_public_views
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'view',
  ADD COLUMN IF NOT EXISTS event_meta jsonb;

CREATE INDEX IF NOT EXISTS idx_event_public_views_event_type
  ON public.event_public_views (event_id, event_type, viewed_at DESC);

-- 3) Helper interne : arrondi GPS (~110m à 3 décimales)
CREATE OR REPLACE FUNCTION public.round_coord(_v numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _v IS NULL THEN NULL ELSE round(_v::numeric, 3) END;
$$;

-- 4) get_public_event : ajout organisateur public + GPS arrondi
CREATE OR REPLACE FUNCTION public.get_public_event(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'description', e.description,
    'date_marche', e.date_marche,
    'lieu', e.lieu,
    'latitude', public.round_coord(e.latitude),
    'longitude', public.round_coord(e.longitude),
    'event_type', e.event_type,
    'cover_image_url', e.cover_image_url,
    'public_slug', e.public_slug,
    'published_at', e.published_at,
    'exploration_id', e.exploration_id,
    'organisateur', CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', o.id,
      'nom', o.nom,
      'ville', o.ville,
      'pays', o.pays,
      'type_structure', o.type_structure,
      'description', o.description,
      'logo_url', o.logo_url,
      'site_web', o.site_web
    ) END
  ) INTO _result
  FROM public.marche_events e
  LEFT JOIN public.marche_organisateurs o ON o.id = e.organisateur_id
  WHERE e.public_slug = _slug AND e.is_public = true;
  RETURN _result;
END;
$$;

-- 5) Biodiversité publique : espèces + observations géolocalisées (GPS arrondis)
CREATE OR REPLACE FUNCTION public.get_public_event_biodiversity(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _snapshot record;
  _species jsonb;
  _observations jsonb;
  _trophic jsonb;
BEGIN
  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  -- Dernier snapshot biodiversity pour ce marche
  SELECT * INTO _snapshot FROM public.biodiversity_snapshots
  WHERE marche_id = _event_id
  ORDER BY snapshot_date DESC NULLS LAST, updated_at DESC NULLS LAST
  LIMIT 1;

  -- Espèces : fusion snapshot + marcheur_observations (déduplication par scientific_name)
  WITH snap_species AS (
    SELECT
      (s->>'scientific_name')::text AS scientific_name,
      (s->>'common_name')::text AS common_name,
      (s->>'iconic_taxon')::text AS iconic_taxon,
      (s->>'photo_url')::text AS photo_url,
      COALESCE((s->>'observations_count')::int, 1) AS obs_count,
      'inaturalist' AS source
    FROM jsonb_array_elements(COALESCE(_snapshot.species_data, '[]'::jsonb)) s
    WHERE s ? 'scientific_name'
  ),
  walker_species AS (
    SELECT
      mo.species_scientific_name AS scientific_name,
      NULL::text AS common_name,
      NULL::text AS iconic_taxon,
      max(mo.photo_url) AS photo_url,
      count(*)::int AS obs_count,
      'marcheur' AS source
    FROM public.marcheur_observations mo
    WHERE mo.marche_id = _event_id AND mo.species_scientific_name IS NOT NULL
    GROUP BY mo.species_scientific_name
  ),
  merged AS (
    SELECT scientific_name, common_name, iconic_taxon, photo_url, obs_count, source FROM snap_species
    UNION ALL
    SELECT scientific_name, common_name, iconic_taxon, photo_url, obs_count, source FROM walker_species
  ),
  deduped AS (
    SELECT
      lower(scientific_name) AS key,
      max(scientific_name) AS scientific_name,
      max(common_name) AS common_name,
      max(iconic_taxon) AS iconic_taxon,
      max(photo_url) AS photo_url,
      sum(obs_count)::int AS observations_count,
      bool_or(source = 'marcheur') AS has_walker
    FROM merged
    GROUP BY lower(scientific_name)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'scientific_name', scientific_name,
    'common_name', common_name,
    'iconic_taxon', iconic_taxon,
    'photo_url', photo_url,
    'observations_count', observations_count,
    'has_walker_observation', has_walker
  ) ORDER BY observations_count DESC), '[]'::jsonb)
  INTO _species
  FROM deduped;

  -- Observations géolocalisées (uniquement marcheur_observations, GPS arrondis)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'scientific_name', species_scientific_name,
    'latitude', public.round_coord(latitude::numeric),
    'longitude', public.round_coord(longitude::numeric),
    'observation_date', observation_date
  )), '[]'::jsonb)
  INTO _observations
  FROM public.marcheur_observations
  WHERE marche_id = _event_id
    AND latitude IS NOT NULL AND longitude IS NOT NULL
    AND species_scientific_name IS NOT NULL;

  -- Synthèse trophique : utilise iconic_taxon
  WITH trophic_calc AS (
    SELECT iconic_taxon,
      CASE
        WHEN iconic_taxon IN ('Plantae','Fungi') THEN 'producteurs'
        WHEN iconic_taxon IN ('Animalia','Aves','Mammalia','Reptilia','Amphibia','Actinopterygii','Insecta','Arachnida','Mollusca') THEN 'consommateurs'
        WHEN iconic_taxon IN ('Protozoa','Chromista') THEN 'decomposeurs'
        ELSE 'autres'
      END AS niveau
    FROM jsonb_to_recordset(_species) AS x(iconic_taxon text)
  )
  SELECT jsonb_build_object(
    'producteurs', COALESCE(sum(CASE WHEN niveau='producteurs' THEN 1 END), 0),
    'consommateurs', COALESCE(sum(CASE WHEN niveau='consommateurs' THEN 1 END), 0),
    'decomposeurs', COALESCE(sum(CASE WHEN niveau='decomposeurs' THEN 1 END), 0),
    'autres', COALESCE(sum(CASE WHEN niveau='autres' THEN 1 END), 0)
  ) INTO _trophic FROM trophic_calc;

  RETURN jsonb_build_object(
    'species', _species,
    'species_count', jsonb_array_length(_species),
    'observations_geo', _observations,
    'trophic_summary', _trophic,
    'biodiversity_index', _snapshot.biodiversity_index,
    'snapshot_date', _snapshot.snapshot_date
  );
END;
$$;

-- 6) Marcheurs publics : seulement opt-in
CREATE OR REPLACE FUNCTION public.get_public_event_marcheurs(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _result jsonb;
  _total int;
BEGIN
  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  -- Total des marcheurs validés
  SELECT count(DISTINCT user_id) INTO _total
  FROM public.marche_participations
  WHERE marche_event_id = _event_id AND validated_at IS NOT NULL;

  -- Marcheurs opt-in uniquement (prénom + initiale du nom)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'slug', cp.slug,
    'display_name', cp.prenom || COALESCE(' ' || left(cp.nom, 1) || '.', ''),
    'avatar_url', cp.avatar_url,
    'role', cp.role,
    'ville', cp.ville
  ) ORDER BY cp.prenom), '[]'::jsonb)
  INTO _result
  FROM public.marche_participations mp
  JOIN public.community_profiles cp ON cp.user_id = mp.user_id
  WHERE mp.marche_event_id = _event_id
    AND mp.validated_at IS NOT NULL
    AND cp.public_event_consent = true;

  RETURN jsonb_build_object(
    'total_count', COALESCE(_total, 0),
    'public_marcheurs', _result,
    'public_count', jsonb_array_length(_result)
  );
END;
$$;

-- 7) Témoignages publics
CREATE OR REPLACE FUNCTION public.get_public_event_testimonies(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _result jsonb;
BEGIN
  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'quote', t.quote,
    'author_name', CASE
      WHEN cp.public_event_consent = true THEN cp.prenom || COALESCE(' ' || left(cp.nom, 1) || '.', '')
      ELSE COALESCE(split_part(t.author_name, ' ', 1) || ' ' || left(NULLIF(split_part(t.author_name, ' ', 2), ''), 1) || '.', 'Un marcheur')
    END,
    'avatar_url', CASE WHEN cp.public_event_consent = true THEN cp.avatar_url ELSE NULL END,
    'display_order', t.display_order
  ) ORDER BY t.display_order, t.created_at), '[]'::jsonb)
  INTO _result
  FROM public.event_testimonies t
  LEFT JOIN public.community_profiles cp ON cp.user_id = t.user_id
  WHERE t.event_id = _event_id AND t.is_published = true;

  RETURN _result;
END;
$$;

-- 8) Médias publics
CREATE OR REPLACE FUNCTION public.get_public_event_medias(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _result jsonb;
BEGIN
  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', mm.id,
    'type_media', mm.type_media,
    'url_fichier', mm.url_fichier,
    'external_url', mm.external_url,
    'titre', mm.titre,
    'description', mm.description,
    'ordre', mm.ordre,
    'duree_secondes', mm.duree_secondes,
    'author_name', CASE
      WHEN cp.public_event_consent = true THEN cp.prenom || COALESCE(' ' || left(cp.nom, 1) || '.', '')
      ELSE NULL
    END
  ) ORDER BY mm.ordre NULLS LAST, mm.created_at), '[]'::jsonb)
  INTO _result
  FROM public.marcheur_medias mm
  LEFT JOIN public.community_profiles cp ON cp.user_id = mm.user_id
  WHERE mm.marche_event_id = _event_id AND mm.is_public = true;

  RETURN _result;
END;
$$;

-- 9) Compteurs enrichis (social proof)
CREATE OR REPLACE FUNCTION public.get_public_event_counters(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _views_total int;
  _unique int;
  _last7 int;
  _marcheurs int;
  _species int;
  _observations int;
BEGIN
  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  SELECT count(*) FILTER (WHERE event_type = 'view'),
         count(DISTINCT session_id) FILTER (WHERE event_type = 'view'),
         count(*) FILTER (WHERE event_type = 'view' AND viewed_at >= now() - interval '7 days')
    INTO _views_total, _unique, _last7
    FROM public.event_public_views WHERE event_id = _event_id;

  SELECT count(DISTINCT user_id) INTO _marcheurs
    FROM public.marche_participations
    WHERE marche_event_id = _event_id AND validated_at IS NOT NULL;

  SELECT count(*) INTO _observations
    FROM public.marcheur_observations
    WHERE marche_id = _event_id;

  -- Espèces : approximation via marcheur_observations (rapide) + snapshot total_species
  SELECT GREATEST(
    COALESCE((SELECT count(DISTINCT lower(species_scientific_name))
              FROM public.marcheur_observations
              WHERE marche_id = _event_id AND species_scientific_name IS NOT NULL), 0),
    COALESCE((SELECT total_species FROM public.biodiversity_snapshots
              WHERE marche_id = _event_id
              ORDER BY snapshot_date DESC NULLS LAST LIMIT 1), 0)
  ) INTO _species;

  RETURN jsonb_build_object(
    'views_total', COALESCE(_views_total, 0),
    'unique_visitors', COALESCE(_unique, 0),
    'views_last_7d', COALESCE(_last7, 0),
    'marcheurs_count', COALESCE(_marcheurs, 0),
    'species_count', COALESCE(_species, 0),
    'observations_count', COALESCE(_observations, 0)
  );
END;
$$;

-- 10) Log événements typés (view/share/cta_click)
CREATE OR REPLACE FUNCTION public.log_public_event_event(
  _slug text,
  _event_type text,
  _session_id text,
  _referrer text DEFAULT NULL,
  _utm_source text DEFAULT NULL,
  _utm_medium text DEFAULT NULL,
  _utm_campaign text DEFAULT NULL,
  _marcheur_slug text DEFAULT NULL,
  _user_agent_family text DEFAULT NULL,
  _meta jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _event_id uuid;
BEGIN
  IF _event_type NOT IN ('view', 'share', 'cta_click') THEN
    RAISE EXCEPTION 'Invalid event_type: %', _event_type;
  END IF;

  SELECT id INTO _event_id FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.event_public_views (
    event_id, event_type, session_id, referrer, utm_source, utm_medium,
    utm_campaign, marcheur_slug, user_agent_family, event_meta
  ) VALUES (
    _event_id, _event_type, _session_id, _referrer, _utm_source, _utm_medium,
    _utm_campaign, _marcheur_slug, _user_agent_family, _meta
  );
END;
$$;

-- 11) Rayonnement admin enrichi (par type d'événement + partages par canal)
CREATE OR REPLACE FUNCTION public.get_event_rayonnement(_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _result jsonb;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'views_total', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view'),
    'unique_visitors', (SELECT count(DISTINCT session_id) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view'),
    'views_last_30d', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view' AND viewed_at >= now() - interval '30 days'),
    'shares_total', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'share'),
    'cta_clicks_total', (SELECT count(*) FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'cta_click'),
    'shares_by_channel', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('channel', channel, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(event_meta->>'channel', 'unknown') AS channel, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND event_type = 'share'
        GROUP BY 1 ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'top_referrers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('referrer', referrer, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(referrer, 'direct') AS referrer, count(*) AS cnt
        FROM public.event_public_views WHERE event_id = _event_id AND event_type = 'view'
        GROUP BY 1 ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'channels', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('source', utm_source, 'medium', utm_medium, 'count', cnt)), '[]'::jsonb)
      FROM (
        SELECT utm_source, utm_medium, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND event_type = 'view' AND utm_source IS NOT NULL
        GROUP BY utm_source, utm_medium ORDER BY cnt DESC LIMIT 10
      ) t
    ),
    'daily_30d', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', viewed_at AT TIME ZONE 'Europe/Paris')::date AS day, count(*) AS cnt
        FROM public.event_public_views
        WHERE event_id = _event_id AND event_type = 'view' AND viewed_at >= now() - interval '30 days'
        GROUP BY 1
      ) t
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- 12) Grants : anon doit pouvoir appeler les nouvelles RPC publiques
GRANT EXECUTE ON FUNCTION public.get_public_event(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_event_counters(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_event_biodiversity(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_event_marcheurs(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_event_testimonies(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_event_medias(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_public_event_event(text, text, text, text, text, text, text, text, text, jsonb) TO anon, authenticated;
