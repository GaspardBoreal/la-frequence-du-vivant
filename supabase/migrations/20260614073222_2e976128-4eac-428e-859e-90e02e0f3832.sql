ALTER TABLE public.crm_opportunities ADD COLUMN IF NOT EXISTS titre text;
ALTER TABLE public.crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_titre_length;
ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_titre_length CHECK (titre IS NULL OR char_length(titre) <= 250);