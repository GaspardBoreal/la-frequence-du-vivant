-- Script pour migrer les données de vocabulaire existantes vers le nouveau format catégorisé
-- Cette migration restructure le vocabulaire_local existant en catégories

DO $migration$
DECLARE
    marche_record RECORD;
    current_vocab jsonb;
    new_vocab jsonb;
    termes_locaux jsonb := '[]'::jsonb;
    phenomenes jsonb := '[]'::jsonb;
    pratiques jsonb := '[]'::jsonb;
    item_key text;
    item_value jsonb;
    processed_item jsonb;
BEGIN
    -- Parcourir tous les marchés avec du vocabulaire local
    FOR marche_record IN 
        SELECT marche_id, vocabulaire_local 
        FROM marche_contextes_hybrids 
        WHERE vocabulaire_local IS NOT NULL 
        AND jsonb_typeof(vocabulaire_local) = 'object'
    LOOP
        -- Réinitialiser les catégories pour chaque marché
        termes_locaux := '[]'::jsonb;
        phenomenes := '[]'::jsonb;
        pratiques := '[]'::jsonb;
        current_vocab := marche_record.vocabulaire_local;
        
        -- Parcourir chaque élément du vocabulaire
        FOR item_key, item_value IN SELECT * FROM jsonb_each(current_vocab)
        LOOP
            -- Ignorer les clés système
            CONTINUE WHEN item_key IN ('source_ids', 'sources', 'sources_data');
            
            -- Créer l'objet item standardisé
            processed_item := jsonb_build_object(
                'nom', COALESCE(item_value->>'nom', item_value->>'titre', item_key),
                'description', COALESCE(item_value->>'description', item_value->>'definition', 
                                      CASE WHEN jsonb_typeof(item_value) = 'string' THEN item_value #>> '{}' ELSE '' END),
                'source_ids', COALESCE(item_value->'source_ids', current_vocab->'source_ids', '[]'::jsonb),
                'type', COALESCE(item_value->>'type', 'terme'),
                'metadata', item_value
            );
            
            -- Classification basée sur le nom/contenu
            IF item_key ILIKE ANY(ARRAY['%bouc%', '%créa%', '%gatte%', '%palus%', '%pibale%', '%estey%']) OR
               (item_value->>'type') ILIKE ANY(ARRAY['%terme%', '%local%']) THEN
                termes_locaux := termes_locaux || processed_item;
            ELSIF item_key ILIKE ANY(ARRAY['%crue%', '%étiage%', '%sécheresse%', '%inondation%', '%marée%', '%tempête%', '%mascaret%']) OR
                  (item_value->>'type') ILIKE ANY(ARRAY['%phénomène%', '%météo%', '%climat%']) THEN
                phenomenes := phenomenes || processed_item;
            ELSIF item_key ILIKE ANY(ARRAY['%pêche%', '%agriculture%', '%élevage%', '%navigation%', '%viticulture%']) OR
                  (item_value->>'type') ILIKE ANY(ARRAY['%pratique%', '%activité%', '%métier%']) THEN
                pratiques := pratiques || processed_item;
            ELSE
                -- Par défaut, classer comme terme local
                termes_locaux := termes_locaux || processed_item;
            END IF;
        END LOOP;
        
        -- Construire le nouveau vocabulaire structuré
        new_vocab := jsonb_build_object(
            'termes_locaux', termes_locaux,
            'phenomenes', phenomenes,
            'pratiques', pratiques
        );
        
        -- Conserver les sources originales s'il y en a
        IF current_vocab ? 'source_ids' THEN
            new_vocab := new_vocab || jsonb_build_object('source_ids', current_vocab->'source_ids');
        END IF;
        
        -- Mettre à jour uniquement si on a des éléments à restructurer
        IF jsonb_array_length(termes_locaux) > 0 OR 
           jsonb_array_length(phenomenes) > 0 OR 
           jsonb_array_length(pratiques) > 0 THEN
            
            UPDATE marche_contextes_hybrids 
            SET vocabulaire_local = new_vocab,
                updated_at = NOW()
            WHERE marche_id = marche_record.marche_id;
            
            RAISE NOTICE 'Migré vocabulaire pour marché %: % termes locaux, % phénomènes, % pratiques', 
                marche_record.marche_id, 
                jsonb_array_length(termes_locaux), 
                jsonb_array_length(phenomenes), 
                jsonb_array_length(pratiques);
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration du vocabulaire terminée';
END $migration$;