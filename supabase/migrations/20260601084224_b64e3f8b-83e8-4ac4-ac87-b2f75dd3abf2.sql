CREATE TABLE public.species_biogeography_kb (
  scientific_name text PRIMARY KEY,
  native_countries text[] DEFAULT '{}'::text[],
  native_continents text[] DEFAULT '{}'::text[],
  introduced_countries text[] DEFAULT '{}'::text[],
  authorship text,
  describer_name text,
  describer_year int,
  describer_country text,
  describer_birth_year int,
  gbif_usage_key bigint,
  source text NOT NULL DEFAULT 'gbif',
  fetched_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.species_biogeography_kb TO anon;
GRANT SELECT ON public.species_biogeography_kb TO authenticated;
GRANT ALL ON public.species_biogeography_kb TO service_role;

ALTER TABLE public.species_biogeography_kb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Biogeography KB is publicly readable"
ON public.species_biogeography_kb
FOR SELECT
USING (true);

CREATE INDEX idx_species_biogeography_fetched_at
ON public.species_biogeography_kb (fetched_at DESC);