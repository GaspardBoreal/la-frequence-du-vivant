-- Fix admin_initialization table security vulnerability
-- Replace public access with secure, controlled initialization checking

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can check initialization status" ON public.admin_initialization;

-- Create a more secure SELECT policy that only allows access in specific circumstances
CREATE POLICY "Restricted initialization status access"
ON public.admin_initialization
FOR SELECT
TO authenticated
USING (
  -- Only allow access if user is an existing admin
  public.check_is_admin_user(auth.uid())
);

-- Create a secure function to safely check initialization status
-- This function allows checking during legitimate setup scenarios
CREATE OR REPLACE FUNCTION public.check_system_initialization_safe()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  is_init boolean;
BEGIN
  -- First check if any admin users exist
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  
  -- If no admin users exist, this is likely a fresh system
  -- Allow checking initialization status for setup purposes
  IF admin_count = 0 THEN
    SELECT COALESCE(is_initialized, false) INTO is_init 
    FROM public.admin_initialization 
    LIMIT 1;
    RETURN is_init;
  END IF;
  
  -- If admin users exist, only allow current admin to check status
  IF public.check_is_admin_user(auth.uid()) THEN
    SELECT COALESCE(is_initialized, false) INTO is_init 
    FROM public.admin_initialization 
    LIMIT 1;
    RETURN is_init;
  END IF;
  
  -- For non-admin users when admins exist, always return true
  -- This prevents information disclosure while maintaining functionality
  RETURN true;
  
EXCEPTION
  WHEN OTHERS THEN
    -- On any error, assume system is initialized (fail secure)
    RETURN true;
END;
$$;

-- Update the existing is_system_initialized function to use the secure version
CREATE OR REPLACE FUNCTION public.is_system_initialized()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_system_initialization_safe();
$$;

-- Create a function specifically for the initialization process
-- This allows legitimate first-time setup without exposing details
CREATE OR REPLACE FUNCTION public.can_initialize_admin_system()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  is_init boolean;
BEGIN
  -- Check if any admin users exist
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  
  -- If admin users exist, system is already set up
  IF admin_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Check initialization status
  SELECT COALESCE(is_initialized, false) INTO is_init 
  FROM public.admin_initialization 
  LIMIT 1;
  
  -- Allow initialization if not yet initialized and no admins exist
  RETURN NOT is_init;
  
EXCEPTION
  WHEN OTHERS THEN
    -- On error, don't allow initialization (fail secure)
    RETURN false;
END;
$$;

-- Ensure the other policies are still appropriately restrictive
-- Keep the existing restrictive policies for INSERT, UPDATE, DELETE

-- Add security comments for documentation
COMMENT ON TABLE public.admin_initialization IS 'Admin system initialization status. Access restricted to prevent information disclosure. Use secure functions for legitimate checks.';
COMMENT ON FUNCTION public.check_system_initialization_safe() IS 'Secure function to check initialization status. Prevents information disclosure while allowing legitimate setup and admin operations.';
COMMENT ON FUNCTION public.can_initialize_admin_system() IS 'Secure function to determine if admin system initialization is allowed. Used during first-time setup process.';

-- Create an audit log entry for initialization checks (optional security enhancement)
CREATE OR REPLACE FUNCTION public.log_initialization_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log initialization status checks for security monitoring
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    details
  ) VALUES (
    (SELECT id FROM public.admin_users WHERE user_id = auth.uid() LIMIT 1),
    'initialization_status_check',
    jsonb_build_object(
      'timestamp', now(),
      'user_id', auth.uid(),
      'is_initialized', NEW.is_initialized
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the operation if logging fails
    RETURN NEW;
END;
$$;

-- Add trigger for audit logging (optional)
CREATE TRIGGER log_admin_initialization_access
  AFTER SELECT ON public.admin_initialization
  FOR EACH ROW
  WHEN (auth.uid() IS NOT NULL)
  EXECUTE FUNCTION public.log_initialization_check();