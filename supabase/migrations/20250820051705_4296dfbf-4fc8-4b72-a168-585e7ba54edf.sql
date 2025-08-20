-- Ensure pgcrypto is installed in the correct schema on Supabase
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate function with access to extensions schema (for gen_salt, crypt)
CREATE OR REPLACE FUNCTION public.initialize_first_admin_direct(
  new_email text,
  new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  admin_count integer;
  is_init boolean;
  new_user_id uuid;
BEGIN
  -- Check if system is already initialized
  SELECT is_initialized INTO is_init FROM public.admin_initialization LIMIT 1;
  
  IF is_init THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le système est déjà initialisé');
  END IF;
  
  -- Check if any admin users exist
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  
  IF admin_count > 0 THEN
    -- Mark as initialized and return false
    UPDATE public.admin_initialization SET is_initialized = true, updated_at = now();
    RETURN jsonb_build_object('success', false, 'error', 'Des administrateurs existent déjà');
  END IF;
  
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users directly (bypassing confirmation)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    role,
    aud
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    new_email,
    crypt(new_password, gen_salt('bf'::text)),
    now(),
    now(),
    now(),
    '',
    '',
    'authenticated',
    'authenticated'
  );
  
  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', new_email),
    'email',
    now(),
    now()
  );
  
  -- Create admin user record
  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (new_user_id, new_email, 'admin');
  
  -- Mark system as initialized
  UPDATE public.admin_initialization SET is_initialized = true, updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true, 
    'user_id', new_user_id,
    'message', 'Premier administrateur créé avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;