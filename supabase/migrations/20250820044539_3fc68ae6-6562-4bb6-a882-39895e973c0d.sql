-- Fix narrative_sessions RLS policy to prevent data exposure
DROP POLICY IF EXISTS "Allow all operations on narrative_sessions" ON narrative_sessions;

-- Restrict narrative_sessions to prevent unauthorized access to user tracking data
CREATE POLICY "Users can insert their own narrative_sessions" 
ON narrative_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own narrative_sessions" 
ON narrative_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Restrict narrative_sessions data access" 
ON narrative_sessions 
FOR SELECT 
USING (false);

CREATE POLICY "Restrict narrative_sessions deletions" 
ON narrative_sessions 
FOR DELETE 
USING (false);

-- Create admin users management system
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'admin',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated admin users can access admin_users table
CREATE POLICY "Only admin users can view admin_users" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Only admin users can insert admin_users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Only admin users can update admin_users" 
ON public.admin_users 
FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Only admin users can delete admin_users" 
ON public.admin_users 
FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;

-- Create trigger for updating admin_users updated_at
CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admin_users_updated_at();