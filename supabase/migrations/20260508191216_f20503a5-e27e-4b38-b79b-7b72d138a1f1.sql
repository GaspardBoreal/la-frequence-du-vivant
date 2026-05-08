
-- Drop both overloads
DROP FUNCTION IF EXISTS public.attribute_species_to_marcheurs(uuid, uuid, text, uuid[], text);
DROP FUNCTION IF EXISTS public.attribute_species_to_marcheurs(uuid, uuid, text, uuid[], text, uuid[]);

CREATE OR REPLACE FUNCTION public.attribute_species_to_marcheurs(
  p_exploration_id uuid,
  p_marche_id uuid,
  p_species text,
  p_marcheur_ids uuid[],
  p_notes text DEFAULT NULL,
  p_user_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_is_admin boolean;
  v_inserted integer := 0;
  v_uid uuid := auth.uid();
  v_user_id uuid;
  v_crew_id uuid;
  v_resolved_ids uuid[] := COALESCE(p_marcheur_ids, '{}'::uuid[]);
  v_prenom text;
  v_nom text;
  v_avatar text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  -- Admin via user_roles (crm_role)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_uid AND role = 'admin'::public.crm_role
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    SELECT role INTO v_role FROM public.community_profiles WHERE user_id = v_uid;
    IF v_role IS NULL OR v_role NOT IN ('ambassadeur', 'sentinelle') THEN
      RAISE EXCEPTION 'Permission refusée : ambassadeur, sentinelle ou admin requis';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.exploration_marches
    WHERE exploration_id = p_exploration_id AND marche_id = p_marche_id
  ) THEN
    RAISE EXCEPTION 'Marche % non liée à exploration %', p_marche_id, p_exploration_id;
  END IF;

  FOREACH v_user_id IN ARRAY COALESCE(p_user_ids, '{}'::uuid[])
  LOOP
    SELECT id INTO v_crew_id
    FROM public.exploration_marcheurs
    WHERE exploration_id = p_exploration_id AND user_id = v_user_id
    LIMIT 1;

    IF v_crew_id IS NULL THEN
      SELECT prenom, nom, avatar_url
        INTO v_prenom, v_nom, v_avatar
      FROM public.community_profiles
      WHERE user_id = v_user_id
      LIMIT 1;

      INSERT INTO public.exploration_marcheurs (
        exploration_id, user_id, prenom, nom, role, avatar_url, couleur, ordre
      ) VALUES (
        p_exploration_id, v_user_id,
        COALESCE(NULLIF(v_prenom, ''), 'Marcheur'),
        COALESCE(v_nom, ''),
        'marcheur', v_avatar, '#10b981', 9999
      )
      RETURNING id INTO v_crew_id;
    END IF;

    v_resolved_ids := array_append(v_resolved_ids, v_crew_id);
  END LOOP;

  WITH ins AS (
    INSERT INTO public.marcheur_observations (
      marcheur_id, marche_id, species_scientific_name, observation_date, notes
    )
    SELECT m_id, p_marche_id, p_species, CURRENT_DATE,
           COALESCE(p_notes, 'Attribution depuis L''Œil')
    FROM unnest(v_resolved_ids) AS m_id
    WHERE EXISTS (
      SELECT 1 FROM public.exploration_marcheurs em
      WHERE em.id = m_id AND em.exploration_id = p_exploration_id
    )
    ON CONFLICT (marcheur_id, marche_id, species_scientific_name) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM ins;

  RETURN v_inserted;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.attribute_species_to_marcheurs(uuid, uuid, text, uuid[], text, uuid[]) TO authenticated;
