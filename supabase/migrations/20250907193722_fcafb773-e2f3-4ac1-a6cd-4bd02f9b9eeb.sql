-- Modifier la structure du vocabulaire local pour supporter les catégories
-- Ajouter une fonction pour structurer les données de vocabulaire avec catégories

CREATE OR REPLACE FUNCTION public.get_structured_vocabulary_data(
  marche_id_param uuid
)
RETURNS TABLE(
  termes_locaux jsonb,
  phenomenes jsonb,
  pratiques jsonb,
  sources jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vocabulary_data jsonb;
  source_data jsonb;
BEGIN
  -- Récupérer les données de vocabulaire
  SELECT vocabulaire_local, sources 
  INTO vocabulary_data, source_data
  FROM marche_contextes_hybrids 
  WHERE marche_id = marche_id_param;
  
  -- Retourner les données structurées par catégorie
  RETURN QUERY SELECT 
    COALESCE(vocabulary_data->'termes_locaux', '[]'::jsonb) as termes_locaux,
    COALESCE(vocabulary_data->'phenomenes', '[]'::jsonb) as phenomenes,
    COALESCE(vocabulary_data->'pratiques', '[]'::jsonb) as pratiques,
    COALESCE(source_data, '[]'::jsonb) as sources;
END;
$function$;