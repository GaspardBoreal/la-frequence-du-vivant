-- Fix function search path security issues by properly dropping dependencies
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
DROP FUNCTION IF EXISTS public.update_admin_users_updated_at();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Recreate functions with proper search_path settings for security
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admin_users_updated_at();