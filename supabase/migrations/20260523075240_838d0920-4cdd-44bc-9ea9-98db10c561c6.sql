-- 1. Index unique combiné (marcheur_id, marche_id, inaturalist_observation_id)
-- Permet l'idempotence du backfill sans casser d'éventuels doublons historiques sur inat_id seul
CREATE UNIQUE INDEX IF NOT EXISTS marcheur_observations_inat_marcheur_marche_uniq
  ON public.marcheur_observations (marcheur_id, marche_id, inaturalist_observation_id)
  WHERE inaturalist_observation_id IS NOT NULL;

-- 2. Fonction trigger qui POST async vers l'edge function
CREATE OR REPLACE FUNCTION public.trigger_backfill_snapshot_attributions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text := 'https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/backfill-snapshot-marcheur-attributions';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YnVucnRnYmZiaGlua3premhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMxNTIsImV4cCI6MjA2OTA4OTE1Mn0.v1QqULucMrt9JFQatk5FPtIwXmuOFuP08Udg11_20_g';
BEGIN
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'apikey', v_anon
    ),
    body := jsonb_build_object(
      'snapshot_id', NEW.id,
      'marche_id', NEW.marche_id
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trigger_backfill_snapshot_attributions failed: %', SQLERRM;
  RETURN NEW;
END $$;

-- 3. Trigger AFTER INSERT OR UPDATE OF species_data
DROP TRIGGER IF EXISTS snapshots_backfill_marcheurs ON public.biodiversity_snapshots;
CREATE TRIGGER snapshots_backfill_marcheurs
AFTER INSERT OR UPDATE OF species_data ON public.biodiversity_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.trigger_backfill_snapshot_attributions();