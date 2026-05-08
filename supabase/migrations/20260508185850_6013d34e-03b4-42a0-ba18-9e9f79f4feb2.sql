
-- Unique index pour idempotence des attributions
CREATE UNIQUE INDEX IF NOT EXISTS marcheur_observations_unique_triplet
  ON public.marcheur_observations (marcheur_id, marche_id, species_scientific_name);

-- RPC sécurisée d'attribution depuis L'Œil
CREATE OR REPLACE FUNCTION public.attribute_species_to_marcheurs(
  p_exploration_id uuid,
  p_marche_id uuid,
  p_species text,
  p_marcheur_ids uuid[],
  p_notes text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_is_admin boolean;
  v_inserted integer := 0;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Admin via has_role
  v_is_admin := public.has_role(v_uid, 'admin'::public.app_role);

  -- Sinon vérifier rôle communautaire (ambassadeur / sentinelle)
  IF NOT v_is_admin THEN
    SELECT role INTO v_role FROM public.community_profiles WHERE user_id = v_uid;
    IF v_role IS NULL OR v_role NOT IN ('ambassadeur', 'sentinelle') THEN
      RAISE EXCEPTION 'Permission refusée : ambassadeur, sentinelle ou admin requis';
    END IF;
  END IF;

  -- Vérifier que la marche appartient bien à l'exploration
  IF NOT EXISTS (
    SELECT 1 FROM public.exploration_marches
    WHERE exploration_id = p_exploration_id AND marche_id = p_marche_id
  ) THEN
    RAISE EXCEPTION 'Marche % non liée à exploration %', p_marche_id, p_exploration_id;
  END IF;

  -- Insertion idempotente
  WITH ins AS (
    INSERT INTO public.marcheur_observations (
      marcheur_id, marche_id, species_scientific_name, observation_date, notes
    )
    SELECT m_id, p_marche_id, p_species, CURRENT_DATE,
           COALESCE(p_notes, 'Attribution depuis L''Œil')
    FROM unnest(p_marcheur_ids) AS m_id
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
$$;

GRANT EXECUTE ON FUNCTION public.attribute_species_to_marcheurs(uuid, uuid, text, uuid[], text) TO authenticated;
