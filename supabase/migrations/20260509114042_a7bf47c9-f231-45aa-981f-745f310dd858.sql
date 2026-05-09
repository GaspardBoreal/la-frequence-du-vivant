UPDATE public.species_translations
SET common_name_fr = 'Sphinx fuciforme',
    alternative_names_fr = ARRAY['Sphinx gazé', 'Sphinx bombyliforme'],
    source = 'manual',
    confidence_level = 'high',
    updated_at = now()
WHERE scientific_name = 'Hemaris fuciformis';