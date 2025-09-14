-- Corriger l'import d'espèces pour inclure les 5 espèces du PDF
UPDATE marche_contextes_hybrids 
SET especes_caracteristiques = jsonb_set(
  especes_caracteristiques,
  '{donnees}',
  jsonb_build_object(
    'poissons', jsonb_build_array(
      jsonb_build_object(
        'nom_commun', 'Saumon atlantique',
        'nom_scientifique', 'Salmo salar',
        'statut', 'Vulnérable (France) ; protégé ; pêche interdite en Dordogne depuis 1978',
        'description_courte', 'Espèce migratrice emblématique de la Dordogne',
        'source_ids', jsonb_build_array('S06', 'S07')
      )
    ),
    'flore', jsonb_build_array(
      jsonb_build_object(
        'nom_commun', 'Aulne glutineux',
        'nom_scientifique', 'Alnus glutinosa',
        'statut', 'Espèce caractéristique des berges',
        'description_courte', 'Arbre typique des milieux humides et berges de la Dordogne',
        'source_ids', jsonb_build_array('S06', 'S08')
      ),
      jsonb_build_object(
        'nom_commun', 'Saule blanc',
        'nom_scientifique', 'Salix alba',
        'statut', 'Espèce caractéristique des berges',
        'description_courte', 'Arbre emblématique des ripisylves de la Dordogne',
        'source_ids', jsonb_build_array('S06', 'S08')
      )
    ),
    'mammiferes', jsonb_build_array(
      jsonb_build_object(
        'nom_commun', 'Loutre d''Europe',
        'nom_scientifique', 'Lutra lutra',
        'statut', 'Protégée - Espèce en récupération',
        'description_courte', 'Prédateur aquatique indicateur de la qualité des milieux aquatiques',
        'source_ids', jsonb_build_array('S06', 'S09')
      )
    ),
    'insectes', jsonb_build_array(
      jsonb_build_object(
        'nom_commun', 'Manne blanche',
        'nom_scientifique', 'Ephoron virgo',
        'statut', 'Éphémère indicateur de qualité',
        'description_courte', 'Éphémère dont l''émergence massive forme la "manne blanche" sur la Dordogne',
        'source_ids', jsonb_build_array('S06', 'S09')
      )
    ),
    'sources', jsonb_build_array('S06', 'S07', 'S08', 'S09')
  )
)
WHERE opus_id = '10ed8c41-5361-42f0-b62d-cda24b1d1401' 
AND id = '7e0a7028-33d4-40a5-ba94-de7b6d0f6f27';