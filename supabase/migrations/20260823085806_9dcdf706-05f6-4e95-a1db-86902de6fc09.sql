ALTER TABLE public.onboarding_garden_types
  ADD COLUMN IF NOT EXISTS stable_id text,
  ADD COLUMN IF NOT EXISTS baseline text,
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS climate_scope text,
  ADD COLUMN IF NOT EXISTS image_spec jsonb,
  ADD COLUMN IF NOT EXISTS generation_logic jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_garden_types_stable_id_key
  ON public.onboarding_garden_types (stable_id) WHERE stable_id IS NOT NULL;

UPDATE public.onboarding_garden_types SET stable_id = 'jardin_nourricier' WHERE slug = 'nourricier' AND stable_id IS NULL;

ALTER TABLE public.onboarding_garden_examples
  ADD COLUMN IF NOT EXISTS stable_id text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS user_intent text,
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_profile jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_garden_examples_type_stable_id_key
  ON public.onboarding_garden_examples (type_id, stable_id) WHERE stable_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_garden_examples_type_position_key
  ON public.onboarding_garden_examples (type_id, position);