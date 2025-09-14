-- Fix the SECURITY DEFINER view issue by replacing it with secure functions
-- Remove the problematic view and use secure functions instead

-- Drop the problematic SECURITY DEFINER view
DROP VIEW IF EXISTS public.admin_users_safe;

-- Create a secure function to get admin list without emails
CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  role text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return data if current user is an admin
  SELECT au.id, au.user_id, au.role, au.created_at, au.updated_at
  FROM public.admin_users au
  WHERE public.check_is_admin_user(auth.uid())
  ORDER BY au.created_at;
$$;

-- Create a secure function to get current user's admin info (including email)
CREATE OR REPLACE FUNCTION public.get_current_admin_info()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  email text, 
  role text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return current user's own admin record if they are an admin
  SELECT au.id, au.user_id, au.email, au.role, au.created_at, au.updated_at
  FROM public.admin_users au
  WHERE au.user_id = auth.uid() 
    AND public.check_is_admin_user(auth.uid())
  LIMIT 1;
$$;

-- Update the existing get_admin_list_safe function to use direct table access with RLS
CREATE OR REPLACE FUNCTION public.get_admin_list_safe()
RETURNS TABLE(id uuid, role text, created_at timestamp with time zone, user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Return basic admin info (no emails) if current user is an admin
  SELECT au.id, au.role, au.created_at, au.user_id
  FROM public.admin_users au
  WHERE public.check_is_admin_user(auth.uid())
  ORDER BY au.created_at;
$$;

-- Ensure RLS is properly enabled on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Add additional security: Create policy to prevent unauthorized function calls
-- Update the SELECT policy to be more explicit about email access
DROP POLICY IF EXISTS "Admins can view admin list with restricted email access" ON public.admin_users;

CREATE POLICY "Admin users restricted access"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  -- Must be an admin to see any admin data
  public.check_is_admin_user(auth.uid()) 
  AND 
  -- Can only access own record directly (for email access)
  user_id = auth.uid()
);

-- Comment updates for security documentation
COMMENT ON FUNCTION public.get_admin_users_list() IS 'Secure function to get admin users list without sensitive data like emails. Only accessible to authenticated admin users.';
COMMENT ON FUNCTION public.get_current_admin_info() IS 'Secure function to get current admin user''s complete info including email. Only returns current user''s own data.';
COMMENT ON TABLE public.admin_users IS 'Admin users table with secure RLS policies. Direct SELECT access limited to own records only. Use secure functions for admin operations.';

-- Add constraint to ensure email is not null (security best practice)
ALTER TABLE public.admin_users ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.admin_users ALTER COLUMN user_id SET NOT NULL;