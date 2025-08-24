-- Fix admin_users RLS policies to prevent email harvesting
-- Drop ALL existing SELECT policies and implement secure access only

-- Drop all existing policies on admin_users table
DROP POLICY IF EXISTS "Users can only view their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Block direct admin_users access" ON public.admin_users;

-- Create a highly restrictive policy that completely blocks direct SELECT access
-- All admin data access must go through secure functions only
CREATE POLICY "Restrict all direct admin_users access" 
ON public.admin_users 
FOR SELECT 
USING (false);

-- Ensure secure functions exist and are properly protected
CREATE OR REPLACE FUNCTION public.get_current_admin_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only return email for the authenticated user who is confirmed as admin
  SELECT CASE 
    WHEN public.check_is_admin_user(auth.uid()) THEN email
    ELSE NULL
  END
  FROM public.admin_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$function$;

-- Function to get admin list without exposing emails
CREATE OR REPLACE FUNCTION public.get_admin_list_safe()
RETURNS TABLE(id uuid, role text, created_at timestamp with time zone, user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only allow current admins to see basic info (no emails)
  SELECT au.id, au.role, au.created_at, au.user_id
  FROM public.admin_users au
  WHERE public.check_is_admin_user(auth.uid())
  ORDER BY au.created_at;
$function$;

-- Update current admin user function
CREATE OR REPLACE FUNCTION public.get_current_admin_user()
RETURNS TABLE(id uuid, role text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT au.id, au.role, au.created_at
  FROM public.admin_users au
  WHERE au.user_id = auth.uid() 
    AND public.check_is_admin_user(auth.uid())
  LIMIT 1;
$function$;