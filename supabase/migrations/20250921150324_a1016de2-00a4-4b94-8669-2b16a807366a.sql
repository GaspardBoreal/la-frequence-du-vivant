-- Phase 1: Extend data model for progressive publishing
-- Add publication_status to exploration_marches table

-- Add publication_status column
ALTER TABLE exploration_marches 
ADD COLUMN publication_status text NOT NULL DEFAULT 'published_public';

-- Add check constraint for valid status values
ALTER TABLE exploration_marches 
ADD CONSTRAINT exploration_marches_publication_status_check 
CHECK (publication_status IN ('published_public', 'published_readers', 'draft'));

-- Create index for efficient filtering by publication status
CREATE INDEX idx_exploration_marches_publication_status 
ON exploration_marches(exploration_id, publication_status);

-- Update existing records to be published_public (maintains current behavior)
UPDATE exploration_marches 
SET publication_status = 'published_public';

-- Create function to get marches by publication mode
CREATE OR REPLACE FUNCTION get_exploration_marches_by_status(
  exploration_id_param uuid,
  include_drafts boolean DEFAULT false,
  readers_mode boolean DEFAULT false
)
RETURNS TABLE(
  id uuid,
  exploration_id uuid,
  marche_id uuid,
  ordre integer,
  publication_status text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT em.id, em.exploration_id, em.marche_id, em.ordre, em.publication_status, em.created_at
  FROM exploration_marches em
  WHERE em.exploration_id = exploration_id_param
    AND (
      -- Always include published_public
      em.publication_status = 'published_public'
      -- Include published_readers if in readers mode or admin
      OR (readers_mode AND em.publication_status = 'published_readers')
      -- Include drafts only if specifically requested (admin mode)
      OR (include_drafts AND em.publication_status = 'draft')
    )
  ORDER BY em.ordre;
$$;