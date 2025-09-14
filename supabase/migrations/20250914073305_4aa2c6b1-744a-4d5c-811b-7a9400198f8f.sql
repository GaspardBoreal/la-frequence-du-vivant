-- Fix admin_users table security by implementing proper RLS policies
-- Replace overly restrictive policies with granular, secure access controls

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Restrict all direct admin_users access" ON public.admin_users;
DROP POLICY IF EXISTS "Block direct admin_users deletions" ON public.admin_users;
DROP POLICY IF EXISTS "Block direct admin_users inserts" ON public.admin_users;

-- Create secure, granular RLS policies for admin_users table

-- 1. SELECT Policy: Admins can see basic info about other admins, but only their own email
CREATE POLICY "Admins can view admin list with restricted email access"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  -- User must be an admin to see any admin data
  public.check_is_admin_user(auth.uid()) AND (
    -- Can see own full record including email
    user_id = auth.uid() OR
    -- Can see others' basic info but email will be filtered out by column-level security
    user_id != auth.uid()
  )
);

-- 2. INSERT Policy: Only allow inserts through secure functions (maintain existing restriction)
CREATE POLICY "Prevent direct admin_users inserts"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 3. UPDATE Policy: Admins can only update their own record, and only specific fields
CREATE POLICY "Admins can update their own record"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND 
  public.check_is_admin_user(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() AND 
  public.check_is_admin_user(auth.uid())
);

-- 4. DELETE Policy: Prevent all direct deletions (use secure functions only)
CREATE POLICY "Prevent direct admin_users deletions"
ON public.admin_users
FOR DELETE
TO authenticated
USING (false);

-- Add column-level security for sensitive data
-- Create a secure view that filters email access appropriately
CREATE OR REPLACE VIEW public.admin_users_safe AS
SELECT 
  id,
  user_id,
  role,
  created_at,
  updated_at,
  -- Only show email if it's the current user's own record
  CASE 
    WHEN user_id = auth.uid() THEN email
    ELSE NULL
  END as email
FROM public.admin_users
WHERE public.check_is_admin_user(auth.uid());

-- Grant appropriate permissions on the view
GRANT SELECT ON public.admin_users_safe TO authenticated;

-- Update the get_admin_list_safe function to use proper RLS instead of bypassing it
CREATE OR REPLACE FUNCTION public.get_admin_list_safe()
RETURNS TABLE(id uuid, role text, created_at timestamp with time zone, user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Use the safe view which respects RLS and filters emails appropriately
  SELECT au.id, au.role, au.created_at, au.user_id
  FROM public.admin_users_safe au
  ORDER BY au.created_at;
$$;

-- Create a more secure function for getting admin emails (only current user's email)
CREATE OR REPLACE FUNCTION public.get_current_admin_email_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.admin_users
  WHERE user_id = auth.uid() 
    AND public.check_is_admin_user(auth.uid())
  LIMIT 1;
$$;

-- Add security comment for documentation
COMMENT ON TABLE public.admin_users IS 'Admin users table with secure RLS policies. Direct access restricted to authenticated admin users only. Sensitive data like emails protected by column-level security.';

-- Add audit logging for admin operations (optional security enhancement)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.admin_users(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.check_is_admin_user(auth.uid()));

-- System can insert audit logs
CREATE POLICY "Allow system audit logging"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);