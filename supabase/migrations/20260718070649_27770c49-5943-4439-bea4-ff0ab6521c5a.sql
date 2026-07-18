ALTER TABLE public.wallpaper_generations
  ADD COLUMN IF NOT EXISTS kingdom text,
  ADD COLUMN IF NOT EXISTS cta_enabled boolean NOT NULL DEFAULT false;