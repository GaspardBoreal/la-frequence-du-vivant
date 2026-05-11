-- 1. RPC pour curation manuelle des traductions par admin/ambassadeur/sentinelle
CREATE OR REPLACE FUNCTION public.update_species_translation_manual(
  p_scientific_name text,
  p_common_name_fr text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT public.check_is_admin_user(v_user_id) INTO v_is_admin;

  IF NOT v_is_admin THEN
    SELECT role INTO v_role FROM public.community_profiles WHERE user_id = v_user_id;
    IF v_role IS NULL OR v_role NOT IN ('ambassadeur', 'sentinelle') THEN
      RAISE EXCEPTION 'Forbidden: only admins, ambassadeurs and sentinelles can curate translations';
    END IF;
  END IF;

  IF p_scientific_name IS NULL OR length(trim(p_scientific_name)) = 0 THEN
    RAISE EXCEPTION 'Scientific name is required';
  END IF;
  IF p_common_name_fr IS NULL OR length(trim(p_common_name_fr)) = 0 THEN
    RAISE EXCEPTION 'Common name is required';
  END IF;

  INSERT INTO public.species_translations (scientific_name, common_name_fr, source, confidence_level)
  VALUES (trim(p_scientific_name), trim(p_common_name_fr), 'manual', 'high')
  ON CONFLICT (scientific_name) DO UPDATE
    SET common_name_fr = EXCLUDED.common_name_fr,
        source = 'manual',
        confidence_level = 'high',
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_species_translation_manual(text, text) TO authenticated;

-- 2. Correction immédiate de Arion vulgaris
UPDATE public.species_translations
SET common_name_fr = 'Loche espagnole',
    source = 'manual',
    confidence_level = 'high',
    updated_at = now()
WHERE scientific_name = 'Arion vulgaris';