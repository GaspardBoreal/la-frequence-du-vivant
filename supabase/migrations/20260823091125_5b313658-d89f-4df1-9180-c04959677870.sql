CREATE OR REPLACE FUNCTION public.onboard_set_garden_style(_propriete_id uuid, _style jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _allowed boolean;
  _result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.propriete_marcheurs pm
    JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
    WHERE pm.propriete_id = _propriete_id
      AND cp.user_id = auth.uid()
      AND pm.role = 'proprietaire'
  ) OR public.is_current_user_admin()
  INTO _allowed;

  IF NOT _allowed THEN
    RAISE EXCEPTION 'Seul le propriétaire du jardin peut mémoriser son style';
  END IF;

  IF _style IS NULL OR jsonb_typeof(_style) <> 'object' THEN
    RAISE EXCEPTION 'Style invalide : objet JSON attendu';
  END IF;

  UPDATE public.proprietes
  SET onboarding_preferences =
        COALESCE(onboarding_preferences, '{}'::jsonb)
        || jsonb_build_object('garden_style', _style),
      updated_at = now()
  WHERE id = _propriete_id
  RETURNING onboarding_preferences INTO _result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jardin introuvable';
  END IF;

  RETURN _result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.onboard_set_garden_style(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.onboard_set_garden_style(uuid, jsonb) TO service_role;