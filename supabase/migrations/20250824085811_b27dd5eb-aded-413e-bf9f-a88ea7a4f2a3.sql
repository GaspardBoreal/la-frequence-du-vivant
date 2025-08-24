-- Review and secure all admin-related functions to prevent email exposure

-- Update create_admin_user to ensure only current admins can use it
CREATE OR REPLACE FUNCTION public.create_admin_user(new_user_id uuid, new_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow if current user is already an admin
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RETURN false;
  END IF;
  
  -- Insert new admin user (function needs email for creation)
  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (new_user_id, new_email, 'admin');
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

-- Secure the initialization functions to prevent unauthorized access
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
  -- Only allow if no admins exist yet (system uninitialized)
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  
  IF admin_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Des administrateurs existent déjà');
  END IF;

  -- Find user by email  
  SELECT id INTO uid FROM auth.users WHERE email = target_email LIMIT 1;

  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aucun utilisateur avec cet email');
  END IF;

  -- Confirm email and create admin
  UPDATE auth.users SET email_confirmed_at = now(), updated_at = now() WHERE id = uid;
  INSERT INTO public.admin_users (user_id, email, role) VALUES (uid, target_email, 'admin');

  -- Mark system as initialized
  INSERT INTO public.admin_initialization (is_initialized) VALUES (true) 
  ON CONFLICT (id) DO UPDATE SET is_initialized = true, updated_at = now();

  RETURN jsonb_build_object('success', true, 'user_id', uid, 'message', 'Premier administrateur créé');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Remove any functions that might expose admin emails unnecessarily
-- The confirm_admin_email function should also be restricted
CREATE OR REPLACE FUNCTION public.confirm_admin_email(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  uid uuid;
BEGIN
  -- Only allow if current user is admin or system is uninitialized
  IF NOT (public.check_is_admin_user(auth.uid()) OR 
          (SELECT COUNT(*) FROM public.admin_users) = 0) THEN
    RETURN false;
  END IF;
  
  -- Find user by email
  SELECT id INTO uid FROM auth.users WHERE email = target_email LIMIT 1;
  
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Ensure the email/user is registered as admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = target_email OR user_id = uid
  ) THEN
    RETURN false;
  END IF;
  
  -- Force confirm the email
  UPDATE auth.users 
  SET email_confirmed_at = now(), updated_at = now()
  WHERE id = uid;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;