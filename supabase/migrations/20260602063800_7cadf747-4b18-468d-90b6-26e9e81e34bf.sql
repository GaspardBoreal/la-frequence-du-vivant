
ALTER TABLE public.species_biogeography_kb
  ADD COLUMN IF NOT EXISTS type_locality_source text,
  ADD COLUMN IF NOT EXISTS type_locality_confidence text,
  ADD COLUMN IF NOT EXISTS sources jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS native_countries_verified text[] DEFAULT '{}'::text[];

-- Force re-enrichment with the new strict pipeline
UPDATE public.species_biogeography_kb SET fetched_at = '1970-01-01'::timestamptz;
