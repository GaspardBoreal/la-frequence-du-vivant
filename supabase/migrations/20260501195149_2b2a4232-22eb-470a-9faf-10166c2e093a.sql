-- Phase 1 — Refonte classification des espèces
-- Ajout des colonnes pour catégorisation multiple, traçabilité et auditabilité

ALTER TABLE public.exploration_curations
  ADD COLUMN IF NOT EXISTS secondary_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS classification_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS classification_source text NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS classification_confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

-- Contrainte sur la source de classification
ALTER TABLE public.exploration_curations
  DROP CONSTRAINT IF EXISTS exploration_curations_classification_source_check;
ALTER TABLE public.exploration_curations
  ADD CONSTRAINT exploration_curations_classification_source_check
  CHECK (classification_source IN ('knowledge_base', 'gbif', 'inaturalist', 'ai', 'curator', 'legacy'));

-- Index pour le tableau de bord "à réviser"
CREATE INDEX IF NOT EXISTS idx_curations_needs_review
  ON public.exploration_curations(exploration_id)
  WHERE needs_review = true;

-- Remappage des anciennes catégories vers le nouveau référentiel
-- protegee → patrimoniale (correspondance directe)
UPDATE public.exploration_curations
SET category = 'patrimoniale',
    classification_source = 'legacy',
    needs_review = true
WHERE category = 'protegee';

-- emblematique → patrimoniale (à réviser, sens proche mais pas identique)
UPDATE public.exploration_curations
SET category = 'patrimoniale',
    classification_source = 'legacy',
    needs_review = true
WHERE category = 'emblematique';

-- parapluie → indigene avec patrimoniale en secondaire (à réviser)
UPDATE public.exploration_curations
SET category = 'indigene',
    secondary_categories = ARRAY['patrimoniale'],
    classification_source = 'legacy',
    needs_review = true
WHERE category = 'parapluie';

COMMENT ON COLUMN public.exploration_curations.secondary_categories IS
  'Catégories secondaires (0 à N). Une espèce a UNE catégorie principale (category) et peut avoir plusieurs catégories complémentaires.';
COMMENT ON COLUMN public.exploration_curations.classification_evidence IS
  'Tableau JSON de preuves [{source, ref_code?, url, quote, fetched_at}]. Citations sourcées pour auditabilité.';
COMMENT ON COLUMN public.exploration_curations.classification_source IS
  'Origine de la classification : knowledge_base | gbif | inaturalist | ai | curator | legacy';
COMMENT ON COLUMN public.exploration_curations.classification_confidence IS
  'Niveau de confiance 0.00-1.00. <0.6 → needs_review automatique.';
COMMENT ON COLUMN public.exploration_curations.needs_review IS
  'True si la classification doit être validée par un curateur humain.';