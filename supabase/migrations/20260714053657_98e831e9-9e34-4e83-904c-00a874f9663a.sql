CREATE OR REPLACE FUNCTION public.get_public_event_medias(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _exploration_id uuid;
  _result jsonb;
BEGIN
  SELECT id, exploration_id INTO _event_id, _exploration_id
  FROM public.marche_events
  WHERE public_slug = _slug AND is_public = true;

  IF _event_id IS NULL THEN
    RETURN NULL;
  END IF;

  WITH event_medias AS (
    SELECT
      ('media:' || mm.id::text) AS id,
      mm.type_media,
      mm.url_fichier,
      mm.external_url,
      mm.titre,
      mm.description,
      mm.ordre,
      mm.duree_secondes,
      mm.created_at,
      CASE
        WHEN cp.public_event_consent = true THEN cp.prenom || COALESCE(' ' || left(cp.nom, 1) || '.', '')
        ELSE NULL
      END AS author_name,
      0 AS source_rank
    FROM public.marcheur_medias mm
    LEFT JOIN public.community_profiles cp ON cp.user_id = mm.user_id
    WHERE mm.marche_event_id = _event_id
      AND mm.is_public = true
  ),
  convivialite AS (
    SELECT
      ('conv:' || ecp.id::text) AS id,
      'photo'::text AS type_media,
      ecp.url AS url_fichier,
      NULL::text AS external_url,
      'Convivialité'::text AS titre,
      NULL::text AS description,
      ecp.position AS ordre,
      NULL::integer AS duree_secondes,
      ecp.created_at,
      CASE
        WHEN cp.public_event_consent = true THEN cp.prenom || COALESCE(' ' || left(cp.nom, 1) || '.', '')
        ELSE NULL
      END AS author_name,
      1 AS source_rank
    FROM public.exploration_convivialite_photos ecp
    LEFT JOIN public.community_profiles cp ON cp.user_id = ecp.user_id
    WHERE ecp.exploration_id = _exploration_id
      AND ecp.is_hidden = false
      AND ecp.url IS NOT NULL
  ),
  all_medias AS (
    SELECT * FROM event_medias
    UNION ALL
    SELECT * FROM convivialite
  ),
  deduped AS (
    SELECT DISTINCT ON (COALESCE(url_fichier, external_url)) *
    FROM all_medias
    WHERE COALESCE(url_fichier, external_url) IS NOT NULL
    ORDER BY COALESCE(url_fichier, external_url), source_rank, ordre NULLS LAST, created_at
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'type_media', type_media,
    'url_fichier', url_fichier,
    'external_url', external_url,
    'titre', titre,
    'description', description,
    'ordre', ordre,
    'duree_secondes', duree_secondes,
    'author_name', author_name
  ) ORDER BY source_rank, ordre NULLS LAST, created_at), '[]'::jsonb)
  INTO _result
  FROM deduped;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_event_medias(text) TO anon, authenticated;