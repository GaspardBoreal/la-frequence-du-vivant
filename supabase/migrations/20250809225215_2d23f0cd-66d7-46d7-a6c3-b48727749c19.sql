-- Update existing records that contain "une IA de surveillance" in welcome_povs array
UPDATE exploration_narrative_settings 
SET welcome_povs = array_replace(welcome_povs, 'une IA de surveillance', 'une IA oracle')
WHERE 'une IA de surveillance' = ANY(welcome_povs);