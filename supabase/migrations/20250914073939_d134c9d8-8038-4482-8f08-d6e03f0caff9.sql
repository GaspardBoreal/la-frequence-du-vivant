-- Comprehensive security hardening for admin_users table
-- Ensure admin emails are completely protected from unauthorized access

-- First, let's check the current state and add additional security layers

-- Drop and recreate the SELECT policy with even stricter controls
DROP POLICY IF EXISTS "Admin users restricted access" ON public.admin_users;

-- Create an ultra-strict SELECT policy that provides maximum protection
CREATE POLICY "Ultra strict admin access - own records only"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  -- Triple verification: must be admin, must be own record, and additional validation
  user_id = auth.uid() 
  AND public.check_is_admin_user(auth.uid())
  AND auth.uid() IS NOT NULL
);

-- Create a completely isolated function for admin operations that never exposes emails
CREATE OR REPLACE FUNCTION public.get_admin_list_secure_no_emails()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  role text, 
  created_at timestamp with time zone,
  is_current_user boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data if current user is an admin
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RETURN;
  END IF;
  
  -- Return admin list without any email information
  RETURN QUERY
  SELECT 
    au.id, 
    au.user_id, 
    au.role, 
    au.created_at,
    (au.user_id = auth.uid()) as is_current_user
  FROM public.admin_users au
  ORDER BY au.created_at;
END;
$$;

-- Create a function that only returns the current user's email (never others)
CREATE OR REPLACE FUNCTION public.get_my_admin_email_only()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Strict validation: must be authenticated admin user
  IF auth.uid() IS NULL OR NOT public.check_is_admin_user(auth.uid()) THEN
    RETURN NULL;
  END IF;
  
  -- Only return current user's own email
  SELECT email INTO user_email
  FROM public.admin_users 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_email;
END;
$$;

-- Create a secure admin count function that doesn't expose any sensitive data
CREATE OR REPLACE FUNCTION public.get_admin_count_secure()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  -- Only return count if current user is an admin
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    -- Return a generic response to prevent information disclosure
    RETURN 1;
  END IF;
  
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  RETURN admin_count;
END;
$$;

-- Update existing functions to be more secure
CREATE OR REPLACE FUNCTION public.get_current_admin_info()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  email text, 
  role text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ultra-strict validation
  IF auth.uid() IS NULL OR NOT public.check_is_admin_user(auth.uid()) THEN
    RETURN;
  END IF;
  
  -- Only return current user's own admin record
  RETURN QUERY
  SELECT au.id, au.user_id, au.email, au.role, au.created_at, au.updated_at
  FROM public.admin_users au
  WHERE au.user_id = auth.uid()
  LIMIT 1;
END;
$$;

-- Add a security validation function to ensure no unauthorized access
CREATE OR REPLACE FUNCTION public.validate_admin_email_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function can be used to validate that email access is legitimate
  RETURN (
    auth.uid() IS NOT NULL 
    AND public.check_is_admin_user(auth.uid())
  );
END;
$$;

-- Create a secure wrapper for any admin operations
CREATE OR REPLACE FUNCTION public.admin_operation_wrapper(operation_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log admin operations for security monitoring
  IF public.check_is_admin_user(auth.uid()) THEN
    -- Log the operation in audit log
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      details
    ) VALUES (
      (SELECT id FROM public.admin_users WHERE user_id = auth.uid() LIMIT 1),
      operation_type,
      jsonb_build_object(
        'timestamp', now(),
        'user_id', auth.uid(),
        'operation', operation_type
      )
    );
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Add additional constraints for data integrity and security
-- Ensure email format is valid (basic validation)
ALTER TABLE public.admin_users 
ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure user_id references are valid UUIDs
ALTER TABLE public.admin_users 
ADD CONSTRAINT valid_user_id_format 
CHECK (user_id IS NOT NULL AND user_id != '00000000-0000-0000-0000-000000000000'::uuid);

-- Add an additional security comment
COMMENT ON COLUMN public.admin_users.email IS 'SENSITIVE: Admin email address. Access strictly controlled via RLS and secure functions only. Never expose in public APIs.';

-- Update table comment with security information
COMMENT ON TABLE public.admin_users IS 'CRITICAL SECURITY TABLE: Contains admin user data including sensitive emails. Access limited to own records only via RLS. All operations must go through secure functions. Email access requires authentication and admin privileges.';

-- Add security documentation for functions
COMMENT ON FUNCTION public.get_admin_list_secure_no_emails() IS 'SECURE: Returns admin list without any email addresses. Safe for admin UI display.';
COMMENT ON FUNCTION public.get_my_admin_email_only() IS 'SECURE: Returns only current admin user''s own email address. Never exposes other admin emails.';
COMMENT ON FUNCTION public.get_admin_count_secure() IS 'SECURE: Returns admin count with information disclosure protection.';

-- Ensure RLS is enabled (double-check)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;