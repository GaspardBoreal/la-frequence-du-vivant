-- Créer l'entrée OPUS manquante qui correspond à l'exploration existante
INSERT INTO opus_explorations (
  id,
  slug,
  nom,
  description,
  theme_principal,
  meta_title,
  meta_description,
  meta_keywords,
  language,
  published,
  ordre,
  created_at,
  updated_at
) VALUES (
  '10ed8c41-5361-42f0-b62d-cda24b1d1401',
  'remontee-dordogne-atlas-eaux-vivantes-2025-2045',
  'Remontée Dordogne — Atlas des Eaux Vivantes 2025-2045',
  'Exploration révolutionnaire des territoires en mutation climatique le long de la Dordogne, de l''estuaire aux sources.',
  'Hydrologie & Technodiversité',
  'Remontée Dordogne : Atlas des Eaux Vivantes 2025–2045',
  'De l''estuaire aux sources : récits situés, cartes, sons et scénarios d''adaptation pour 2025–2045. Exploration des marches techno-sensibles.',
  ARRAY['dordogne', 'remontée', 'atlas', 'eaux', 'vivantes', 'mascaret', 'estuaire', 'technodiversité', 'agroécologie', 'bioacoustique', '2025-2045'],
  'fr',
  true,
  2,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  theme_principal = EXCLUDED.theme_principal,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  meta_keywords = EXCLUDED.meta_keywords,
  updated_at = now();