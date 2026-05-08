DELETE FROM public.species_translations
WHERE source = 'ai'
  AND scientific_name IN (
    'Acronicta psi','Agrotis exclamationis','Altenia scriptella','Ancylolomia tentaculella',
    'Atrosquamosa','Bembix oculata','Blaps mucronata','Cantharis fusca','Cantharis rustica',
    'Cerastium glomeratum','Cheilosia','Ctenicera cuprea','Cuphophyllus virgineus',
    'Delta unguiculatum','Epirrhoe galiata','Eresus moravicus','Eupeodes pomus',
    'Galerina marginata','Hirticomus quadriguttatus','Hygrocybe reidii','Iberis amara',
    'Iberodorcadion fuliginator','Laspeyria flexula','Linum appressum','Lygistopterus sanguineus',
    'Lymantria dispar','Lymantria monacha','Matthiola sinuata','Mibora minima','Minois dryas',
    'Mormo maura','Odezia atrata','Palaeococcus fuscipennis','Pernis apivorus','Pheosia tremula',
    'Phlomis fruticosa','Phoxinus dragarum','Platycnemis acutipennis','Platycnemis pennipes',
    'Rainieria calceata','Rosa sempervirens','Salsola kali','Sitochroa verticalis',
    'Smyrnium olusatrum','Spiranthes spiralis','Stachys palustris','Tanacetum parthenium',
    'Tenthredinoidea','Torilis nodosa','Torminalis glaberrima','Valeria jaspidea',
    'Ypsolopha sequella'
  );