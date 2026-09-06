ALTER TABLE public.propriete_tour_actions ADD COLUMN IF NOT EXISTS retenue boolean NOT NULL DEFAULT false;
ALTER TABLE public.propriete_tours ADD COLUMN IF NOT EXISTS carnet_edite_at timestamptz;