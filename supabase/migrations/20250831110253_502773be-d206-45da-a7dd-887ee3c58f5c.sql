-- Add unique constraint to prevent duplicates in marche_contextes_hybrids
ALTER TABLE public.marche_contextes_hybrids 
ADD CONSTRAINT unique_marche_opus_context UNIQUE (marche_id, opus_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_marche_contextes_marche_opus 
ON public.marche_contextes_hybrids (marche_id, opus_id);

-- Add index for opus queries
CREATE INDEX IF NOT EXISTS idx_marche_contextes_opus_id 
ON public.marche_contextes_hybrids (opus_id) 
WHERE opus_id IS NOT NULL;