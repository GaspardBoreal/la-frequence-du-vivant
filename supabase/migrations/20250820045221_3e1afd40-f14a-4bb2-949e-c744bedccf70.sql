-- Implement ultra-restrictive admin_users access control
-- Current issue: Table is still detected as publicly readable

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Verified admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Verified admin users can insert admin_users" ON public.admin_users; 
DROP POLICY IF EXISTS "Verified admin users can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Verified admin users can delete admin_users" ON public.admin_users;

-- Create extremely restrictive policies - users can ONLY see their own admin record
CREATE POLICY "Users can only view their own admin record" 
ON public.admin_users 
FOR SELECT 
USING (user_id = auth.uid());

-- Only allow self-updates (admins can only update their own record)
CREATE POLICY "Users can only update their own admin record" 
ON public.admin_users 
FOR UPDATE 
USING (user_id = auth.uid());

-- Completely block INSERT and DELETE operations through normal queries
-- These will only be possible through secure admin functions
CREATE POLICY "Block direct admin_users inserts" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Block direct admin_users deletions" 
ON public.admin_users 
FOR DELETE 
USING (false);

-- Create secure admin management functions that don't expose emails unnecessarily

-- Function to create admin users (only callable by existing admins)
CREATE OR REPLACE FUNCTION public.create_admin_user(new_user_id uuid, new_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow if current user is already an admin
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RETURN false;
  END IF;
  
  -- Insert new admin user
  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (new_user_id, new_email, 'admin');
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Function to remove admin users (only callable by existing admins)
CREATE OR REPLACE FUNCTION public.remove_admin_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow if current user is already an admin
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RETURN false;
  END IF;
  
  -- Don't allow self-deletion (prevent lockout)
  IF target_user_id = auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Remove admin user
  DELETE FROM public.admin_users WHERE user_id = target_user_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Function to get admin count (for monitoring, doesn't expose emails)
CREATE OR REPLACE FUNCTION public.get_admin_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.admin_users;
$$;

-- Update the get_current_admin_user function to be more secure
DROP FUNCTION IF EXISTS public.get_current_admin_user();

CREATE OR REPLACE FUNCTION public.get_current_admin_user()
RETURNS TABLE(id uuid, role text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Note: Deliberately excluding email from return to reduce exposure
  SELECT au.id, au.role, au.created_at
  FROM public.admin_users au
  WHERE au.user_id = auth.uid()
  LIMIT 1;
$$;

-- Create a separate secure function to get admin email only when absolutely needed
CREATE OR REPLACE FUNCTION public.get_current_admin_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email
  FROM public.admin_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;