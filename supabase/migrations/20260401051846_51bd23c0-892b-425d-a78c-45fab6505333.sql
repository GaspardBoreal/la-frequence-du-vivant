ALTER TABLE public.marche_events
ADD COLUMN IF NOT EXISTS event_type text;

UPDATE public.marche_events
SET event_type = COALESCE(event_type, 'agroecologique');

ALTER TABLE public.marche_events
ALTER COLUMN event_type SET DEFAULT 'agroecologique';

ALTER TABLE public.marche_events
ALTER COLUMN event_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'marche_events_event_type_check'
      AND conrelid = 'public.marche_events'::regclass
  ) THEN
    ALTER TABLE public.marche_events
    ADD CONSTRAINT marche_events_event_type_check
    CHECK (event_type IN ('agroecologique', 'eco_poetique', 'eco_tourisme'));
  END IF;
END $$;