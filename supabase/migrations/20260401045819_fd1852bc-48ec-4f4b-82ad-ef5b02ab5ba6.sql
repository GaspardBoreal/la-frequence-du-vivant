DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'exploration_type'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.exploration_type AS ENUM (
      'agroecologique',
      'eco_poetique',
      'eco_tourisme'
    );
  END IF;
END $$;

ALTER TABLE public.explorations
ADD COLUMN IF NOT EXISTS exploration_type public.exploration_type;