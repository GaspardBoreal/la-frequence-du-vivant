ALTER TABLE public.marcheur_medias 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;