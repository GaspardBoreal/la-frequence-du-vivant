ALTER TABLE public.proprietes
  ADD COLUMN IF NOT EXISTS onboarding_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.proprietes.onboarding_preferences IS
  'Réponses du parcours d''onboarding Fréquence Jardin (persona, priorité, temps, surface, eau, style, espaces, budget, panier d''envies).';