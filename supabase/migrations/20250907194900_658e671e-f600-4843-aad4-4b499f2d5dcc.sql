-- Nettoyer les données de vocabulaire pour supprimer les éléments techniques non-locaux
DO $cleanup$
DECLARE
    marche_record RECORD;
    current_vocab jsonb;
    termes_locaux jsonb;
    cleaned_termes jsonb := '[]'::jsonb;
    item jsonb;
BEGIN
    -- Parcourir tous les marchés avec du vocabulaire local
    FOR marche_record IN 
        SELECT marche_id, vocabulaire_local 
        FROM marche_contextes_hybrids 
        WHERE vocabulaire_local IS NOT NULL 
        AND vocabulaire_local->'termes_locaux' IS NOT NULL
    LOOP
        current_vocab := marche_record.vocabulaire_local;
        termes_locaux := current_vocab->'termes_locaux';
        cleaned_termes := '[]'::jsonb;
        
        -- Parcourir les termes locaux et filtrer les éléments techniques
        FOR item IN SELECT jsonb_array_elements FROM jsonb_array_elements(termes_locaux)
        LOOP
            -- Garder seulement les vrais termes (pas les clés techniques)
            IF (item->>'nom') NOT IN ('description', 'donnees', 'metadata', 'source_ids', 'sources') AND
               (item->>'nom') IS NOT NULL AND
               (item->>'nom') != '' THEN
                cleaned_termes := cleaned_termes || item;
            END IF;
        END LOOP;
        
        -- Mettre à jour le vocabulaire avec les termes nettoyés
        UPDATE marche_contextes_hybrids 
        SET vocabulaire_local = jsonb_set(
            current_vocab, 
            '{termes_locaux}', 
            cleaned_termes
        ),
        updated_at = NOW()
        WHERE marche_id = marche_record.marche_id;
        
        RAISE NOTICE 'Nettoyé vocabulaire pour marché %: % termes conservés', 
            marche_record.marche_id, 
            jsonb_array_length(cleaned_termes);
    END LOOP;
    
    RAISE NOTICE 'Nettoyage terminé';
END $cleanup$;