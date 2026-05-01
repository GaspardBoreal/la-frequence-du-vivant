-- Update the can_upload_convivialite function to include admins and walk organizers
CREATE OR REPLACE FUNCTION public.can_upload_convivialite(_user_id uuid, _exploration_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
  _is_admin boolean;
  _is_organizer boolean;
BEGIN
  IF _user_id IS NULL OR _exploration_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check admin
  SELECT public.check_is_admin_user(_user_id) INTO _is_admin;
  IF _is_admin THEN
    RETURN true;
  END IF;

  -- Check community role (ambassadeur / sentinelle)
  SELECT role INTO _role
  FROM public.community_profiles
  WHERE user_id = _user_id
  LIMIT 1;

  IF _role IN ('ambassadeur', 'sentinelle') THEN
    RETURN true;
  END IF;

  -- Check if user is the organizer (creator) of the parent marche
  SELECT EXISTS (
    SELECT 1
    FROM public.explorations e
    JOIN public.marches m ON m.id = e.marche_id
    WHERE e.id = _exploration_id
      AND m.created_by = _user_id
  ) INTO _is_organizer;

  RETURN COALESCE(_is_organizer, false);
END;
$$;