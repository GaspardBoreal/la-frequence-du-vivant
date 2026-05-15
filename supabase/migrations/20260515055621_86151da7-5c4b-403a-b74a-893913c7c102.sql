
ALTER TABLE public.community_profiles
  ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'marcheur';

ALTER TABLE public.community_profiles
  DROP CONSTRAINT IF EXISTS community_profiles_statut_check;
ALTER TABLE public.community_profiles
  ADD CONSTRAINT community_profiles_statut_check
  CHECK (statut IN ('marcheur', 'invite'));

CREATE INDEX IF NOT EXISTS idx_community_profiles_statut ON public.community_profiles(statut);

CREATE TABLE IF NOT EXISTS public.event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.marche_events(id) ON DELETE SET NULL,
  invited_by_user_id uuid NOT NULL,
  invited_email text NOT NULL,
  invited_prenom text NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  consumed_at timestamptz,
  consumed_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_invitations_token ON public.event_invitations(token);
CREATE INDEX IF NOT EXISTS idx_event_invitations_event ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_email ON public.event_invitations(lower(invited_email));

ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_invitations admin all" ON public.event_invitations;
CREATE POLICY "event_invitations admin all"
  ON public.event_invitations FOR ALL
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "event_invitations owner read" ON public.event_invitations;
CREATE POLICY "event_invitations owner read"
  ON public.event_invitations FOR SELECT
  TO authenticated
  USING (invited_by_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.event_invited_readers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invitation_id uuid REFERENCES public.event_invitations(id) ON DELETE SET NULL,
  added_by_user_id uuid,
  promoted_to_participant_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_invited_readers_event ON public.event_invited_readers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invited_readers_user ON public.event_invited_readers(user_id);

ALTER TABLE public.event_invited_readers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_invited_readers admin all" ON public.event_invited_readers;
CREATE POLICY "event_invited_readers admin all"
  ON public.event_invited_readers FOR ALL
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "event_invited_readers self read" ON public.event_invited_readers;
CREATE POLICY "event_invited_readers self read"
  ON public.event_invited_readers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_invited_reader(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_invited_readers
    WHERE event_id = _event_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.consume_event_invitation(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.event_invitations%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  SELECT * INTO v_invitation FROM public.event_invitations WHERE token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  IF v_invitation.consumed_at IS NOT NULL THEN
    IF v_invitation.consumed_by_user_id = v_user_id THEN
      RETURN jsonb_build_object('success', true, 'event_id', v_invitation.event_id, 'already', true);
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'already_consumed');
  END IF;

  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  UPDATE public.event_invitations
    SET consumed_at = now(), consumed_by_user_id = v_user_id
    WHERE id = v_invitation.id;

  IF v_invitation.event_id IS NOT NULL THEN
    INSERT INTO public.event_invited_readers (event_id, user_id, invitation_id)
    VALUES (v_invitation.event_id, v_user_id, v_invitation.id)
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  UPDATE public.community_profiles
    SET statut = 'invite'
    WHERE user_id = v_user_id
      AND statut = 'marcheur'
      AND NOT EXISTS (
        SELECT 1 FROM public.marche_participations mp
        WHERE mp.user_id = v_user_id AND mp.validated_at IS NOT NULL
      );

  RETURN jsonb_build_object('success', true, 'event_id', v_invitation.event_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.consume_event_invitation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.peek_event_invitation(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.event_invitations%ROWTYPE;
  v_event_title text;
  v_inviter_prenom text;
BEGIN
  SELECT * INTO v_inv FROM public.event_invitations WHERE token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_token');
  END IF;
  IF v_inv.consumed_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_consumed');
  END IF;
  IF v_inv.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  SELECT title INTO v_event_title FROM public.marche_events WHERE id = v_inv.event_id;
  SELECT prenom INTO v_inviter_prenom FROM public.community_profiles WHERE user_id = v_inv.invited_by_user_id;

  RETURN jsonb_build_object(
    'valid', true,
    'invited_email', v_inv.invited_email,
    'invited_prenom', v_inv.invited_prenom,
    'event_id', v_inv.event_id,
    'event_title', v_event_title,
    'inviter_prenom', v_inviter_prenom,
    'expires_at', v_inv.expires_at
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.peek_event_invitation(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_event_invited_readers(_event_id uuid)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  user_id uuid,
  invitation_id uuid,
  added_by_user_id uuid,
  promoted_to_participant_at timestamptz,
  created_at timestamptz,
  prenom text,
  nom text,
  email text,
  invited_by_prenom text,
  source text,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.event_id,
    r.user_id,
    r.invitation_id,
    r.added_by_user_id,
    r.promoted_to_participant_at,
    r.created_at,
    cp.prenom,
    cp.nom,
    au.email::text AS email,
    inviter.prenom AS invited_by_prenom,
    CASE WHEN r.invitation_id IS NULL THEN 'manuel' ELSE 'invitation' END AS source,
    'inscrit'::text AS status
  FROM public.event_invited_readers r
  LEFT JOIN public.community_profiles cp ON cp.user_id = r.user_id
  LEFT JOIN auth.users au ON au.id = r.user_id
  LEFT JOIN public.community_profiles inviter
    ON inviter.user_id = COALESCE(
      (SELECT invited_by_user_id FROM public.event_invitations WHERE id = r.invitation_id),
      r.added_by_user_id
    )
  WHERE r.event_id = _event_id

  UNION ALL

  SELECT
    i.id,
    i.event_id,
    NULL::uuid AS user_id,
    i.id AS invitation_id,
    i.invited_by_user_id AS added_by_user_id,
    NULL::timestamptz AS promoted_to_participant_at,
    i.created_at,
    i.invited_prenom AS prenom,
    NULL::text AS nom,
    i.invited_email AS email,
    inviter.prenom AS invited_by_prenom,
    'invitation'::text AS source,
    CASE WHEN i.expires_at < now() THEN 'expire' ELSE 'en_attente' END AS status
  FROM public.event_invitations i
  LEFT JOIN public.community_profiles inviter ON inviter.user_id = i.invited_by_user_id
  WHERE i.event_id = _event_id
    AND i.consumed_at IS NULL

  ORDER BY 7 DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_event_invited_readers(uuid) TO authenticated;
