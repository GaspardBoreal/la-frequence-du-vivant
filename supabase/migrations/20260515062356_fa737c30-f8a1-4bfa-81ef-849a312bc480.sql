CREATE OR REPLACE FUNCTION public.search_community_profiles_for_invite(
  _event_id uuid,
  _search text
)
RETURNS TABLE (
  user_id uuid,
  prenom text,
  nom text,
  email text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _search IS NULL OR length(trim(_search)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cp.user_id,
    cp.prenom,
    cp.nom,
    u.email::text AS email,
    cp.avatar_url
  FROM public.community_profiles cp
  LEFT JOIN auth.users u ON u.id = cp.user_id
  WHERE (
    cp.prenom ILIKE '%' || _search || '%'
    OR cp.nom ILIKE '%' || _search || '%'
    OR u.email ILIKE '%' || _search || '%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.event_invited_readers eir
    WHERE eir.event_id = _event_id AND eir.user_id = cp.user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.marche_participations mp
    WHERE mp.marche_event_id = _event_id
      AND mp.user_id = cp.user_id
      AND mp.validated_at IS NOT NULL
  )
  ORDER BY cp.prenom, cp.nom
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_existing_reader_to_event(
  _event_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_reader boolean;
  v_already_participant boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.marche_participations mp
    WHERE mp.marche_event_id = _event_id
      AND mp.user_id = _user_id
      AND mp.validated_at IS NOT NULL
  ) INTO v_already_participant;

  IF v_already_participant THEN
    RETURN jsonb_build_object('success', false, 'already_participant', true);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.event_invited_readers
    WHERE event_id = _event_id AND user_id = _user_id
  ) INTO v_already_reader;

  IF v_already_reader THEN
    RETURN jsonb_build_object('success', false, 'already_reader', true);
  END IF;

  INSERT INTO public.event_invited_readers (event_id, user_id, invitation_id, added_by_user_id)
  VALUES (_event_id, _user_id, NULL, auth.uid());

  UPDATE public.community_profiles
  SET statut = 'invite'
  WHERE user_id = _user_id
    AND (statut IS NULL OR statut = 'marcheur')
    AND NOT EXISTS (
      SELECT 1 FROM public.marche_participations mp
      WHERE mp.user_id = _user_id AND mp.validated_at IS NOT NULL
    );

  RETURN jsonb_build_object('success', true);
END;
$$;