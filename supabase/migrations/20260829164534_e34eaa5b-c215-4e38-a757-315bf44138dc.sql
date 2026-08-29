CREATE OR REPLACE FUNCTION public.onboard_claim_from_metadata()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid        UUID := auth.uid();
  v_meta       JSONB;
  v_onb        JSONB;
  v_nom        TEXT;
  v_ville      TEXT;
  v_cp         TEXT;
  v_lat        DOUBLE PRECISION;
  v_lng        DOUBLE PRECISION;
  v_prefs      JSONB;
  v_profile_id UUID;
  v_existing   RECORD;
  v_new        RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;

  SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = v_uid;
  v_meta := coalesce(v_meta, '{}'::jsonb);

  IF v_meta->>'app' IS DISTINCT FROM 'frequence-jardin' THEN
    RETURN jsonb_build_object('empty', true, 'reason', 'not_fj');
  END IF;

  v_onb := CASE WHEN jsonb_typeof(v_meta->'onboarding') = 'object'
                THEN v_meta->'onboarding' ELSE '{}'::jsonb END;

  v_nom := btrim(coalesce(
    nullif(v_onb->>'nom', ''),
    nullif(v_meta->>'garden_name', ''),
    ''
  ));
  v_ville := nullif(btrim(coalesce(v_onb->>'ville', '')), '');
  v_cp    := nullif(btrim(coalesce(v_onb->>'code_postal', v_meta->>'code_postal', '')), '');

  BEGIN
    v_lat := nullif(v_onb->>'latitude', '')::double precision;
    v_lng := nullif(v_onb->>'longitude', '')::double precision;
  EXCEPTION WHEN others THEN
    v_lat := NULL; v_lng := NULL;
  END;

  IF v_lat IS NOT NULL AND (v_lat < -90 OR v_lat > 90) THEN v_lat := NULL; END IF;
  IF v_lng IS NOT NULL AND (v_lng < -180 OR v_lng > 180) THEN v_lng := NULL; END IF;

  IF length(v_nom) < 2 OR length(v_nom) > 120 THEN
    RETURN jsonb_build_object('empty', true, 'reason', 'no_garden_name');
  END IF;

  v_prefs := CASE WHEN jsonb_typeof(v_onb->'preferences') = 'object'
                  THEN v_onb->'preferences'
                  ELSE v_onb - 'nom' - 'ville' - 'code_postal' - 'latitude' - 'longitude'
             END;
  IF jsonb_typeof(v_prefs) <> 'object' THEN v_prefs := '{}'::jsonb; END IF;
  IF pg_column_size(v_prefs) > 100000 THEN
    RAISE EXCEPTION 'Préférences trop volumineuses' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.community_profiles WHERE user_id = v_uid LIMIT 1;

  IF v_profile_id IS NULL THEN
    INSERT INTO public.community_profiles (user_id, prenom, nom, role)
    VALUES (
      v_uid,
      coalesce(nullif(v_meta->>'prenom', ''), 'Jardinier'),
      coalesce(nullif(v_meta->>'nom', ''), ''),
      'marcheur_en_devenir'
    )
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO v_profile_id
    FROM public.community_profiles WHERE user_id = v_uid LIMIT 1;
  END IF;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil marcheur associé à ce compte' USING ERRCODE = '42501';
  END IF;

  -- Idempotence : même nom (et même code postal) déjà versé pour ce compte
  SELECT p.id, p.slug INTO v_existing
  FROM public.proprietes p
  WHERE p.created_by = v_uid
    AND lower(btrim(p.nom)) = lower(v_nom)
    AND coalesce(p.code_postal, '') = coalesce(v_cp, '')
  ORDER BY p.created_at ASC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing.id, 'slug', v_existing.slug, 'created', false);
  END IF;

  INSERT INTO public.proprietes (
    nom, ville, code_postal, latitude, longitude,
    main_walker_id, created_by, is_active, onboarding_preferences
  ) VALUES (
    v_nom, v_ville, v_cp, v_lat, v_lng,
    v_profile_id, v_uid, true, v_prefs
  )
  RETURNING id, slug INTO v_new;

  RETURN jsonb_build_object('id', v_new.id, 'slug', v_new.slug, 'created', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.onboard_claim_from_metadata() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onboard_claim_from_metadata() TO authenticated;