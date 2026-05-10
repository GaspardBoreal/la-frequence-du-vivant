
INSERT INTO species_translations (scientific_name, common_name_fr, alternative_names_fr, source, confidence_level)
VALUES ('Graphosoma italicum', 'Punaise arlequin', ARRAY['Pentatome rayé','Gendarme d''Italie','Graphosome d''Italie'], 'manual', 'high')
ON CONFLICT (scientific_name) DO UPDATE SET
  common_name_fr = EXCLUDED.common_name_fr,
  alternative_names_fr = EXCLUDED.alternative_names_fr,
  source = 'manual',
  confidence_level = 'high',
  updated_at = now();

UPDATE species_translations SET
  common_name_fr = 'Petit-gris',
  alternative_names_fr = ARRAY['Escargot petit-gris','Escargot chagriné','Cornu aspersum'],
  source = 'manual', confidence_level = 'high', updated_at = now()
WHERE scientific_name = 'Cornu aspersum';

UPDATE species_translations SET
  common_name_fr = 'Bruant zizi',
  alternative_names_fr = ARRAY['Zizi'],
  source = 'manual', confidence_level = 'high', updated_at = now()
WHERE scientific_name = 'Emberiza cirlus';

UPDATE species_translations SET
  common_name_fr = 'Agrions',
  alternative_names_fr = ARRAY['Demoiselles','Coenagrionidés'],
  source = 'manual', confidence_level = 'high', updated_at = now()
WHERE scientific_name = 'Coenagrionidae';

UPDATE species_translations SET
  common_name_fr = 'Mélitées',
  alternative_names_fr = ARRAY['Damiers','Mélitée'],
  source = 'manual', confidence_level = 'high', updated_at = now()
WHERE scientific_name = 'Melitaea';

UPDATE species_translations SET
  common_name_fr = 'Gendarme',
  alternative_names_fr = ARRAY['Pyrrhocore aptère','Suisse','Cherche-midi','Punaise rouge du feu'],
  source = 'manual', confidence_level = 'high', updated_at = now()
WHERE scientific_name = 'Pyrrhocoris apterus';
