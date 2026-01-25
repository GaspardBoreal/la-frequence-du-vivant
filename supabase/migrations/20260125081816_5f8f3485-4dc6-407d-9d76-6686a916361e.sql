-- Migration des mots-clés personnalisés vers leurs catégories appropriées

-- Ouvrages Humains
UPDATE export_keywords SET category = 'ouvrages' WHERE keyword IN ('aqueduc', 'belvédère', 'jetée', 'passerelle', 'viaduc');

-- Flore et Paysages
UPDATE export_keywords SET category = 'flore' WHERE keyword IN ('coteau', 'crête', 'écorce', 'fibre', 'lichen');

-- Technologies et Médiations
UPDATE export_keywords SET category = 'technologies' WHERE keyword IN ('hologramme', 'sonde');

-- Hydrologie et Dynamiques Fluviales
UPDATE export_keywords SET category = 'hydrologie' WHERE keyword IN ('galet');

-- Faune Fluviale et Migratrice
UPDATE export_keywords SET category = 'faune' WHERE keyword IN ('pêcheur', 'pic-vert');