CREATE OR REPLACE FUNCTION public.promote_invited_reader_on_participation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.event_invited_readers
     SET promoted_to_participant_at = now()
   WHERE event_id = NEW.marche_event_id
     AND user_id = NEW.user_id
     AND promoted_to_participant_at IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_invited_reader_on_participation ON public.marche_participations;

CREATE TRIGGER trg_promote_invited_reader_on_participation
AFTER INSERT ON public.marche_participations
FOR EACH ROW
EXECUTE FUNCTION public.promote_invited_reader_on_participation();