
CREATE OR REPLACE FUNCTION public.request_inaturalist_backfill(
  p_user_id uuid,
  p_exploration_id uuid,
  p_marche_event_id uuid,
  p_source text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  IF p_user_id IS NULL OR p_exploration_id IS NULL THEN RETURN NULL; END IF;

  SELECT net.http_post(
    url := 'https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/backfill-marcheur-inaturalist',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YnVucnRnYmZiaGlua3premhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMxNTIsImV4cCI6MjA2OTA4OTE1Mn0.v1QqULucMrt9JFQatk5FPtIwXmuOFuP08Udg11_20_g',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YnVucnRnYmZiaGlua3premhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMxNTIsImV4cCI6MjA2OTA4OTE1Mn0.v1QqULucMrt9JFQatk5FPtIwXmuOFuP08Udg11_20_g'
    ),
    body := jsonb_build_object(
      'user_id', p_user_id,
      'exploration_id', p_exploration_id,
      'marche_event_id', p_marche_event_id,
      'source', p_source
    )
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;
