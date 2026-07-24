CREATE OR REPLACE FUNCTION public.sync_propriete_main_walker_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.main_walker_id IS DISTINCT FROM NEW.main_walker_id AND OLD.main_walker_id IS NOT NULL THEN
    UPDATE public.propriete_marcheurs
       SET is_main = false
     WHERE propriete_id = NEW.id
       AND community_profile_id = OLD.main_walker_id
       AND is_main = true;
  END IF;

  IF NEW.main_walker_id IS NOT NULL THEN
    UPDATE public.propriete_marcheurs
       SET is_main = false
     WHERE community_profile_id = NEW.main_walker_id
       AND propriete_id <> NEW.id
       AND is_main = true;

    INSERT INTO public.propriete_marcheurs (propriete_id, community_profile_id, role, is_main)
    VALUES (NEW.id, NEW.main_walker_id, 'proprietaire'::public.role_propriete, true)
    ON CONFLICT (propriete_id, community_profile_id)
    DO UPDATE SET
      role = CASE
        WHEN public.propriete_marcheurs.role IS NULL THEN 'proprietaire'::public.role_propriete
        ELSE public.propriete_marcheurs.role
      END,
      is_main = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_propriete_main_walker_access ON public.proprietes;
CREATE TRIGGER trg_sync_propriete_main_walker_access
AFTER INSERT OR UPDATE OF main_walker_id ON public.proprietes
FOR EACH ROW
EXECUTE FUNCTION public.sync_propriete_main_walker_access();

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
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'nom', nom,
        'slug', slug,
        'ville', ville,
        'photo_hero_url', photo_hero_url,
        'role', role,
        'is_main', is_main
      ) ORDER BY is_main DESC, nom
    ),
    MAX(CASE WHEN is_main THEN id END)
  INTO v_proprietes, v_main_id
  FROM access_rows;

  RETURN jsonb_build_object(
    'hasMarcheurAccess', true,
    'proprietesAccessibles', COALESCE(v_proprietes, '[]'::jsonb),
    'proprietePrincipaleId', v_main_id
  );
END;
$$;