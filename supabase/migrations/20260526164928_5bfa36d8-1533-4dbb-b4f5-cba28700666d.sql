
-- Orphan event_invitations: invitations dont l'invité (par email) n'a plus de compte auth, et qui n'ont pas été consommées par un compte existant
CREATE OR REPLACE FUNCTION public.admin_orphan_event_invitations()
RETURNS TABLE(id uuid, invited_email text, invited_prenom text, event_title text, token uuid, created_at timestamptz, consumed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ei.id, ei.invited_email, ei.invited_prenom,
         COALESCE(me.title, '(événement supprimé)') AS event_title,
         ei.token, ei.created_at, ei.consumed_at
  FROM event_invitations ei
  LEFT JOIN marche_events me ON me.id = ei.event_id
  WHERE
    -- jamais consommée et l'email n'a pas (ou plus) de compte auth
    (ei.consumed_by_user_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE lower(au.email) = lower(ei.invited_email)))
    OR
    -- consommée mais le compte qui l'a consommée n'existe plus
    (ei.consumed_by_user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = ei.consumed_by_user_id));
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_orphan_event_invitations(p_ids uuid[])
RETURNS TABLE(deleted_count int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted int;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH del AS (
    DELETE FROM event_invitations ei
    WHERE ei.id = ANY(p_ids)
      AND (
        (ei.consumed_by_user_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE lower(au.email) = lower(ei.invited_email)))
        OR
        (ei.consumed_by_user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = ei.consumed_by_user_id))
      )
    RETURNING ei.id
  )
  SELECT count(*)::int INTO v_deleted FROM del;
  deleted_count := COALESCE(v_deleted, 0);
  RETURN NEXT;
END;
$$;

-- Orphan marche_participations: participations dont l'utilisateur n'existe plus côté auth
CREATE OR REPLACE FUNCTION public.admin_orphan_marche_participations()
RETURNS TABLE(id uuid, user_id uuid, event_title text, validated_at timestamptz, created_at timestamptz, has_observations boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mp.id, mp.user_id,
         COALESCE(me.title, '(événement supprimé)') AS event_title,
         mp.validated_at, mp.created_at,
         EXISTS (
           SELECT 1 FROM marcheur_observations mo
           JOIN exploration_marcheurs em ON em.id = mo.marcheur_id
           WHERE em.user_id = mp.user_id
         ) AS has_observations
  FROM marche_participations mp
  LEFT JOIN marche_events me ON me.id = mp.marche_event_id
  WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = mp.user_id);
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_orphan_marche_participations(p_ids uuid[])
RETURNS TABLE(deleted_count int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted int;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH del AS (
    DELETE FROM marche_participations mp
    WHERE mp.id = ANY(p_ids)
      AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = mp.user_id)
    RETURNING mp.id
  )
  SELECT count(*)::int INTO v_deleted FROM del;
  deleted_count := COALESCE(v_deleted, 0);
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_orphan_event_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_orphan_event_invitations(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_orphan_marche_participations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_orphan_marche_participations(uuid[]) TO authenticated;
