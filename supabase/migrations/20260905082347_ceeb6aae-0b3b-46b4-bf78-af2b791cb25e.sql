CREATE OR REPLACE FUNCTION public.admin_get_profile_emails(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id AS user_id,
    u.email::text AS email
  FROM auth.users u
  WHERE u.id = ANY(user_ids)
    AND public.check_is_admin_user(auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_profile_emails(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_profile_emails(uuid[]) TO service_role;
