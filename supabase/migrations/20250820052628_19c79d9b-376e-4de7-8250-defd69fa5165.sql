
-- Create a helper to initialize the first admin from an existing email
CREATE OR REPLACE FUNCTION public.initialize_first_admin_by_email(target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  admin_count integer;
  is_init boolean;
  uid uuid;
BEGIN
  -- Ensure admin_initialization has a row
  PERFORM 1 FROM public.admin_initialization LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.admin_initialization (is_initialized) VALUES (false);
  END IF;

  -- Check if system is already initialized
  SELECT is_initialized INTO is_init FROM public.admin_initialization LIMIT 1;

  IF is_init THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le système est déjà initialisé');
  END IF;

  -- Check if any admin users exist
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;

  IF admin_count > 0 THEN
    UPDATE public.admin_initialization SET is_initialized = true, updated_at = now();
    RETURN jsonb_build_object('success', false, 'error', 'Des administrateurs existent déjà');
  END IF;

  -- Find user by email
  SELECT id INTO uid FROM auth.users WHERE email = target_email LIMIT 1;

  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aucun utilisateur avec cet email');
  END IF;

  -- Confirm email
  UPDATE auth.users SET email_confirmed_at = now(), updated_at = now() WHERE id = uid;

  -- Create admin user record
  INSERT INTO public.admin_users (user_id, email, role) VALUES (uid, target_email, 'admin');

  -- Mark system as initialized
  UPDATE public.admin_initialization SET is_initialized = true, updated_at = now();

  RETURN jsonb_build_object('success', true, 'user_id', uid, 'message', 'Premier administrateur associé à l’utilisateur existant');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Initialize the first admin for your email
SELECT public.initialize_first_admin_by_email('gpied@gaspardboreal.com');
