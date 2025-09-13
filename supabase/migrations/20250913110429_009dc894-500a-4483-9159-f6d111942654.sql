-- Backfill empreintes_humaines from opus_import_runs for marches with NULL empreintes_humaines
UPDATE marche_contextes_hybrids 
SET empreintes_humaines = jsonb_build_object(
  'donnees', CASE 
    WHEN (oir.request_payload->'data'->'dimensions'->>'infrastructures_techniques') IS NOT NULL 
    THEN jsonb_build_object(
      'infrastructures_hydrauliques', oir.request_payload->'data'->'dimensions'->'infrastructures_techniques'
    )
    ELSE '{}'::jsonb
  END,
  'source', 'backfill_from_import_runs',
  'date_migration', now()
),
updated_at = now()
FROM opus_import_runs oir
WHERE marche_contextes_hybrids.marche_id = oir.marche_id 
  AND marche_contextes_hybrids.empreintes_humaines IS NULL
  AND oir.request_payload->'data'->'dimensions'->>'infrastructures_techniques' IS NOT NULL;