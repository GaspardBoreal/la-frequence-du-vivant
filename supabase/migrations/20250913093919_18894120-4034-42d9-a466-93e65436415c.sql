-- Corriger la fonction pour éviter l'ambiguïté de nom de colonne
DROP FUNCTION IF EXISTS migrate_vocabulary_categorization();

CREATE OR REPLACE FUNCTION migrate_vocabulary_categorization()
RETURNS TABLE(rec_opus_id uuid, changes_count integer, migration_log text) AS $$
DECLARE
    r record;
    old_data jsonb;
    new_data jsonb;
    change_count integer := 0;
BEGIN
    -- Parcourir tous les contextes avec des données de vocabulaire
    FOR r IN 
        SELECT h.id, h.opus_id, h.vocabulaire_local 
        FROM marche_contextes_hybrids h
        WHERE h.vocabulaire_local IS NOT NULL
          AND h.vocabulaire_local->'donnees' IS NOT NULL
    LOOP
        old_data := r.vocabulaire_local->'donnees';
        new_data := jsonb_build_object();
        change_count := 0;

        -- Initialiser les nouvelles catégories
        new_data := new_data || jsonb_build_object(
            'termes_locaux', '[]'::jsonb,
            'phenomenes', '[]'::jsonb,
            'pratiques', '[]'::jsonb
        );

        -- Traiter phenomenes_naturels
        IF old_data ? 'phenomenes_naturels' THEN
            new_data := jsonb_set(new_data, '{phenomenes}', old_data->'phenomenes_naturels');
            change_count := change_count + jsonb_array_length(old_data->'phenomenes_naturels');
        END IF;

        -- Traiter pratiques_traditionnelles
        IF old_data ? 'pratiques_traditionnelles' THEN
            new_data := jsonb_set(new_data, '{pratiques}', old_data->'pratiques_traditionnelles');
            change_count := change_count + jsonb_array_length(old_data->'pratiques_traditionnelles');
        END IF;

        -- Traiter termes_hydrologiques
        IF old_data ? 'termes_hydrologiques' THEN
            new_data := jsonb_set(new_data, '{termes_locaux}', old_data->'termes_hydrologiques');
            change_count := change_count + jsonb_array_length(old_data->'termes_hydrologiques');
        END IF;

        -- Garder les autres sections existantes
        IF old_data ? 'termes_locaux' THEN
            new_data := jsonb_set(new_data, '{termes_locaux}', 
                COALESCE(new_data->'termes_locaux', '[]'::jsonb) || old_data->'termes_locaux');
        END IF;

        IF old_data ? 'phenomenes' THEN
            new_data := jsonb_set(new_data, '{phenomenes}', 
                COALESCE(new_data->'phenomenes', '[]'::jsonb) || old_data->'phenomenes');
        END IF;

        IF old_data ? 'pratiques' THEN
            new_data := jsonb_set(new_data, '{pratiques}', 
                COALESCE(new_data->'pratiques', '[]'::jsonb) || old_data->'pratiques');
        END IF;

        -- Mettre à jour seulement si des changements ont été faits
        IF change_count > 0 THEN
            UPDATE marche_contextes_hybrids 
            SET vocabulaire_local = jsonb_set(
                vocabulaire_local, 
                '{donnees}', 
                new_data
            ) || jsonb_build_object(
                'migration', jsonb_build_object(
                    'date', now(),
                    'changes_count', change_count,
                    'version', '1.0'
                )
            ),
            updated_at = now()
            WHERE id = r.id;

            -- Retourner les informations de migration
            rec_opus_id := r.opus_id;
            changes_count := change_count;
            migration_log := format('Migrated %s items for opus %s', change_count, r.opus_id);
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;