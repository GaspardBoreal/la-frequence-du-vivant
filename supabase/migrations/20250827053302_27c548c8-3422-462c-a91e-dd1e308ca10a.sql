-- Add common French species translations to improve translation coverage
INSERT INTO species_translations (scientific_name, common_name_fr, common_name_en, source, confidence_level) VALUES
-- Plants commonly found in French biodiversity data
('Carex pseudocyperus', 'Laîche faux-souchet', 'Cyperus Sedge', 'manual', 'high'),
('Carex', 'Laîche', 'Sedge', 'manual', 'high'),
('Eucalyptus', 'Eucalyptus', 'Eucalyptus', 'manual', 'high'),
('Arundo donax', 'Canne de Provence', 'Giant Reed', 'manual', 'high'),
('Salix babylonica', 'Saule pleureur', 'Weeping Willow', 'manual', 'high'),
('Juncus tenuis', 'Jonc grêle', 'Slender Rush', 'manual', 'high'),
('Crocosmia', 'Crocosmie', 'Crocosmia', 'manual', 'high'),
('Pyrus', 'Poirier', 'Pear', 'manual', 'high'),
('Anthoxanthum', 'Flouve', 'Sweet Vernal Grass', 'manual', 'high'),
('Muscari', 'Muscari', 'Grape Hyacinth', 'manual', 'high'),
('Acacia dealbata', 'Mimosa', 'Silver Wattle', 'manual', 'high'),
('Prunus domestica', 'Prunier domestique', 'European Plum', 'manual', 'high'),
('Tracheophyta', 'Plantes vasculaires', 'Vascular Plants', 'manual', 'high'),
('Poaceae', 'Graminées', 'Grass Family', 'manual', 'high'),
('Dactylis glomerata', 'Dactyle aggloméré', 'Cock''s-foot', 'manual', 'high'),
('Persicaria', 'Renouée', 'Knotweed', 'manual', 'high'),
('Oxalis', 'Oxalide', 'Wood Sorrel', 'manual', 'high'),
('Impatiens balfourii', 'Balsamine de Balfour', 'Balfour''s Touch-me-not', 'manual', 'high'),
('Erigeron karvinskianus', 'Vergerette de Karvinski', 'Mexican Fleabane', 'manual', 'high'),
('Raphanus raphanistrum', 'Ravenelle', 'Wild Radish', 'manual', 'high'),
('Hieracium murorum', 'Épervière des murs', 'Wall Hawkweed', 'manual', 'high'),
('Dipsacus fullonum', 'Cardère sauvage', 'Wild Teasel', 'manual', 'high'),

-- Birds commonly found in French biodiversity data
('Strix aluco', 'Chouette hulotte', 'Tawny Owl', 'manual', 'high'),
('Ciconia ciconia', 'Cigogne blanche', 'White Stork', 'manual', 'high'),
('Aegithalos caudatus', 'Mésange à longue queue', 'Long-tailed Tit', 'manual', 'high'),
('Pararge aegeria', 'Tircis', 'Speckled Wood', 'manual', 'high'),

-- Insects and other fauna
('Episyrphus balteatus', 'Syrphe ceinturé', 'Marmalade Hoverfly', 'manual', 'high'),
('Sympetrum fonscolombii', 'Sympétrum de Fonscolombe', 'Red-veined Darter', 'manual', 'high'),
('Lasiommata megera', 'Mégère', 'Wall Brown', 'manual', 'high'),
('Libelloides coccajus', 'Ascalaphe soufré', 'Owlfly', 'manual', 'high'),
('Melitaea didyma', 'Mélitée orangée', 'Spotted Fritillary', 'manual', 'high'),
('Zygaena transalpina', 'Zygène transalpine', 'Transalpine Burnet', 'manual', 'high'),
('Nezara viridula', 'Punaise verte', 'Southern Green Stink Bug', 'manual', 'high'),
('Chrysodeixis chalcites', 'Noctuelle du géranium', 'Golden Twin-spot', 'manual', 'high'),
('Crematogaster scutellaris', 'Crématogastre écussonnée', 'Acrobat Ant', 'manual', 'high'),
('Zoropsis spinimana', 'Zoropsis épineux', 'False Wolf Spider', 'manual', 'high'),
('Xysticus cristatus', 'Xystique crestée', 'Common Crab Spider', 'manual', 'high'),
('Cyclosa oculata', 'Épeire à bosses', 'Four-spotted Orb Weaver', 'manual', 'high'),
('Otiorhynchus', 'Otiorhynque', 'Weevil', 'manual', 'high'),
('Xeroplexa intersecta', 'Hélice carénée', 'Wrinkled Snail', 'manual', 'high'),
('Myathropa florea', 'Myathrope fleuri', 'Button Snail', 'manual', 'high'),

-- Taxonomic groups
('Hemiptera', 'Hémiptères', 'True Bugs', 'manual', 'high'),
('Tipulidae', 'Tipulidés', 'Crane Flies', 'manual', 'high'),
('Miridae', 'Miridés', 'Plant Bugs', 'manual', 'high'),
('Auchenorrhyncha', 'Auchen', 'Leafhoppers', 'manual', 'high'),
('Pterygota', 'Ptérygotes', 'Winged Insects', 'manual', 'high'),
('Acari', 'Acariens', 'Mites', 'manual', 'high'),
('Nematocera', 'Nématocères', 'Long-horned Flies', 'manual', 'high'),

-- Fungi
('Macrolepiota procera', 'Coulemelle', 'Parasol Mushroom', 'manual', 'high')

ON CONFLICT (scientific_name) DO UPDATE SET
  common_name_fr = EXCLUDED.common_name_fr,
  common_name_en = EXCLUDED.common_name_en,
  source = EXCLUDED.source,
  confidence_level = EXCLUDED.confidence_level,
  updated_at = now();