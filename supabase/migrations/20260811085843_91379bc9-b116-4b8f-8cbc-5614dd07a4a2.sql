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
    WHEN NEW.statut = 'perdu' THEN 'refus'
    WHEN NEW.statut IN ('relance_2', 'relance_3', 'rdv', 'devis', 'gagne', 'gagné') THEN 'interesse'
    WHEN NEW.statut IN ('nouveau', 'relance_1') THEN 'joint'
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

DROP TRIGGER IF EXISTS trg_crm_sync_campaign_member ON public.crm_opportunities;
CREATE TRIGGER trg_crm_sync_campaign_member
AFTER UPDATE OF statut ON public.crm_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.crm_sync_campaign_member_from_opportunity();