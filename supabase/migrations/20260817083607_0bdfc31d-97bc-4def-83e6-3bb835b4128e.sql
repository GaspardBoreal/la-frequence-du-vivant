ALTER TABLE public.iot_capteurs
  ADD COLUMN IF NOT EXISTS etat text NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS etat_motif text,
  ADD COLUMN IF NOT EXISTS etat_depuis timestamptz;

CREATE OR REPLACE FUNCTION public.iot_capteurs_validate_etat()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.etat IS NULL OR NEW.etat NOT IN ('service', 'maintenance', 'retire') THEN
    RAISE EXCEPTION 'etat invalide: %', NEW.etat;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.etat IS DISTINCT FROM OLD.etat THEN
    NEW.etat_depuis := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_iot_capteurs_validate_etat ON public.iot_capteurs;
CREATE TRIGGER trg_iot_capteurs_validate_etat
BEFORE INSERT OR UPDATE ON public.iot_capteurs
FOR EACH ROW EXECUTE FUNCTION public.iot_capteurs_validate_etat();