UPDATE opus_import_runs 
SET request_payload = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        request_payload,
        '{data,dimensions,especes_caracteristiques,donnees,flore}',
        '[
          {"nom_commun": "Aulne glutineux", "nom_scientifique": "Alnus glutinosa", "statut_conservation": "Non menacé", "description_courte": "Arbre caractéristique de la ripisylve"}, 
          {"nom_commun": "Saule blanc", "nom_scientifique": "Salix alba", "statut_conservation": "Non menacé", "description_courte": "Arbre typique des berges de la Dordogne"}
        ]'::jsonb
      ),
      '{data,dimensions,especes_caracteristiques,donnees,mammiferes}',
      '[{"nom_commun": "Loutre d''Europe", "nom_scientifique": "Lutra lutra", "statut_conservation": "Vulnérable", "description_courte": "Mammifère semi-aquatique indicateur de qualité écologique"}]'::jsonb
    ),
    '{data,dimensions,especes_caracteristiques,donnees,insectes}',
    '[{"nom_commun": "Manne blanche", "nom_scientifique": "Ephoron virgo", "statut_conservation": "À surveiller", "description_courte": "Éphémère indicateur de la qualité de l''eau"}]'::jsonb
  ),
  '{data,dimensions,especes_caracteristiques,donnees,sources}',
  '["S06", "S07", "S08", "S09"]'::jsonb
)
WHERE id = '74167388-a64c-49f9-9284-3f2da4e3209f';