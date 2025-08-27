-- Upsert French common names for targeted butterflies and dragonflies
INSERT INTO public.species_translations (scientific_name, common_name_fr, source, confidence_level)
VALUES
  -- Specific species from the issue
  ('Calopteryx', 'Caloptéryx', 'manual', 'high'),
  ('Maniola jurtina', 'Myrtil', 'manual', 'high'),
  ('Vanessa atalanta', 'Vulcain', 'manual', 'high'),
  ('Iphiclides podalirius', 'Flambé', 'manual', 'high'),
  ('Macroglossum stellatarum', 'Moro-sphinx', 'manual', 'high'),

  -- Other common butterflies in France
  ('Pieris rapae', 'Piéride de la rave', 'manual', 'high'),
  ('Pieris brassicae', 'Piéride du chou', 'manual', 'high'),
  ('Aglais urticae', 'Petite tortue', 'manual', 'high'),
  ('Inachis io', 'Paon-du-jour', 'manual', 'high'),
  ('Polygonia c-album', 'Robert-le-diable', 'manual', 'high'),
  ('Papilio machaon', 'Machaon', 'manual', 'high'),
  ('Gonepteryx rhamni', 'Citron', 'manual', 'high'),
  ('Anthocharis cardamines', 'Aurore', 'manual', 'high'),
  ('Lycaena phlaeas', 'Cuivré commun', 'manual', 'high'),
  ('Polyommatus icarus', 'Argus bleu', 'manual', 'high'),

  -- Common dragonflies/damselflies
  ('Calopteryx splendens', 'Caloptéryx éclatant', 'manual', 'high'),
  ('Calopteryx virgo', 'Caloptéryx vierge', 'manual', 'high'),
  ('Libellula depressa', 'Libellule déprimée', 'manual', 'high'),
  ('Sympetrum striolatum', 'Sympétrum strié', 'manual', 'high'),
  ('Aeshna cyanea', 'Aeschne bleue', 'manual', 'high'),
  ('Anax imperator', 'Anax empereur', 'manual', 'high'),
  ('Ischnura elegans', 'Agrion élégant', 'manual', 'high'),
  ('Coenagrion puella', 'Agrion jouvencelle', 'manual', 'high')
ON CONFLICT (scientific_name)
DO UPDATE SET
  common_name_fr = EXCLUDED.common_name_fr,
  source = EXCLUDED.source,
  confidence_level = EXCLUDED.confidence_level,
  updated_at = now();