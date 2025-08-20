-- Create admin initialization table
CREATE TABLE public.admin_initialization (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_initialized boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_initialization
ALTER TABLE public.admin_initialization ENABLE ROW LEVEL SECURITY;

-- Allow public access to check initialization status
CREATE POLICY "Anyone can check initialization status" 
ON public.admin_initialization 
FOR SELECT 
USING (true);

-- Block direct modifications
CREATE POLICY "Block direct admin_initialization inserts" 
ON public.admin_initialization 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Block direct admin_initialization updates" 
ON public.admin_initialization 
FOR UPDATE 
USING (false);

CREATE POLICY "Block direct admin_initialization deletions" 
ON public.admin_initialization 
FOR DELETE 
USING (false);

-- Insert initial record
INSERT INTO public.admin_initialization (is_initialized) VALUES (false);

-- Function to check if system is initialized
CREATE OR REPLACE FUNCTION public.is_system_initialized()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_initialized FROM public.admin_initialization LIMIT 1),
    false
  );
$function$;

-- Function to initialize first admin (only works if no admins exist)
CREATE OR REPLACE FUNCTION public.initialize_first_admin(
  new_user_id uuid,
  new_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_count integer;
  is_init boolean;
BEGIN
  -- Check if system is already initialized
  SELECT is_initialized INTO is_init FROM public.admin_initialization LIMIT 1;
  
  IF is_init THEN
    RETURN false;
  END IF;
  
  -- Check if any admin users exist
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  
  IF admin_count > 0 THEN
    -- Mark as initialized and return false
    UPDATE public.admin_initialization SET is_initialized = true, updated_at = now();
    RETURN false;
  END IF;
  
  -- Create first admin user
  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (new_user_id, new_email, 'admin');
  
  -- Mark system as initialized
  UPDATE public.admin_initialization SET is_initialized = true, updated_at = now();
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;