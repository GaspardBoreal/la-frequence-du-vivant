-- Cache des suggestions IA BBCH par photo + culture
CREATE TABLE IF NOT EXISTS public.pheno_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url text NOT NULL,
  crop_key text NOT NULL,
  scientific_name text,
  macro int,
  confidence numeric,
  rationale text,
  alternative_macro int,
  unknown boolean NOT NULL DEFAULT false,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (photo_url, crop_key)
);

GRANT SELECT ON public.pheno_ai_suggestions TO authenticated;
GRANT ALL ON public.pheno_ai_suggestions TO service_role;

ALTER TABLE public.pheno_ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read pheno ai suggestions"
  ON public.pheno_ai_suggestions FOR SELECT
  TO authenticated
  USING (true);

-- Colonnes IA sur pheno_observations
ALTER TABLE public.pheno_observations
  ADD COLUMN IF NOT EXISTS ai_suggested_macro int,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_rationale text,
  ADD COLUMN IF NOT EXISTS ai_accepted boolean;
