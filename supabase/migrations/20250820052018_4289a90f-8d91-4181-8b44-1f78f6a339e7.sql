-- Confirm admin email utility: sets email_confirmed_at for admin emails only
CREATE OR REPLACE FUNCTION public.confirm_admin_email(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  uid uuid;
BEGIN
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