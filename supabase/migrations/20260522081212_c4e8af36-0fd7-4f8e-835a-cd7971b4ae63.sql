
CREATE OR REPLACE FUNCTION public.get_public_event_stats(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _event_id uuid;
  _exploration_id uuid;
  _marcheurs int := 0;
  _species int := 0;
  _observations int := 0;
  _views int := 0;
  _unique int := 0;
  _pratiques int := 0;
  _paysages int := 0;
  _pratiques_sample jsonb := '[]'::jsonb;
  _paysages_sample jsonb := '[]'::jsonb;
BEGIN
  SELECT id, exploration_id INTO _event_id, _exploration_id
  FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  SELECT count(*) FILTER (WHERE event_type = 'view'),
         count(DISTINCT session_id) FILTER (WHERE event_type = 'view')
    INTO _views, _unique
  FROM public.event_public_views WHERE event_id = _event_id;

  WITH walkers AS (
    SELECT em.user_id FROM public.exploration_marcheurs em
    WHERE em.exploration_id = _exploration_id AND em.is_guest = false AND em.user_id IS NOT NULL
    UNION
    SELECT mp.user_id FROM public.marche_participations mp
    WHERE mp.marche_event_id = _event_id AND mp.is_guest = false
  )
  SELECT count(DISTINCT user_id) INTO _marcheurs FROM walkers;

  IF _exploration_id IS NOT NULL THEN
    WITH last_snaps AS (
      SELECT DISTINCT ON (bs.marche_id) bs.marche_id, bs.species_data
      FROM public.biodiversity_snapshots bs
      JOIN public.exploration_marches em ON em.marche_id = bs.marche_id
      WHERE em.exploration_id = _exploration_id
      ORDER BY bs.marche_id, bs.snapshot_date DESC NULLS LAST, bs.updated_at DESC NULLS LAST
    ),
    snap_species AS (
      SELECT
        lower(COALESCE(s->>'scientific_name', s->>'scientificName')) AS k,
        COALESCE((s->>'observations_count')::int, (s->>'observations')::int, 1) AS obs
      FROM last_snaps ls
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ls.species_data, '[]'::jsonb)) s
      WHERE COALESCE(s->>'scientific_name', s->>'scientificName') IS NOT NULL
    ),
    walker_species AS (
      SELECT lower(mo.species_scientific_name) AS k, count(*)::int AS obs
      FROM public.marcheur_observations mo
      JOIN public.exploration_marches em ON em.marche_id = mo.marche_id
      WHERE em.exploration_id = _exploration_id
        AND mo.species_scientific_name IS NOT NULL
        AND mo.inaturalist_observation_id IS NULL
      GROUP BY 1
    ),
    merged AS (SELECT k, obs FROM snap_species UNION ALL SELECT k, obs FROM walker_species)
    SELECT count(DISTINCT k), COALESCE(sum(obs), 0) INTO _species, _observations FROM merged;

    SELECT count(*) INTO _pratiques
    FROM public.curation_marcheurs cm
    JOIN public.exploration_curations ec ON ec.id = cm.curation_id
    WHERE ec.exploration_id = _exploration_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', ec.id, 'titre', ec.title, 'category', ec.category,
      'description', left(COALESCE(ec.description,''), 240),
      'prenom', em.prenom, 'nom', em.nom, 'avatar_url', em.avatar_url,
      'photo_url', (
        SELECT mm.url_fichier FROM public.marcheur_medias mm
        WHERE mm.id::text = ANY (COALESCE(ec.media_ids, ARRAY[]::text[]))
        LIMIT 1
      )
    ) ORDER BY cm.display_order NULLS LAST, ec.created_at DESC), '[]'::jsonb)
    INTO _pratiques_sample
    FROM public.curation_marcheurs cm
    JOIN public.exploration_curations ec ON ec.id = cm.curation_id
    JOIN public.exploration_marcheurs em ON em.id = cm.marcheur_id
    WHERE ec.exploration_id = _exploration_id
    LIMIT 8;

    SELECT count(*) INTO _paysages
    FROM public.marcheur_audio ma
    JOIN public.exploration_marches em ON em.marche_id = ma.marche_id
    WHERE em.exploration_id = _exploration_id
      AND COALESCE(ma.is_public, true) = true;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', ma.id, 'titre', COALESCE(ma.titre, 'Paysage sonore'),
      'description', ma.description, 'url', ma.url_fichier,
      'duree_secondes', ma.duree_secondes,
      'prenom', em2.prenom, 'nom', em2.nom, 'avatar_url', em2.avatar_url
    ) ORDER BY ma.ordre NULLS LAST, ma.created_at), '[]'::jsonb)
    INTO _paysages_sample
    FROM public.marcheur_audio ma
    JOIN public.exploration_marches xm ON xm.marche_id = ma.marche_id
    LEFT JOIN public.exploration_marcheurs em2 ON em2.id = ma.attributed_marcheur_id
    WHERE xm.exploration_id = _exploration_id
      AND COALESCE(ma.is_public, true) = true
    LIMIT 10;
  END IF;

  RETURN jsonb_build_object(
    'marcheurs_count', _marcheurs, 'species_count', _species,
    'observations_count', _observations, 'views_total', COALESCE(_views, 0),
    'unique_visitors', COALESCE(_unique, 0),
    'pratiques_count', _pratiques, 'paysages_sonores_count', _paysages,
    'pratiques_sample', _pratiques_sample, 'paysages_sample', _paysages_sample,
    'methodology', jsonb_build_object(
      'marcheurs', 'Union exploration_marcheurs (hors invités) et marche_participations (hors invités), déduplication par user_id.',
      'species', 'Dernier snapshot par marche + observations marcheurs (non iNaturalist), dédup par nom scientifique.',
      'observations', 'Somme des observations des snapshots + observations marcheurs sans doublon iNaturalist.',
      'discoverers', 'Sessions navigateur uniques sur la page publique (anonyme).',
      'pratiques', 'Curations de pratiques rattachées aux marcheurs de cette exploration.',
      'paysages', 'Paysages sonores enregistrés sur les marches de l''exploration.'
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_event_biodiversity(_slug text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _event_id uuid; _exploration_id uuid;
  _species jsonb := '[]'::jsonb; _observations jsonb := '[]'::jsonb;
  _trophic jsonb; _bio_index numeric; _snap_date date;
BEGIN
  SELECT id, exploration_id INTO _event_id, _exploration_id
  FROM public.marche_events WHERE public_slug = _slug AND is_public = true;
  IF _event_id IS NULL THEN RETURN NULL; END IF;

  IF _exploration_id IS NOT NULL THEN
    WITH last_snaps AS (
      SELECT DISTINCT ON (bs.marche_id) bs.marche_id, bs.species_data, bs.biodiversity_index, bs.snapshot_date, xm.ordre AS marche_ordre
      FROM public.biodiversity_snapshots bs
      JOIN public.exploration_marches xm ON xm.marche_id = bs.marche_id
      WHERE xm.exploration_id = _exploration_id
      ORDER BY bs.marche_id, bs.snapshot_date DESC NULLS LAST, bs.updated_at DESC NULLS LAST
    ),
    snap_species AS (
      SELECT
        lower(COALESCE(s->>'scientific_name', s->>'scientificName')) AS k,
        COALESCE(s->>'scientific_name', s->>'scientificName') AS scientific_name,
        COALESCE(s->>'common_name', s->>'commonName') AS common_name,
        COALESCE(s->>'iconic_taxon', s->>'iconicTaxon') AS iconic_taxon,
        COALESCE(s->>'photo_url', (s->'photos'->>0), (s->'photoData'->>'url')) AS photo_url,
        COALESCE((s->>'observations_count')::int, (s->>'observations')::int, 1) AS obs_count,
        ls.marche_ordre, 'inaturalist' AS source
      FROM last_snaps ls CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ls.species_data, '[]'::jsonb)) s
      WHERE COALESCE(s->>'scientific_name', s->>'scientificName') IS NOT NULL
    ),
    walker_species AS (
      SELECT lower(mo.species_scientific_name) AS k, mo.species_scientific_name AS scientific_name,
        NULL::text AS common_name, NULL::text AS iconic_taxon,
        max(mo.photo_url) AS photo_url, count(*)::int AS obs_count,
        min(xm.ordre) AS marche_ordre, 'marcheur' AS source
      FROM public.marcheur_observations mo
      JOIN public.exploration_marches xm ON xm.marche_id = mo.marche_id
      WHERE xm.exploration_id = _exploration_id AND mo.species_scientific_name IS NOT NULL
      GROUP BY mo.species_scientific_name
    ),
    merged AS (SELECT * FROM snap_species UNION ALL SELECT * FROM walker_species),
    deduped AS (
      SELECT k, max(scientific_name) AS scientific_name, max(common_name) AS common_name,
        max(iconic_taxon) AS iconic_taxon,
        (array_agg(photo_url) FILTER (WHERE photo_url IS NOT NULL))[1] AS photo_url,
        sum(obs_count)::int AS observations_count, min(marche_ordre) AS marche_ordre,
        bool_or(source='marcheur') AS has_walker
      FROM merged GROUP BY k
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'scientific_name', scientific_name, 'common_name', common_name,
      'iconic_taxon', iconic_taxon, 'photo_url', photo_url,
      'observations_count', observations_count, 'marche_ordre', marche_ordre,
      'has_walker_observation', has_walker
    ) ORDER BY marche_ordre NULLS LAST, observations_count DESC), '[]'::jsonb)
    INTO _species FROM deduped;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'scientific_name', mo.species_scientific_name,
      'latitude', public.round_coord(mo.latitude::numeric),
      'longitude', public.round_coord(mo.longitude::numeric),
      'observation_date', mo.observation_date, 'marche_ordre', xm.ordre
    ) ORDER BY xm.ordre NULLS LAST, mo.observation_date), '[]'::jsonb)
    INTO _observations
    FROM public.marcheur_observations mo
    JOIN public.exploration_marches xm ON xm.marche_id = mo.marche_id
    WHERE xm.exploration_id = _exploration_id
      AND mo.latitude IS NOT NULL AND mo.longitude IS NOT NULL
      AND mo.species_scientific_name IS NOT NULL;

    SELECT avg(biodiversity_index), max(snapshot_date) INTO _bio_index, _snap_date FROM (
      SELECT DISTINCT ON (bs.marche_id) bs.marche_id, bs.biodiversity_index, bs.snapshot_date
      FROM public.biodiversity_snapshots bs
      JOIN public.exploration_marches xm ON xm.marche_id = bs.marche_id
      WHERE xm.exploration_id = _exploration_id
      ORDER BY bs.marche_id, bs.snapshot_date DESC NULLS LAST
    ) t;
  END IF;

  WITH trophic_calc AS (
    SELECT iconic_taxon,
      CASE
        WHEN iconic_taxon IN ('Plantae','Fungi') THEN 'producteurs'
        WHEN iconic_taxon IN ('Animalia','Aves','Mammalia','Reptilia','Amphibia','Actinopterygii','Insecta','Arachnida','Mollusca') THEN 'consommateurs'
        WHEN iconic_taxon IN ('Protozoa','Chromista') THEN 'decomposeurs'
        ELSE 'autres' END AS niveau
    FROM jsonb_to_recordset(_species) AS x(iconic_taxon text)
  )
  SELECT jsonb_build_object(
    'producteurs', COALESCE(sum(CASE WHEN niveau='producteurs' THEN 1 END), 0),
    'consommateurs', COALESCE(sum(CASE WHEN niveau='consommateurs' THEN 1 END), 0),
    'decomposeurs', COALESCE(sum(CASE WHEN niveau='decomposeurs' THEN 1 END), 0),
    'autres', COALESCE(sum(CASE WHEN niveau='autres' THEN 1 END), 0)
  ) INTO _trophic FROM trophic_calc;

  RETURN jsonb_build_object(
    'species', _species, 'species_count', jsonb_array_length(_species),
    'observations_geo', _observations, 'trophic_summary', _trophic,
    'biodiversity_index', _bio_index, 'snapshot_date', _snap_date
  );
END;
$function$;
