CREATE OR REPLACE FUNCTION public.grant_admin_access(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_email text;
  v_actor_admin_id uuid;
  v_target_email text;
BEGIN
  SELECT email INTO v_actor_email FROM auth.users WHERE id = auth.uid();
  IF v_actor_email IS NULL OR lower(v_actor_email) <> 'gaspard.boreal@gmail.com' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Seul le compte fondateur peut nommer un administrateur.');
  END IF;

  SELECT id INTO v_actor_admin_id FROM public.admin_users WHERE user_id = auth.uid();
  IF v_actor_admin_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Votre compte n''est pas répertorié comme administrateur.');
  END IF;

  SELECT email INTO v_target_email FROM auth.users WHERE id = _user_id;
  IF v_target_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Compte utilisateur introuvable.');
  END IF;

  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (_user_id, v_target_email, 'admin')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.admin_audit_log (admin_user_id, action, details)
  VALUES (v_actor_admin_id, 'grant_admin_access', jsonb_build_object('target_user_id', _user_id, 'target_email', v_target_email));

  RETURN jsonb_build_object('ok', true, 'message', 'Accès administrateur accordé à ' || v_target_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin_access(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_email text;
  v_actor_admin_id uuid;
  v_target_email text;
BEGIN
  SELECT email INTO v_actor_email FROM auth.users WHERE id = auth.uid();
  IF v_actor_email IS NULL OR lower(v_actor_email) <> 'gaspard.boreal@gmail.com' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Seul le compte fondateur peut retirer un accès administrateur.');
  END IF;

  IF _user_id = auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Le compte fondateur ne peut pas retirer son propre accès.');
  END IF;

  SELECT id INTO v_actor_admin_id FROM public.admin_users WHERE user_id = auth.uid();
  IF v_actor_admin_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Votre compte n''est pas répertorié comme administrateur.');
  END IF;

  SELECT email INTO v_target_email FROM auth.users WHERE id = _user_id;

  DELETE FROM public.admin_users WHERE user_id = _user_id;

  INSERT INTO public.admin_audit_log (admin_user_id, action, details)
  VALUES (v_actor_admin_id, 'revoke_admin_access', jsonb_build_object('target_user_id', _user_id, 'target_email', v_target_email));

  RETURN jsonb_build_object('ok', true, 'message', 'Accès administrateur retiré' || COALESCE(' à ' || v_target_email, ''));
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_admin_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_access(uuid) TO authenticated;