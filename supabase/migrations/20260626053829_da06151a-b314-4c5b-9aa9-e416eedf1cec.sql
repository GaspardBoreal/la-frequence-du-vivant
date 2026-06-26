
CREATE TABLE public.pheno_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marcheur_id uuid NOT NULL,
  exploration_id uuid REFERENCES public.explorations(id) ON DELETE SET NULL,
  marche_id uuid REFERENCES public.marches(id) ON DELETE SET NULL,
  species_scientific_name text NOT NULL,
  crop_key text NOT NULL,
  bbch_macro smallint NOT NULL CHECK (bbch_macro BETWEEN 0 AND 9),
  bbch_label_fr text NOT NULL,
  bbch_uri text,
  observed_at date NOT NULL DEFAULT CURRENT_DATE,
  latitude numeric,
  longitude numeric,
  photo_url text,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pheno_obs_exploration ON public.pheno_observations(exploration_id);
CREATE INDEX idx_pheno_obs_marche ON public.pheno_observations(marche_id);
CREATE INDEX idx_pheno_obs_marcheur ON public.pheno_observations(marcheur_id);
CREATE INDEX idx_pheno_obs_crop_date ON public.pheno_observations(crop_key, observed_at DESC);

GRANT SELECT ON public.pheno_observations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pheno_observations TO authenticated;
GRANT ALL ON public.pheno_observations TO service_role;

ALTER TABLE public.pheno_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read pheno observations of published explorations"
ON public.pheno_observations
FOR SELECT
TO anon, authenticated
USING (
  exploration_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.marche_events me
    WHERE me.exploration_id = pheno_observations.exploration_id
      AND me.is_public = true
  )
);

CREATE POLICY "Marcheurs manage their own pheno observations"
ON public.pheno_observations
FOR ALL
TO authenticated
USING (marcheur_id = auth.uid())
WITH CHECK (marcheur_id = auth.uid());

CREATE POLICY "Admins can read all pheno observations"
ON public.pheno_observations
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE TRIGGER set_pheno_observations_updated_at
BEFORE UPDATE ON public.pheno_observations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
