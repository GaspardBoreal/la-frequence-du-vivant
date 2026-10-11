CREATE TABLE public.inat_watch_misses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inat_observation_id bigint NOT NULL,
  marche_id uuid NOT NULL,
  exploration_id uuid,
  observer_login text,
  scientific_name text,
  observed_on date,
  observation_url text,
  reason text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (inat_observation_id, marche_id)
);
GRANT SELECT ON public.inat_watch_misses TO authenticated;
GRANT ALL ON public.inat_watch_misses TO service_role;
ALTER TABLE public.inat_watch_misses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read inat misses" ON public.inat_watch_misses FOR SELECT TO authenticated USING (public.check_is_admin_user(auth.uid()));

DO $$ BEGIN PERFORM cron.unschedule('watch-inat-accounts-hourly'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('watch-inat-accounts-hourly', '7 * * * *', $cron$
  SELECT net.http_post(
    url := 'https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/watch-inat-accounts',
    headers := jsonb_build_object('Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YnVucnRnYmZiaGlua3premhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMxNTIsImV4cCI6MjA2OTA4OTE1Mn0.v1QqULucMrt9JFQatk5FPtIwXmuOFuP08Udg11_20_g',
      'X-Cron-Secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='cron_shared_secret' LIMIT 1)),
    body := jsonb_build_object('triggered_at', now()));
$cron$);