
INSERT INTO quiz_questions (niveau, volet, question, type_question, options, explication, frequences_bonus, ordre) VALUES
('marcheur', 'biodiversite', 'Quel est le rôle principal des pollinisateurs dans un écosystème ?', 'choix_multiple', 
 '[{"label": "Ils produisent de l''oxygène", "is_correct": false}, {"label": "Ils permettent la reproduction des plantes à fleurs", "is_correct": true}, {"label": "Ils régulent la température", "is_correct": false}, {"label": "Ils filtrent l''eau des rivières", "is_correct": false}]'::jsonb,
 'Les pollinisateurs (abeilles, papillons, colibris) transportent le pollen d''une fleur à l''autre, permettant la fécondation et la production de fruits et graines. 80% des plantes sauvages dépendent de ce service.', 2, 1),

('marcheur', 'bioacoustique', 'Pourquoi les oiseaux chantent-ils principalement à l''aube ?', 'choix_multiple',
 '[{"label": "Parce qu''ils sont affamés", "is_correct": false}, {"label": "Pour se réchauffer", "is_correct": false}, {"label": "Car le son se propage mieux dans l''air frais et calme", "is_correct": true}, {"label": "Par habitude ancestrale sans raison précise", "is_correct": false}]'::jsonb,
 'Le ''chorus de l''aube'' est un phénomène bioacoustique fascinant : l''air frais et dense du matin porte les sons plus loin, et l''absence de vent réduit les interférences. C''est le moment idéal pour marquer son territoire.', 2, 2),

('marcheur', 'geopoetique', 'Qu''est-ce qu''un kigo dans la tradition du haïku ?', 'choix_multiple',
 '[{"label": "Le nom de l''auteur", "is_correct": false}, {"label": "Un mot de saison qui ancre le poème dans un moment de l''année", "is_correct": true}, {"label": "Le nombre de syllabes", "is_correct": false}, {"label": "Le titre du recueil", "is_correct": false}]'::jsonb,
 'Le kigo (mot de saison) est un élément essentiel du haïku japonais. ''Cerisier en fleur'' évoque le printemps, ''cigale'' l''été, ''lune'' l''automne, ''neige'' l''hiver. Il crée une résonance émotionnelle immédiate.', 2, 3),

('marcheur', 'biodiversite', 'Qu''appelle-t-on une ''zone blanche'' en science participative ?', 'choix_multiple',
 '[{"label": "Une zone protégée interdite au public", "is_correct": false}, {"label": "Une zone sans réseau téléphonique", "is_correct": false}, {"label": "Une zone où aucune observation de biodiversité n''a été enregistrée", "is_correct": true}, {"label": "Une zone enneigée en permanence", "is_correct": false}]'::jsonb,
 'Les zones blanches sont des trous dans nos connaissances : personne n''y a encore observé ni répertorié la biodiversité. Chaque marcheur qui explore une zone blanche contribue à combler ce manque — c''est le cœur de la science participative !', 3, 4),

('marcheur', 'bioacoustique', 'Quel animal produit des sons audibles à plus de 180 décibels ?', 'choix_multiple',
 '[{"label": "L''éléphant", "is_correct": false}, {"label": "La crevette-pistolet (Alpheidae)", "is_correct": true}, {"label": "Le lion", "is_correct": false}, {"label": "La baleine bleue", "is_correct": false}]'::jsonb,
 'La crevette-pistolet produit une bulle de cavitation en refermant sa pince à une vitesse fulgurante, créant un claquement de plus de 200 dB — plus fort qu''un coup de fusil ! Ce son peut étourdir ses proies.', 2, 5);
