-- Phase 1.1: Database constraints and validation for exploration pages

-- Add constraints to ensure max 1 Audio Page and 1 Precommande Page per exploration
CREATE OR REPLACE FUNCTION public.validate_exploration_page_limits()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for validation on INSERT and UPDATE
CREATE TRIGGER validate_exploration_page_limits_trigger
  BEFORE INSERT OR UPDATE ON exploration_pages
  FOR EACH ROW EXECUTE FUNCTION validate_exploration_page_limits();

-- Auto-manage page order when inserting new pages
CREATE OR REPLACE FUNCTION public.auto_order_exploration_pages()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for auto-ordering
CREATE TRIGGER auto_order_exploration_pages_trigger
  BEFORE INSERT ON exploration_pages
  FOR EACH ROW EXECUTE FUNCTION auto_order_exploration_pages();

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_exploration_pages_exploration_id_type ON exploration_pages (exploration_id, type);
CREATE INDEX IF NOT EXISTS idx_exploration_pages_exploration_id_ordre ON exploration_pages (exploration_id, ordre);
CREATE INDEX IF NOT EXISTS idx_exploration_marches_exploration_id_ordre ON exploration_marches (exploration_id, ordre);