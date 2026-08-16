-- La création s'appuie désormais sur les deux triggers existants :
--   * trg_proprietes_slug              -> génère le slug
--   * trg_sync_propriete_main_walker_access -> crée le lien 'proprietaire'
-- La fonction ne fait plus que valider, protéger et insérer la propriété.
CREATE OR REPLACE FUNCTION public.onboard_create_propriete(
  _nom          TEXT,
  _ville        TEXT DEFAULT NULL,
  _code_postal  TEXT DEFAULT NULL,
  _latitude     DOUBLE PRECISION DEFAULT NULL,
  _longitude    DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_profile_id UUID;
  v_nom        TEXT := btrim(coalesce(_nom, ''));
  v_recent     INT;
  v_new        RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;

  IF length(v_nom) < 2 OR length(v_nom) > 120 THEN
    RAISE EXCEPTION 'Le nom du jardin doit contenir entre 2 et 120 caractères'
      USING ERRCODE = '22023';
  END IF;

  IF _latitude IS NOT NULL AND (_latitude < -90 OR _latitude > 90) THEN
    RAISE EXCEPTION 'Latitude invalide' USING ERRCODE = '22023';
  END IF;
  IF _longitude IS NOT NULL AND (_longitude < -180 OR _longitude > 180) THEN
    RAISE EXCEPTION 'Longitude invalide' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil marcheur associé à ce compte'
      USING ERRCODE = '42501';
  END IF;

  -- Garde-fou anti-abus : 3 créations maximum par 24 h.
  SELECT count(*) INTO v_recent
  FROM public.proprietes
  WHERE created_by = v_uid
    AND created_at > now() - INTERVAL '24 hours';

  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Limite atteinte : 3 jardins maximum par 24 heures'
      USING ERRCODE = '54000';
  END IF;

  -- Garde-fou anti-doublon pour ce même profil.
  IF EXISTS (
    SELECT 1 FROM public.proprietes p
    WHERE p.is_active = true
      AND p.main_walker_id = v_profile_id
      AND lower(btrim(p.nom)) = lower(v_nom)
      AND coalesce(p.code_postal, '') = coalesce(nullif(btrim(_code_postal), ''), '')
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà un jardin portant ce nom à cette adresse'
      USING ERRCODE = '23505';
  END IF;

  -- INSERT seul : jamais d'UPDATE ni de DELETE sur une ligne existante.
  -- slug + lien propriete_marcheurs sont posés par les triggers.
  INSERT INTO public.proprietes (
    nom, ville, code_postal, latitude, longitude,
    main_walker_id, created_by, is_active
  ) VALUES (
    v_nom,
    nullif(btrim(_ville), ''),
    nullif(btrim(_code_postal), ''),
    _latitude, _longitude,
    v_profile_id, v_uid, true
  )
  RETURNING id, nom, slug INTO v_new;

  RETURN jsonb_build_object('id', v_new.id, 'nom', v_new.nom, 'slug', v_new.slug);
END;
$$;

REVOKE ALL ON FUNCTION public.onboard_create_propriete(TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onboard_create_propriete(TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;