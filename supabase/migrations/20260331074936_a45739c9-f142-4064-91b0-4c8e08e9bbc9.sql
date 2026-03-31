-- Step 1: Validate all unvalidated participations (triggers role recalculation)
UPDATE marche_participations 
SET validated_at = now(), validation_method = 'admin_retroactif'
WHERE validated_at IS NULL;

-- Step 2: Force Gaspard Boreal to sentinelle (creator of the initiative)
UPDATE community_profiles 
SET role = 'sentinelle', formation_validee = true, certification_validee = true
WHERE prenom = 'Gaspard' AND nom = 'Boreal';

-- Step 3: Fix inverted name for Laurence Karki
UPDATE community_profiles 
SET prenom = 'Laurence', nom = 'Karki'
WHERE user_id = '0c9a3fbe-20d0-4989-bde9-24678768e85f';