-- Fix security warnings: Set search_path for functions

-- Update the validation function with proper search_path
CREATE OR REPLACE FUNCTION public.validate_exploration_page_limits()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audio_count INTEGER;
  precommande_count INTEGER;
BEGIN
  -- Check Audio Page limit (max 1 per exploration)
  IF NEW.type = 'audio' THEN
    SELECT COUNT(*) INTO audio_count 
    FROM exploration_pages 
    WHERE exploration_id = NEW.exploration_id 
    AND type = 'audio' 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF audio_count >= 1 THEN
      RAISE EXCEPTION 'Une exploration ne peut avoir qu''une seule Page Audio';
    END IF;
  END IF;
  
  -- Check Precommande Page limit (max 1 per exploration)  
  IF NEW.type = 'precommande' THEN
    SELECT COUNT(*) INTO precommande_count
    FROM exploration_pages 
    WHERE exploration_id = NEW.exploration_id 
    AND type = 'precommande'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF precommande_count >= 1 THEN
      RAISE EXCEPTION 'Une exploration ne peut avoir qu''une seule Page Pré-commande';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the auto-ordering function with proper search_path  
CREATE OR REPLACE FUNCTION public.auto_order_exploration_pages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- If no order specified, auto-assign next order
  IF NEW.ordre IS NULL THEN
    SELECT COALESCE(MAX(ordre), 0) + 1 INTO max_order
    FROM exploration_pages 
    WHERE exploration_id = NEW.exploration_id;
    
    NEW.ordre = max_order;
  END IF;
  
  RETURN NEW;
END;
$$;