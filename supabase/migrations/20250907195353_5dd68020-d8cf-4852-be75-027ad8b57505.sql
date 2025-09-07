-- Reconstruire les données de vocabulaire avec les 3 catégories correctement peuplées
DO $reconstruction$
DECLARE
    marche_record_id uuid;
BEGIN
    -- Trouver le marché Bec d'Ambès
    SELECT m.id INTO marche_record_id 
    FROM marches m 
    WHERE m.nom_marche ILIKE '%Bec d''Ambès%' 
    LIMIT 1;
    
    IF marche_record_id IS NOT NULL THEN
        -- Reconstruire le vocabulaire local avec toutes les catégories
        UPDATE marche_contextes_hybrids 
        SET vocabulaire_local = jsonb_build_object(
            'termes_locaux', jsonb_build_array(
                jsonb_build_object(
                    'nom', 'Boucs',
                    'description', 'Argot local pour les crevettes blanches estuariennes.',
                    'definition', 'Argot local pour les crevettes blanches estuariennes.',
                    'exemple', '« Ce soir, on va aux carrelets attraper des boucs. »',
                    'source_ids', jsonb_build_array('S00'),
                    'type', 'terme',
                    'metadata', jsonb_build_object(
                        'terme', 'Boucs',
                        'definition', 'Argot local pour les crevettes blanches estuariennes.',
                        'exemple', '« Ce soir, on va aux carrelets attraper des boucs. »',
                        'source_ids', jsonb_build_array('S00')
                    )
                ),
                jsonb_build_object(
                    'nom', 'Créa',
                    'description', 'Nom dialectal de l''esturgeon (Acipenser sturio).',
                    'definition', 'Nom dialectal de l''esturgeon (Acipenser sturio).',
                    'exemple', '« J''ai pris une créa de 2 m. »',
                    'source_ids', jsonb_build_array('S00'),
                    'type', 'terme',
                    'metadata', jsonb_build_object(
                        'terme', 'Créa',
                        'definition', 'Nom dialectal de l''esturgeon (Acipenser sturio).',
                        'exemple', '« J''ai pris une créa de 2 m. »',
                        'source_ids', jsonb_build_array('S00')
                    )
                ),
                jsonb_build_object(
                    'nom', 'Gatte',
                    'description', 'Surnom local de l''alose feinte (Alosa fallax).',
                    'definition', 'Surnom local de l''alose feinte (Alosa fallax).',
                    'exemple', '« La lamproie et la gatte se cuisinent au vin rouge. »',
                    'source_ids', jsonb_build_array('S00'),
                    'type', 'terme',
                    'metadata', jsonb_build_object(
                        'terme', 'Gatte',
                        'definition', 'Surnom local de l''alose feinte (Alosa fallax).',
                        'exemple', '« La lamproie et la gatte se cuisinent au vin rouge. »',
                        'source_ids', jsonb_build_array('S00')
                    )
                ),
                jsonb_build_object(
                    'nom', 'Palus',
                    'description', 'Terres basses marécageuses endiguées puis asséchées (vins de palus).',
                    'definition', 'Terres basses marécageuses endiguées puis asséchées (vins de palus).',
                    'exemple', '« Les palus d''Ambès ont été inondés lors de la crue. »',
                    'source_ids', jsonb_build_array('S00', 'S08'),
                    'type', 'terme',
                    'metadata', jsonb_build_object(
                        'terme', 'Palus (palue, palud)',
                        'definition', 'Terres basses marécageuses endiguées puis asséchées (vins de palus).',
                        'exemple', '« Les palus d''Ambès ont été inondés lors de la crue. »',
                        'source_ids', jsonb_build_array('S00', 'S08')
                    )
                ),
                jsonb_build_object(
                    'nom', 'Pibale',
                    'description', 'Nom local de la civelle (alevin de l''anguille européenne).',
                    'definition', 'Nom local de la civelle (alevin de l''anguille européenne).',
                    'exemple', '« En 1980 on pêchait des kilos de pibales à l''écluse de Saint‑Louis. »',
                    'source_ids', jsonb_build_array('S00', 'S09'),
                    'type', 'terme',
                    'metadata', jsonb_build_object(
                        'terme', 'Pibale',
                        'definition', 'Nom local de la civelle (alevin de l''anguille européenne).',
                        'exemple', '« En 1980 on pêchait des kilos de pibales à l''écluse de Saint‑Louis. »',
                        'source_ids', jsonb_build_array('S00', 'S09')
                    )
                )
            ),
            'phenomenes', jsonb_build_array(
                jsonb_build_object(
                    'nom', 'Bouchon vaseux',
                    'description', 'Phénomène de concentration de sédiments dans l''estuaire.',
                    'type', 'phenomene',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Bouchon vaseux', 'source_ids', jsonb_build_array('S00'))
                ),
                jsonb_build_object(
                    'nom', 'Étale',
                    'description', 'Moment où la marée ne monte ni ne descend.',
                    'type', 'phenomene',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Étale', 'source_ids', jsonb_build_array('S00'))
                ),
                jsonb_build_object(
                    'nom', 'Flot',
                    'description', 'Marée montante dans l''estuaire.',
                    'type', 'phenomene',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Flot', 'source_ids', jsonb_build_array('S00'))
                ),
                jsonb_build_object(
                    'nom', 'Intrusion saline',
                    'description', 'Remontée d''eau salée dans l''estuaire.',
                    'type', 'phenomene',
                    'source_ids', jsonb_build_array('S00', 'S06'),
                    'metadata', jsonb_build_object('nom', 'Intrusion saline', 'source_ids', jsonb_build_array('S00', 'S06'))
                ),
                jsonb_build_object(
                    'nom', 'Jusant',
                    'description', 'Marée descendante dans l''estuaire.',
                    'type', 'phenomene',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Jusant', 'source_ids', jsonb_build_array('S00'))
                ),
                jsonb_build_object(
                    'nom', 'Mascaret',
                    'description', 'Vague remontant le fleuve lors des grandes marées.',
                    'type', 'phenomene',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Mascaret', 'source_ids', jsonb_build_array('S00'))
                )
            ),
            'pratiques', jsonb_build_array(
                jsonb_build_object(
                    'nom', 'Battre l''eau (mulets)',
                    'description', 'Technique de pêche locale pour attraper les mulets.',
                    'type', 'pratique',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Battre l''eau (mulets)', 'source_ids', jsonb_build_array('S00'))
                ),
                jsonb_build_object(
                    'nom', 'Cueillette de salicornes',
                    'description', 'Récolte de plantes halophiles dans les marais salés.',
                    'type', 'pratique',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Cueillette de salicornes', 'source_ids', jsonb_build_array('S00'))
                ),
                jsonb_build_object(
                    'nom', 'Dragage du chenal',
                    'description', 'Entretien des voies navigables de l''estuaire.',
                    'type', 'pratique',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Dragage du chenal', 'source_ids', jsonb_build_array('S00'))
                ),
                jsonb_build_object(
                    'nom', 'Pêche au carrelet',
                    'description', 'Pêche traditionnelle avec filet carré suspendu.',
                    'type', 'pratique',
                    'source_ids', jsonb_build_array('S00'),
                    'metadata', jsonb_build_object('nom', 'Pêche au carrelet', 'source_ids', jsonb_build_array('S00'))
                )
            )
        ),
        updated_at = NOW()
        WHERE marche_id = marche_record_id;
        
        RAISE NOTICE 'Vocabulaire reconstruit pour le marché Bec d''Ambès: 5 termes locaux, 6 phénomènes, 4 pratiques';
    ELSE
        RAISE NOTICE 'Marché Bec d''Ambès introuvable';
    END IF;
END $reconstruction$;