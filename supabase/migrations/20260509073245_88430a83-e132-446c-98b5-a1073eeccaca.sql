CREATE OR REPLACE FUNCTION public.attach_pratique_to_marcheur(
  p_curation_id uuid,
  p_marcheur_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_role_label text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := false;
  v_is_authorized boolean := false;
  v_curation record;
  v_marcheur_id uuid := p_marcheur_id;
  v_link_id uuid;
  v_profile record;
  v_next_ordre int;
  v_role text;
  v_max_order int;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_caller AND role = 'admin'::public.crm_role
  ) INTO v_is_admin;

  IF v_is_admin THEN
    v_is_authorized := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.community_profiles cp
      WHERE cp.user_id = v_caller
        AND cp.role IN ('ambassadeur', 'sentinelle')
    ) INTO v_is_authorized;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Permission refusée : ambassadeur, sentinelle ou admin requis';
  END IF;

  SELECT id, exploration_id, sense
  INTO v_curation
  FROM public.exploration_curations
  WHERE id = p_curation_id;

  IF v_curation.id IS NULL THEN
    RAISE EXCEPTION 'Pratique introuvable';
  END IF;

  IF v_curation.sense <> 'main' THEN
    RAISE EXCEPTION 'Seules les curations La Main peuvent être liées à un marcheur';
  END IF;

  IF v_marcheur_id IS NULL THEN
    IF p_user_id IS NULL THEN
      RAISE EXCEPTION 'Either p_marcheur_id or p_user_id is required';
    END IF;

    SELECT id INTO v_marcheur_id
    FROM public.exploration_marcheurs
    WHERE exploration_id = v_curation.exploration_id
      AND user_id = p_user_id
    LIMIT 1;

    IF v_marcheur_id IS NULL THEN
      SELECT user_id, prenom, nom, avatar_url, role
      INTO v_profile
      FROM public.community_profiles
      WHERE user_id = p_user_id
      LIMIT 1;

      IF v_profile.user_id IS NULL THEN
        RAISE EXCEPTION 'Community profile not found for user';
      END IF;

      SELECT COALESCE(MAX(ordre), 0) + 1
      INTO v_next_ordre
      FROM public.exploration_marcheurs
      WHERE exploration_id = v_curation.exploration_id;

      v_role := COALESCE(v_profile.role, 'marcheur');

      INSERT INTO public.exploration_marcheurs (
        exploration_id, user_id, prenom, nom, avatar_url, role, couleur, ordre
      ) VALUES (
        v_curation.exploration_id,
        p_user_id,
        COALESCE(v_profile.prenom, 'Marcheur'),
        COALESCE(v_profile.nom, ''),
        v_profile.avatar_url,
        v_role,
        '#10b981',
        v_next_ordre
      )
      RETURNING id INTO v_marcheur_id;
    END IF;
  END IF;

  SELECT COALESCE(MAX(display_order), -1) + 1 INTO v_max_order
  FROM public.curation_marcheurs WHERE curation_id = p_curation_id;

  INSERT INTO public.curation_marcheurs (curation_id, marcheur_id, role_label, display_order, created_by)
  VALUES (p_curation_id, v_marcheur_id, NULLIF(TRIM(p_role_label), ''), v_max_order, v_caller)
  ON CONFLICT (curation_id, marcheur_id)
  DO UPDATE SET role_label = EXCLUDED.role_label
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.detach_pratique_from_marcheur(
  p_curation_id uuid,
  p_marcheur_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_is_authorized boolean := false;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_uid AND role = 'admin'::public.crm_role
  ) INTO v_is_admin;

  IF v_is_admin THEN
    v_is_authorized := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.community_profiles cp
      WHERE cp.user_id = v_uid
        AND cp.role IN ('ambassadeur', 'sentinelle')
    ) INTO v_is_authorized;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Permission refusée : ambassadeur, sentinelle ou admin requis';
  END IF;

  DELETE FROM public.curation_marcheurs
  WHERE curation_id = p_curation_id AND marcheur_id = p_marcheur_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_pratique_to_marcheur(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.detach_pratique_from_marcheur(uuid, uuid) TO authenticated;