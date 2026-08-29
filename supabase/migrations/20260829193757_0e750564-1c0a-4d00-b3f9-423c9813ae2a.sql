CREATE OR REPLACE FUNCTION public.get_propriete_onboarding(_propriete_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;

  IF NOT (public.can_access_propriete(_propriete_id) OR public.can_edit_propriete_onboarding(_propriete_id)) THEN
    RAISE EXCEPTION 'Accès refusé à ce jardin' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(onboarding_preferences, '{}'::jsonb)
    INTO v_result
    FROM public.proprietes
   WHERE id = _propriete_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Propriété introuvable' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_propriete_onboarding(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_propriete_onboarding(uuid) TO authenticated;