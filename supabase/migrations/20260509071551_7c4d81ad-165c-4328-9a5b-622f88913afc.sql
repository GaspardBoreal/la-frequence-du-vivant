-- Extend attach_pratique_to_marcheur to accept either a crew row id or an auth user id.
-- When p_user_id is given and no editorial crew row exists, a "shadow" row is auto-created
-- in exploration_marcheurs (linked via user_id), then used as marcheur_id.

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
  v_is_authorized boolean := false;
  v_curation record;
  v_marcheur_id uuid := p_marcheur_id;
  v_link_id uuid;
  v_profile record;
  v_next_ordre int;
  v_role text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Auth: admin OR ambassadeur/sentinelle
  SELECT
    (public.has_role(v_caller, 'admin'::app_role))
    OR EXISTS (
      SELECT 1 FROM public.community_profiles cp
      WHERE cp.user_id = v_caller
        AND cp.role IN ('ambassadeur', 'sentinelle')
    )
  INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to curate practices';
  END IF;

  -- Load curation
  SELECT id, exploration_id, sense
  INTO v_curation
  FROM public.exploration_curations
  WHERE id = p_curation_id;

  IF v_curation.id IS NULL THEN
    RAISE EXCEPTION 'Curation not found';
  END IF;

  IF v_curation.sense <> 'main' THEN
    RAISE EXCEPTION 'Only "main" curations can be linked to marcheurs';
  END IF;

  -- Resolve marcheur: either crew row id (existing path), or via user_id (shadow row create-or-fetch)
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

  -- Insert / update link
  INSERT INTO public.curation_marcheurs (curation_id, marcheur_id, role_label, created_by)
  VALUES (p_curation_id, v_marcheur_id, NULLIF(p_role_label, ''), v_caller)
  ON CONFLICT (curation_id, marcheur_id)
  DO UPDATE SET role_label = EXCLUDED.role_label
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;