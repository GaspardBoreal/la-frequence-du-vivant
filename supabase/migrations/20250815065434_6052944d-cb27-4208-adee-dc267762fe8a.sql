-- Update RPC functions to handle config field for exploration pages

-- Update the update_exploration_page function to handle config
CREATE OR REPLACE FUNCTION public.update_exploration_page(
  page_id uuid, 
  page_type text, 
  page_nom text, 
  page_description text DEFAULT ''::text,
  page_config jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE exploration_pages 
  SET 
    type = page_type,
    nom = page_nom,
    description = page_description,
    config = page_config,
    updated_at = NOW()
  WHERE id = page_id;
END;
$function$;

-- Update the insert_exploration_page function to handle config
CREATE OR REPLACE FUNCTION public.insert_exploration_page(
  exploration_id_param uuid, 
  page_type text, 
  page_ordre integer, 
  page_nom text, 
  page_description text DEFAULT ''::text,
  page_config jsonb DEFAULT '{}'::jsonb
) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_page_id UUID;
BEGIN
  INSERT INTO exploration_pages (exploration_id, type, ordre, nom, description, config)
  VALUES (exploration_id_param, page_type, page_ordre, page_nom, page_description, page_config)
  RETURNING id INTO new_page_id;
  
  RETURN new_page_id;
END;
$function$;