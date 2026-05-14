-- Activer extensions si pas déjà
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Stocker le secret partagé dans Vault (idempotent)
DO $$
DECLARE
  v_secret text := 'BmcmyBb_2SJK3TiIZFNlb872lzF5G8nJlv7AAPAqqi60AKFX9OeRu18pTBmH3kPd';
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM vault.secrets WHERE name = 'cron_shared_secret';
  IF v_existing IS NULL THEN
    PERFORM vault.create_secret(v_secret, 'cron_shared_secret', 'Shared secret used by pg_cron jobs to authenticate against edge functions');
  END IF;
END $$;

-- Supprimer le job existant s'il y en a un (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('backfill-marcheur-inat-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Planifier : 01:30 UTC = 03:30 Paris (été) / 02:30 (hiver)
SELECT cron.schedule(
  'backfill-marcheur-inat-daily',
  '30 1 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/backfill-marcheur-inat-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YnVucnRnYmZiaGlua3premhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMxNTIsImV4cCI6MjA2OTA4OTE1Mn0.v1QqULucMrt9JFQatk5FPtIwXmuOFuP08Udg11_20_g',
      'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_shared_secret' LIMIT 1)
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $cron$
);