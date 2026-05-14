CREATE OR REPLACE FUNCTION public.trigger_backfill_marcheur_inat_batch()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions, net
AS $$
DECLARE
  v_secret text;
  v_request_id bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_shared_secret' LIMIT 1;

  SELECT net.http_post(
    url := 'https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/backfill-marcheur-inat-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YnVucnRnYmZiaGlua3premhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMxNTIsImV4cCI6MjA2OTA4OTE1Mn0.v1QqULucMrt9JFQatk5FPtIwXmuOFuP08Udg11_20_g',
      'X-Cron-Secret', v_secret
    ),
    body := jsonb_build_object('manual_trigger_at', now())
  ) INTO v_request_id;

  RETURN v_request_id;
END $$;