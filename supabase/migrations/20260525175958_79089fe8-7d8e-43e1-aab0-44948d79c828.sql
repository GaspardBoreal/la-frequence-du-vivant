CREATE OR REPLACE FUNCTION public.auto_invite_new_signup_to_shared_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ev record;
BEGIN
  FOR _ev IN
    SELECT id FROM public.marche_events
    WHERE share_with_new_signups = true
  LOOP
    INSERT INTO public.event_invited_readers
      (event_id, user_id, invitation_id, added_by_user_id, invite_source)
    VALUES
      (_ev.id, NEW.user_id, NULL, NULL, 'auto_new_signup')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.event_invited_readers_audit
      (event_id, user_id, action, source, performed_by)
    VALUES
      (_ev.id, NEW.user_id, 'auto_invite_new_signup', 'auto_new_signup', NULL);
  END LOOP;
  RETURN NEW;
END;
$$;