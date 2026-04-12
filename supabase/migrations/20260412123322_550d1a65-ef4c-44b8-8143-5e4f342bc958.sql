
-- Fix get_public_shared_contribution: m.nom → m.nom_marche, m.lieu → m.ville
CREATE OR REPLACE FUNCTION public.get_public_shared_contribution(p_id uuid, p_type text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_type = 'texte' THEN
    SELECT jsonb_build_object(
      'id', t.id,
      'type', 'texte',
      'titre', t.titre,
      'contenu', t.contenu,
      'created_at', t.created_at,
      'marcheur', (
        SELECT jsonb_build_object(
          'prenom', cp.prenom,
          'slug', cp.slug,
          'avatar_url', cp.avatar_url
        )
        FROM community_profiles cp WHERE cp.user_id = t.user_id
      ),
      'marche', (
        SELECT jsonb_build_object(
          'nom', m.nom_marche,
          'lieu', m.ville
        )
        FROM marches m WHERE m.id = t.marche_id
      )
    ) INTO result
    FROM marcheur_textes t
    WHERE t.id = p_id AND t.shared_to_web = true;

  ELSIF p_type = 'photo' OR p_type = 'video' OR p_type = 'audio' THEN
    SELECT jsonb_build_object(
      'id', mm.id,
      'type', mm.type_media,
      'titre', mm.titre,
      'description', mm.description,
      'url_fichier', mm.url_fichier,
      'external_url', mm.external_url,
      'created_at', mm.created_at,
      'marcheur', (
        SELECT jsonb_build_object(
          'prenom', cp.prenom,
          'slug', cp.slug,
          'avatar_url', cp.avatar_url
        )
        FROM community_profiles cp WHERE cp.user_id = mm.user_id
      ),
      'marche', (
        SELECT jsonb_build_object(
          'nom', m.nom_marche,
          'lieu', m.ville
        )
        FROM marches m WHERE m.id = mm.marche_id
      )
    ) INTO result
    FROM marcheur_medias mm
    WHERE mm.id = p_id AND mm.shared_to_web = true;

  ELSIF p_type = 'son' THEN
    SELECT jsonb_build_object(
      'id', ma.id,
      'type', 'son',
      'titre', ma.titre,
      'description', ma.description,
      'url_fichier', ma.url_fichier,
      'created_at', ma.created_at,
      'marcheur', (
        SELECT jsonb_build_object(
          'prenom', cp.prenom,
          'slug', cp.slug,
          'avatar_url', cp.avatar_url
        )
        FROM community_profiles cp WHERE cp.user_id = ma.user_id
      ),
      'marche', (
        SELECT jsonb_build_object(
          'nom', m.nom_marche,
          'lieu', m.ville
        )
        FROM marches m WHERE m.id = ma.marche_id
      )
    ) INTO result
    FROM marcheur_audio ma
    WHERE ma.id = p_id AND ma.shared_to_web = true;
  END IF;

  RETURN result;
END;
$$;

-- Fix get_public_marcheur_carnet: m.nom → m.nom_marche
CREATE OR REPLACE FUNCTION public.get_public_marcheur_carnet(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data jsonb;
  textes_data jsonb;
  medias_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'prenom', cp.prenom,
    'slug', cp.slug,
    'avatar_url', cp.avatar_url,
    'role', cp.role,
    'marches_count', cp.marches_count
  ) INTO profile_data
  FROM community_profiles cp
  WHERE cp.slug = p_slug;

  IF profile_data IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'type', 'texte',
    'titre', t.titre,
    'contenu', LEFT(t.contenu, 300),
    'created_at', t.created_at,
    'marche_nom', m.nom_marche
  ) ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO textes_data
  FROM marcheur_textes t
  JOIN community_profiles cp ON cp.user_id = t.user_id
  LEFT JOIN marches m ON m.id = t.marche_id
  WHERE cp.slug = p_slug AND t.shared_to_web = true;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', mm.id,
    'type', mm.type_media,
    'titre', mm.titre,
    'url_fichier', mm.url_fichier,
    'external_url', mm.external_url,
    'created_at', mm.created_at,
    'marche_nom', m.nom_marche
  ) ORDER BY mm.created_at DESC), '[]'::jsonb)
  INTO medias_data
  FROM marcheur_medias mm
  JOIN community_profiles cp ON cp.user_id = mm.user_id
  LEFT JOIN marches m ON m.id = mm.marche_id
  WHERE cp.slug = p_slug AND mm.shared_to_web = true;

  RETURN jsonb_build_object(
    'profile', profile_data,
    'textes', textes_data,
    'medias', medias_data
  );
END;
$$;
