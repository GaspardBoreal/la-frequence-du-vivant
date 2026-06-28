CREATE TABLE public.species_prospective_2100_cache (
  scientific_name text PRIMARY KEY,
  status text NOT NULL,
  narrative text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.species_prospective_2100_cache TO anon, authenticated;
GRANT ALL ON public.species_prospective_2100_cache TO service_role;
ALTER TABLE public.species_prospective_2100_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospective 2100 readable by all" ON public.species_prospective_2100_cache FOR SELECT USING (true);