
-- Déduplication préalable (garder la plus récente par clé)
WITH ranked_global AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY alias_key ORDER BY updated_at DESC, created_at DESC) AS rn
  FROM public.species_taxonomy_aliases
  WHERE marche_id IS NULL
)
DELETE FROM public.species_taxonomy_aliases
WHERE id IN (SELECT id FROM ranked_global WHERE rn > 1);

WITH ranked_marche AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY marche_id, alias_key ORDER BY updated_at DESC, created_at DESC) AS rn
  FROM public.species_taxonomy_aliases
  WHERE marche_id IS NOT NULL
)
DELETE FROM public.species_taxonomy_aliases
WHERE id IN (SELECT id FROM ranked_marche WHERE rn > 1);

-- Index uniques partiels correspondant aux ON CONFLICT du hook useTaxonomyAliases
CREATE UNIQUE INDEX IF NOT EXISTS species_taxonomy_aliases_global_uidx
  ON public.species_taxonomy_aliases (alias_key)
  WHERE marche_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS species_taxonomy_aliases_marche_uidx
  ON public.species_taxonomy_aliases (marche_id, alias_key)
  WHERE marche_id IS NOT NULL;
