
-- 1. Drop overly permissive anonymous policies
DROP POLICY IF EXISTS "Public can view web-shared texts" ON public.marcheur_textes;
DROP POLICY IF EXISTS "Public can view web-shared medias" ON public.marcheur_medias;
DROP POLICY IF EXISTS "Public can view profiles by slug" ON public.community_profiles;

-- 2. Coherence trigger: shared_to_web=true => is_public must be true
CREATE OR REPLACE FUNCTION public.enforce_shared_to_web_coherence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.shared_to_web = true THEN
    NEW.is_public := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coherence_shared_web_textes ON public.marcheur_textes;
CREATE TRIGGER trg_coherence_shared_web_textes
  BEFORE INSERT OR UPDATE ON public.marcheur_textes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shared_to_web_coherence();

DROP TRIGGER IF EXISTS trg_coherence_shared_web_medias ON public.marcheur_medias;
CREATE TRIGGER trg_coherence_shared_web_medias
  BEFORE INSERT OR UPDATE ON public.marcheur_medias
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shared_to_web_coherence();

-- 3. RPC: get single public shared contribution
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
      'type_texte', t.type_texte,
      'created_at', t.created_at,
      'profile', (SELECT jsonb_build_object(
        'prenom', cp.prenom,
        'slug', cp.slug,
        'avatar_url', cp.avatar_url,
        'role', cp.role
      ) FROM community_profiles cp WHERE cp.user_id = t.user_id),
      'marche', (SELECT jsonb_build_object(
        'nom', m.nom,
        'lieu', m.lieu
      ) FROM marches m WHERE m.id = t.marche_id)
    ) INTO result
    FROM marcheur_textes t
    WHERE t.id = p_id AND t.shared_to_web = true;

  ELSIF p_type IN ('photo', 'video') THEN
    SELECT jsonb_build_object(
      'id', mm.id,
      'type', mm.type_media,
      'titre', mm.titre,
      'description', mm.description,
      'url', COALESCE(mm.url_fichier, mm.external_url),
      'created_at', mm.created_at,
      'profile', (SELECT jsonb_build_object(
        'prenom', cp.prenom,
        'slug', cp.slug,
        'avatar_url', cp.avatar_url,
        'role', cp.role
      ) FROM community_profiles cp WHERE cp.user_id = mm.user_id),
      'marche', (SELECT jsonb_build_object(
        'nom', m.nom,
        'lieu', m.lieu
      ) FROM marches m WHERE m.id = mm.marche_id)
    ) INTO result
    FROM marcheur_medias mm
    WHERE mm.id = p_id AND mm.shared_to_web = true;

  ELSIF p_type = 'audio' THEN
    SELECT jsonb_build_object(
      'id', ma.id,
      'type', 'audio',
      'titre', ma.titre,
      'description', ma.description,
      'url', ma.url_fichier,
      'duree_secondes', ma.duree_secondes,
      'created_at', ma.created_at,
      'profile', (SELECT jsonb_build_object(
        'prenom', cp.prenom,
        'slug', cp.slug,
        'avatar_url', cp.avatar_url,
        'role', cp.role
      ) FROM community_profiles cp WHERE cp.user_id = ma.user_id),
      'marche', (SELECT jsonb_build_object(
        'nom', m.nom,
        'lieu', m.lieu
      ) FROM marches m WHERE m.id = ma.marche_id)
    ) INTO result
    FROM marcheur_audio ma
    WHERE ma.id = p_id AND ma.is_public = true;
  END IF;

  RETURN result;
END;
$$;

-- 4. RPC: get public marcheur carnet by slug
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
  v_user_id uuid;
BEGIN
  -- Get profile (limited fields only)
  SELECT cp.user_id,
    jsonb_build_object(
      'prenom', cp.prenom,
      'slug', cp.slug,
      'avatar_url', cp.avatar_url,
      'role', cp.role,
      'marches_count', cp.marches_count
    )
  INTO v_user_id, profile_data
  FROM community_profiles cp
  WHERE cp.slug = p_slug;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get shared textes
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'type', 'texte',
    'titre', t.titre,
    'contenu', LEFT(t.contenu, 300),
    'type_texte', t.type_texte,
    'created_at', t.created_at,
    'marche_nom', m.nom
  ) ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO textes_data
  FROM marcheur_textes t
  LEFT JOIN marches m ON m.id = t.marche_id
  WHERE t.user_id = v_user_id AND t.shared_to_web = true;

  -- Get shared medias
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', mm.id,
    'type', mm.type_media,
    'titre', mm.titre,
    'url', COALESCE(mm.url_fichier, mm.external_url),
    'created_at', mm.created_at,
    'marche_nom', m.nom
  ) ORDER BY mm.created_at DESC), '[]'::jsonb)
  INTO medias_data
  FROM marcheur_medias mm
  LEFT JOIN marches m ON m.id = mm.marche_id
  WHERE mm.user_id = v_user_id AND mm.shared_to_web = true;

  RETURN jsonb_build_object(
    'profile', profile_data,
    'textes', textes_data,
    'medias', medias_data
  );
END;
$$;
