-- Suppression du terme "Estey" du vocabulaire local et recalcul des indicateurs
-- Étape 1: Supprimer "Estey" de tous les vocabulaires locaux

UPDATE marche_contextes_hybrids 
SET vocabulaire_local = vocabulaire_local - 'Estey'
WHERE vocabulaire_local ? 'Estey';

-- Étape 2: Supprimer "Estey" des termes du vocabulaire s'il existe en tant qu'array d'objets
UPDATE marche_contextes_hybrids 
SET vocabulaire_local = jsonb_set(
    vocabulaire_local,
    '{termes}',
    (
        SELECT jsonb_agg(terme)
        FROM jsonb_array_elements(vocabulaire_local->'termes') AS terme
        WHERE terme->>'nom' != 'Estey' 
        AND terme->>'terme' != 'Estey'
        AND terme->>'titre' != 'Estey'
    )
)
WHERE vocabulaire_local ? 'termes' 
AND vocabulaire_local->'termes' @> '[{"nom": "Estey"}]'::jsonb
OR vocabulaire_local->'termes' @> '[{"terme": "Estey"}]'::jsonb
OR vocabulaire_local->'termes' @> '[{"titre": "Estey"}]'::jsonb;

-- Étape 3: Recalculer les scores de complétude pour tous les contextes affectés
-- (Le score sera recalculé automatiquement lors de la prochaine consultation)

-- Étape 4: Mettre à jour les timestamps pour indiquer que les données ont été modifiées
UPDATE marche_contextes_hybrids 
SET updated_at = NOW()
WHERE vocabulaire_local IS NOT NULL;

-- Étape 5: Ajouter un log pour tracer cette opération de nettoyage
INSERT INTO data_collection_logs (
    collection_type,
    collection_mode,
    status,
    completed_at,
    summary_stats,
    duration_seconds
) VALUES (
    'vocabulary_cleanup',
    'manual',
    'completed',
    NOW(),
    jsonb_build_object(
        'removed_term', 'Estey',
        'reason', 'No valid source found',
        'cleaned_records', (
            SELECT COUNT(*) 
            FROM marche_contextes_hybrids 
            WHERE updated_at = NOW()
        )
    ),
    1
);