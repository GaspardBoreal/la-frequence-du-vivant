CREATE OR REPLACE FUNCTION public.sync_shared_event_invited_readers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.share_with_new_signups THEN
    WITH ins AS (
      INSERT INTO public.event_invited_readers
        (event_id, user_id, invitation_id, added_by_user_id, invite_source)
      SELECT NEW.id, cp.user_id, NULL, NULL, 'auto_new_signup'
      FROM public.community_profiles cp
      WHERE cp.role = 'marcheur_en_devenir'
        AND cp.user_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.event_invited_readers r
          WHERE r.event_id = NEW.id AND r.user_id = cp.user_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.marche_participations mp
          WHERE mp.marche_event_id = NEW.id AND mp.user_id = cp.user_id
        )
      ON CONFLICT DO NOTHING
      RETURNING event_id, user_id
    )
    INSERT INTO public.event_invited_readers_audit (event_id, user_id, action, source, performed_by)
    SELECT event_id, user_id, 'auto_share_on', 'auto_new_signup', NULL FROM ins;
  ELSE
    WITH del AS (
      DELETE FROM public.event_invited_readers r
      WHERE r.event_id = NEW.id
        AND r.invite_source = 'auto_new_signup'
        AND r.promoted_to_participant_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.marche_participations mp
          WHERE mp.marche_event_id = r.event_id AND mp.user_id = r.user_id
        )
      RETURNING r.event_id, r.user_id
    )
    INSERT INTO public.event_invited_readers_audit (event_id, user_id, action, source, performed_by)
    SELECT event_id, user_id, 'auto_share_off', 'auto_new_signup', NULL FROM del;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_shared_event_invited_readers ON public.marche_events;
CREATE TRIGGER trg_sync_shared_event_invited_readers
AFTER UPDATE OF share_with_new_signups ON public.marche_events
FOR EACH ROW
WHEN (OLD.share_with_new_signups IS DISTINCT FROM NEW.share_with_new_signups)
EXECUTE FUNCTION public.sync_shared_event_invited_readers();

-- Rattrapage immédiat : retirer les invitations auto des marches dont le partage est OFF
WITH del AS (
  DELETE FROM public.event_invited_readers r
  USING public.marche_events e
  WHERE e.id = r.event_id
    AND COALESCE(e.share_with_new_signups, false) = false
    AND r.invite_source = 'auto_new_signup'
    AND r.promoted_to_participant_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.marche_participations mp
      WHERE mp.marche_event_id = r.event_id AND mp.user_id = r.user_id
    )
  RETURNING r.event_id, r.user_id
)
INSERT INTO public.event_invited_readers_audit (event_id, user_id, action, source, performed_by)
SELECT event_id, user_id, 'auto_share_off', 'auto_new_signup', NULL FROM del;

-- Rattrapage immédiat : ajouter les invitations manquantes sur les marches partagées
WITH ins AS (
  INSERT INTO public.event_invited_readers
    (event_id, user_id, invitation_id, added_by_user_id, invite_source)
  SELECT e.id, cp.user_id, NULL, NULL, 'auto_new_signup'
  FROM public.marche_events e
  CROSS JOIN public.community_profiles cp
  WHERE e.share_with_new_signups = true
    AND cp.role = 'marcheur_en_devenir'
    AND cp.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.event_invited_readers r
      WHERE r.event_id = e.id AND r.user_id = cp.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.marche_participations mp
      WHERE mp.marche_event_id = e.id AND mp.user_id = cp.user_id
    )
  ON CONFLICT DO NOTHING
  RETURNING event_id, user_id
)
INSERT INTO public.event_invited_readers_audit (event_id, user_id, action, source, performed_by)
SELECT event_id, user_id, 'auto_share_on', 'auto_new_signup', NULL FROM ins;