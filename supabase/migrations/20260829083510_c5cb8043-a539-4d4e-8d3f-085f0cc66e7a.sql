-- 1. Création de jardin : accepte les réponses d'onboarding
DROP FUNCTION IF EXISTS public.onboard_create_propriete(text, text, text, double precision, double precision);

CREATE OR REPLACE FUNCTION public.onboard_create_propriete(
  _nom text,
  _ville text DEFAULT NULL::text,
  _code_postal text DEFAULT NULL::text,
  _latitude double precision DEFAULT NULL::double precision,
  _longitude double precision DEFAULT NULL::double precision,
  _preferences jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid        UUID := auth.uid();
  v_profile_id UUID;
  v_nom        TEXT := btrim(coalesce(_nom, ''));
  v_recent     INT;
  v_prefs      JSONB := coalesce(_preferences, '{}'::jsonb);
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

  IF jsonb_typeof(v_prefs) <> 'object' THEN
    RAISE EXCEPTION 'Préférences invalides' USING ERRCODE = '22023';
  END IF;
  IF pg_column_size(v_prefs) > 100000 THEN
    RAISE EXCEPTION 'Préférences trop volumineuses' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil marcheur associé à ce compte'
      USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.proprietes
  WHERE created_by = v_uid
    AND created_at > now() - INTERVAL '24 hours';

  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Limite atteinte : 3 jardins maximum par 24 heures'
      USING ERRCODE = '54000';
  END IF;

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

  INSERT INTO public.proprietes (
    nom, ville, code_postal, latitude, longitude,
    main_walker_id, created_by, is_active, onboarding_preferences
  ) VALUES (
    v_nom,
    nullif(btrim(_ville), ''),
    nullif(btrim(_code_postal), ''),
    _latitude, _longitude,
    v_profile_id, v_uid, true, v_prefs
  )
  RETURNING id, nom, slug INTO v_new;

  RETURN jsonb_build_object('id', v_new.id, 'nom', v_new.nom, 'slug', v_new.slug);
END;
$function$;

REVOKE ALL ON FUNCTION public.onboard_create_propriete(text, text, text, double precision, double precision, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onboard_create_propriete(text, text, text, double precision, double precision, jsonb) TO authenticated;

-- 2. Qui peut éditer l'intention d'un jardin
CREATE OR REPLACE FUNCTION public.can_edit_propriete_onboarding(_propriete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.check_is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.proprietes p
      JOIN public.community_profiles cp ON cp.id = p.main_walker_id
      WHERE p.id = _propriete_id AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = _propriete_id
        AND cp.user_id = auth.uid()
        AND pm.role = 'proprietaire'::role_propriete
    );
$function$;

GRANT EXECUTE ON FUNCTION public.can_edit_propriete_onboarding(uuid) TO authenticated;

-- 3. Mise à jour fusionnée des réponses d'onboarding
CREATE OR REPLACE FUNCTION public.save_propriete_onboarding(
  _propriete_id uuid,
  _patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_patch  JSONB := coalesce(_patch, '{}'::jsonb);
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;

  IF NOT public.can_edit_propriete_onboarding(_propriete_id) THEN
    RAISE EXCEPTION 'Accès refusé à ce jardin' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(v_patch) <> 'object' THEN
    RAISE EXCEPTION 'Préférences invalides' USING ERRCODE = '22023';
  END IF;
  IF pg_column_size(v_patch) > 100000 THEN
    RAISE EXCEPTION 'Préférences trop volumineuses' USING ERRCODE = '22023';
  END IF;

  UPDATE public.proprietes
  SET onboarding_preferences = coalesce(onboarding_preferences, '{}'::jsonb) || v_patch
  WHERE id = _propriete_id
  RETURNING onboarding_preferences INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Propriété introuvable' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_propriete_onboarding(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_propriete_onboarding(uuid, jsonb) TO authenticated;