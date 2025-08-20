-- Fix circular dependency in admin_users RLS policies
-- The current policies create a circular dependency where we query admin_users to protect admin_users

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Only admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admin users can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admin users can delete admin_users" ON public.admin_users;

-- Create a secure function that can check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.check_is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- This function runs with elevated privileges and bypasses RLS
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = check_user_id
  );
$$;

-- Create new secure RLS policies using the security definer function
-- Only allow viewing admin_users if the current user is verified as admin
CREATE POLICY "Verified admin users can view admin_users" 
ON public.admin_users 
FOR SELECT 
USING (public.check_is_admin_user(auth.uid()));

-- Only allow inserting new admin users if current user is verified as admin
CREATE POLICY "Verified admin users can insert admin_users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (public.check_is_admin_user(auth.uid()));

-- Only allow updating admin users if current user is verified as admin
CREATE POLICY "Verified admin users can update admin_users" 
ON public.admin_users 
FOR UPDATE 
USING (public.check_is_admin_user(auth.uid()));

-- Only allow deleting admin users if current user is verified as admin  
CREATE POLICY "Verified admin users can delete admin_users" 
ON public.admin_users 
FOR DELETE 
USING (public.check_is_admin_user(auth.uid()));

-- Update the existing is_admin_user function to use the secure check
DROP FUNCTION IF EXISTS public.is_admin_user();

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER  
SET search_path = 'public'
AS $$
  SELECT public.check_is_admin_user(auth.uid());
$$;

-- Add additional security: Create a function to safely get current admin user info
CREATE OR REPLACE FUNCTION public.get_current_admin_user()
RETURNS TABLE(id uuid, email text, role text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT au.id, au.email, au.role, au.created_at
  FROM public.admin_users au
  WHERE au.user_id = auth.uid()
  LIMIT 1;
$$;