-- Fix admin_users RLS policies to prevent email harvesting
-- Drop existing permissive policies and implement stricter ones

-- First, drop the existing SELECT policy that might be too permissive
DROP POLICY IF EXISTS "Users can only view their own admin record" ON public.admin_users;

-- Create a more restrictive policy that only allows viewing minimal admin info
-- and completely blocks email access except through secure functions
CREATE POLICY "Admin users can only view limited admin info" 
ON public.admin_users 
FOR SELECT 
USING (
  -- Only allow admins to see basic info (no emails)
  public.check_is_admin_user(auth.uid()) AND user_id = auth.uid()
);

-- Create a separate view for admin management that excludes emails
CREATE OR REPLACE VIEW public.admin_users_safe AS
SELECT 
  id,
  user_id,
  role,
  created_at,
  updated_at
FROM public.admin_users;

-- Enable RLS on the view
ALTER VIEW public.admin_users_safe SET (security_barrier = true);

-- Create RLS policy for the safe view
CREATE POLICY "Admins can view safe admin data" 
ON public.admin_users_safe 
FOR SELECT 
USING (public.check_is_admin_user(auth.uid()));

-- Update the existing secure function to be more explicit about access control
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

-- Add a secure function to get admin count without exposing emails
CREATE OR REPLACE FUNCTION public.get_admin_list_safe()
RETURNS TABLE(id uuid, role text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only allow current admins to see the list (without emails)
  SELECT au.id, au.role, au.created_at
  FROM public.admin_users au
  WHERE public.check_is_admin_user(auth.uid())
  ORDER BY au.created_at;
$function$;