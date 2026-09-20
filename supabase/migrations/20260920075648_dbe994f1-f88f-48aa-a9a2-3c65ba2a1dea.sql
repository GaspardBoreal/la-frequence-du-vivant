
CREATE OR REPLACE FUNCTION public.is_founder_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN auth.users u ON u.id = au.user_id
    WHERE au.user_id = _user_id
      AND lower(u.email) = 'gaspard.boreal@gmail.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_access(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _email text;
BEGIN
  IF _caller IS NULL OR NOT public.is_founder_admin(_caller) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Seul le compte fondateur peut nommer un administrateur.');
  END IF;

  SELECT u.email::text INTO _email FROM auth.users u WHERE u.id = _user_id;
  IF _email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Compte introuvable.');
  END IF;

  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (_user_id, _email, 'admin')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.admin_audit_log (admin_user_id, action, details)
  VALUES (_caller, 'grant_admin_access', jsonb_build_object('target_user_id', _user_id, 'target_email', _email));

  RETURN jsonb_build_object('ok', true, 'message', 'Accès administrateur accordé.');
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin_access(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _email text;
BEGIN
  IF _caller IS NULL OR NOT public.is_founder_admin(_caller) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Seul le compte fondateur peut retirer un accès administrateur.');
  END IF;

  IF _user_id = _caller THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Vous ne pouvez pas retirer votre propre accès.');
  END IF;

  SELECT email INTO _email FROM public.admin_users WHERE user_id = _user_id;
  IF _email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Ce compte n''est pas administrateur.');
  END IF;

  DELETE FROM public.admin_users WHERE user_id = _user_id;

  INSERT INTO public.admin_audit_log (admin_user_id, action, details)
  VALUES (_caller, 'revoke_admin_access', jsonb_build_object('target_user_id', _user_id, 'target_email', _email));

  RETURN jsonb_build_object('ok', true, 'message', 'Accès administrateur retiré.');
END;
$$;

REVOKE ALL ON FUNCTION public.is_founder_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grant_admin_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_admin_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_founder_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_access(uuid) TO authenticated;
