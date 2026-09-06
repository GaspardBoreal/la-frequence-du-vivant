ALTER TABLE public.propriete_tour_actions
  ADD COLUMN IF NOT EXISTS refs jsonb NOT NULL DEFAULT '[]'::jsonb;