-- Migration pour harmoniser les formats de données dans opus_import_runs
-- Transformer infrastructures_techniques -> empreintes_humaines dans request_payload

UPDATE opus_import_runs 
SET request_payload = jsonb_set(
  -- Supprimer l'ancienne clé infrastructures_techniques
  request_payload #- '{data,dimensions,infrastructures_techniques}',
  -- Ajouter la nouvelle clé empreintes_humaines
  '{data,dimensions,empreintes_humaines}',
  jsonb_build_object(
    'description', 'Infrastructures et aménagements caractéristiques du site.',
    'donnees', request_payload->'data'->'dimensions'->'infrastructures_techniques'
  )
)
WHERE request_payload->'data'->'dimensions' ? 'infrastructures_techniques'
  AND NOT (request_payload->'data'->'dimensions' ? 'empreintes_humaines');

-- Ajouter une trace de la transformation pour audit
UPDATE opus_import_runs 
SET request_payload = jsonb_set(
  request_payload,
  '{data,dimensions,empreintes_humaines,transformation}',
  jsonb_build_object(
    'date', now(),
    'source', 'migration_harmonization_infrastructures_techniques',
    'version', '1.0'
  )
)
WHERE request_payload->'data'->'dimensions'->'empreintes_humaines'->>'transformation' IS NULL
  AND request_payload->'data'->'dimensions' ? 'empreintes_humaines';