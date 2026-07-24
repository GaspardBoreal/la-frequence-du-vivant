CREATE OR REPLACE FUNCTION public.get_user_apps_access()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_proprietes JSONB;
  v_main_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'hasMarcheurAccess', false,
      'proprietesAccessibles', '[]'::jsonb,
      'proprietePrincipaleId', NULL
    );
  END IF;

  WITH access_rows AS (
    SELECT
      p.id,
      p.nom,
      p.slug,
      p.ville,
      p.photo_hero_url,
      COALESCE(pm.role, 'proprietaire'::public.role_propriete) AS role,
      (COALESCE(pm.is_main, false) OR p.main_walker_id = v_profile_id) AS is_main
    FROM public.proprietes p
    LEFT JOIN public.propriete_marcheurs pm
      ON pm.propriete_id = p.id
     AND pm.community_profile_id = v_profile_id
    WHERE p.is_active = true
      AND (
        pm.community_profile_id IS NOT NULL
        OR p.main_walker_id = v_profile_id
      )
  ), main_access AS (
    SELECT id
    FROM access_rows
    WHERE is_main = true
    ORDER BY nom
    LIMIT 1
  )
  SELECT
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'nom', nom,
          'slug', slug,
          'ville', ville,
          'photo_hero_url', photo_hero_url,
          'role', role,
          'is_main', is_main
        ) ORDER BY is_main DESC, nom
      )
      FROM access_rows
    ),
    (SELECT id FROM main_access)
  INTO v_proprietes, v_main_id;

  RETURN jsonb_build_object(
    'hasMarcheurAccess', true,
    'proprietesAccessibles', COALESCE(v_proprietes, '[]'::jsonb),
    'proprietePrincipaleId', v_main_id
  );
END;
$$;