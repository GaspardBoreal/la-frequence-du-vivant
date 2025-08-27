-- Ajouter les traductions françaises pour les espèces de papillons et libellules identifiées
INSERT INTO species_translations (scientific_name, common_name, language, source, confidence) VALUES
-- Les 4 espèces spécifiques du problème
('Calopteryx', 'Caloptéryx', 'fr', 'local', 'high'),
('Maniola jurtina', 'Myrtil', 'fr', 'local', 'high'),
('Vanessa atalanta', 'Vulcain', 'fr', 'local', 'high'),
('Iphiclides podalirius', 'Flambé', 'fr', 'local', 'high'),
('Macroglossum stellatarum', 'Moro-sphinx', 'fr', 'local', 'high'),

-- Autres papillons communs de France
('Pieris rapae', 'Piéride de la rave', 'fr', 'local', 'high'),
('Pieris brassicae', 'Piéride du chou', 'fr', 'local', 'high'),
('Aglais urticae', 'Petite tortue', 'fr', 'local', 'high'),
('Inachis io', 'Paon-du-jour', 'fr', 'local', 'high'),
('Polygonia c-album', 'Robert-le-diable', 'fr', 'local', 'high'),
('Papilio machaon', 'Machaon', 'fr', 'local', 'high'),
('Gonepteryx rhamni', 'Citron', 'fr', 'local', 'high'),
('Anthocharis cardamines', 'Aurore', 'fr', 'local', 'high'),
('Lycaena phlaeas', 'Cuivré commun', 'fr', 'local', 'high'),
('Polyommatus icarus', 'Argus bleu', 'fr', 'local', 'high'),

-- Libellules communes
('Calopteryx splendens', 'Caloptéryx éclatant', 'fr', 'local', 'high'),
('Calopteryx virgo', 'Caloptéryx vierge', 'fr', 'local', 'high'),
('Libellula depressa', 'Libellule déprimée', 'fr', 'local', 'high'),
('Sympetrum striolatum', 'Sympétrum strié', 'fr', 'local', 'high'),
('Aeshna cyanea', 'Aeschne bleue', 'fr', 'local', 'high'),
('Anax imperator', 'Anax empereur', 'fr', 'local', 'high'),
('Ischnura elegans', 'Agrion élégant', 'fr', 'local', 'high'),
('Coenagrion puella', 'Agrion jouvencelle', 'fr', 'local', 'high')

ON CONFLICT (scientific_name, language) 
DO UPDATE SET 
  common_name = EXCLUDED.common_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  updated_at = now();