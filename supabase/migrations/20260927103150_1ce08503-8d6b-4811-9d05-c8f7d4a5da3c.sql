ALTER TABLE public.propriete_chantiers ADD COLUMN IF NOT EXISTS zone_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.propriete_chantiers ADD COLUMN IF NOT EXISTS radius_m integer;