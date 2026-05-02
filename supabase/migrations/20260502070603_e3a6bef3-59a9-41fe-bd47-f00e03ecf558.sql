ALTER TABLE public.exploration_curations
  ALTER COLUMN media_ids TYPE text[] USING media_ids::text[];