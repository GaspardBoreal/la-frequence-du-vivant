
ALTER TABLE public.exploration_curations
ADD COLUMN IF NOT EXISTS functions text[] DEFAULT NULL;

COMMENT ON COLUMN public.exploration_curations.functions IS
'Override curateur des fonctions écologiques (tags arbre/mellifère/...). Si non NULL, remplace totalement l''auto-classification pour cette espèce dans cette exploration.';

CREATE INDEX IF NOT EXISTS idx_exploration_curations_needs_review
ON public.exploration_curations (exploration_id)
WHERE needs_review = true;

CREATE INDEX IF NOT EXISTS idx_exploration_curations_species_functions
ON public.exploration_curations (exploration_id, entity_id)
WHERE entity_type = 'species' AND functions IS NOT NULL;
