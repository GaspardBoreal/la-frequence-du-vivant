CREATE OR REPLACE FUNCTION public.crm_sync_campaign_member_from_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status text;
BEGIN
  IF NEW.statut IS NOT DISTINCT FROM OLD.statut THEN
    RETURN NEW;
  END IF;

  new_status := CASE
    WHEN NEW.statut IN ('perdu', 'pas_interesse') THEN 'refus'
    WHEN NEW.statut IN ('relance_2', 'relance_3', 'gagne') THEN 'interesse'
    WHEN NEW.statut = 'relance_1' THEN 'joint'
    WHEN NEW.statut = 'a_contacter' THEN 'a_appeler'
    ELSE NULL
  END;

  IF new_status IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.crm_campaign_members m
     SET call_status = new_status,
         updated_at = now()
   WHERE m.opportunity_id = NEW.id
     AND m.call_status IS DISTINCT FROM new_status;

  RETURN NEW;
END;
$$;