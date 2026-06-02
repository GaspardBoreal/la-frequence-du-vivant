ALTER TABLE public.species_biogeography_kb
  ADD COLUMN IF NOT EXISTS type_locality_country text,
  ADD COLUMN IF NOT EXISTS type_locality_label text,
  ADD COLUMN IF NOT EXISTS type_locality_lat double precision,
  ADD COLUMN IF NOT EXISTS type_locality_lng double precision;