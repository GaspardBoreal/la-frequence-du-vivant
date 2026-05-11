-- 1) Nettoyer toutes les curations 'species' avec entity_id composite
--    "Sci | Sci | Common | n" → garder uniquement le 1er segment (nom scientifique).
UPDATE public.exploration_curations
SET entity_id = trim(split_part(entity_id, ' | ', 1))
WHERE entity_type = 'species'
  AND entity_id LIKE '% | %';

-- 2) Harmoniser Symphytum × uplandicum (Consoude de Russie) en 'auxiliaire'
--    sur toutes les explorations : non listée EEE (UE 1143/2014, arrêté FR).
UPDATE public.exploration_curations
SET category = 'auxiliaire'
WHERE entity_type = 'species'
  AND entity_id = 'Symphytum × uplandicum'
  AND category = 'eee';