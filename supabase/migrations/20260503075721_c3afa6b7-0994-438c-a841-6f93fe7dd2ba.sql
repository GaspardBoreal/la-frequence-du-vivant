
CREATE OR REPLACE FUNCTION public.reorder_marcheur_observation_photos(
  p_owner_user_id uuid,
  p_owner_crew_id uuid,
  p_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := false;
  v_crew_user uuid;
  v_item jsonb;
  v_kind text;
  v_id uuid;
  v_ordre int;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_is_admin := public.check_is_admin_user(v_caller);

  -- Authorization: caller is the owner user, or owner of the linked crew row, or admin
  IF NOT v_is_admin THEN
    IF p_owner_user_id IS NOT NULL AND p_owner_user_id <> v_caller THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;

    IF p_owner_user_id IS NULL AND p_owner_crew_id IS NOT NULL THEN
      SELECT user_id INTO v_crew_user FROM public.exploration_marcheurs WHERE id = p_owner_crew_id;
      IF v_crew_user IS NULL OR v_crew_user <> v_caller THEN
        RAISE EXCEPTION 'Not authorized for this crew';
      END IF;
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_kind  := v_item->>'kind';
    v_id    := (v_item->>'id')::uuid;
    v_ordre := (v_item->>'ordre')::int;

    IF v_kind = 'media' THEN
      UPDATE public.marcheur_medias m
      SET ordre = v_ordre
      WHERE m.id = v_id
        AND (
          (m.attributed_marcheur_id IS NOT NULL AND p_owner_crew_id IS NOT NULL AND m.attributed_marcheur_id = p_owner_crew_id)
          OR (m.attributed_marcheur_id IS NULL AND p_owner_user_id IS NOT NULL AND m.user_id = p_owner_user_id)
          OR v_is_admin
        );
    ELSIF v_kind = 'conv' THEN
      UPDATE public.exploration_convivialite_photos c
      SET position = v_ordre
      WHERE c.id = v_id
        AND (
          (c.attributed_marcheur_id IS NOT NULL AND p_owner_crew_id IS NOT NULL AND c.attributed_marcheur_id = p_owner_crew_id)
          OR (c.attributed_marcheur_id IS NULL AND p_owner_user_id IS NOT NULL AND c.user_id = p_owner_user_id)
          OR v_is_admin
        );
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_marcheur_observation_photos(uuid, uuid, jsonb) TO authenticated;
