
CREATE TABLE public.wallpaper_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  theme text NOT NULL,
  scope text NOT NULL,
  event_id uuid,
  category text NOT NULL,
  ambiance text NOT NULL,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  species_names text[] DEFAULT ARRAY[]::text[],
  resolution text NOT NULL,
  preview_url text,
  is_public boolean NOT NULL DEFAULT true,
  download_count int NOT NULL DEFAULT 0,
  share_count int NOT NULL DEFAULT 0,
  event_name_snapshot text,
  event_date_snapshot date,
  event_commune_snapshot text,
  event_gps_snapshot jsonb
);

GRANT SELECT ON public.wallpaper_generations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.wallpaper_generations TO authenticated;
GRANT INSERT ON public.wallpaper_generations TO anon;
GRANT ALL ON public.wallpaper_generations TO service_role;

ALTER TABLE public.wallpaper_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wp_public_read" ON public.wallpaper_generations
  FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "wp_auth_insert" ON public.wallpaper_generations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "wp_anon_insert" ON public.wallpaper_generations
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);

CREATE INDEX wp_gen_created_idx ON public.wallpaper_generations (created_at DESC) WHERE is_public = true;

CREATE OR REPLACE FUNCTION public.increment_wallpaper_download(wp_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.wallpaper_generations SET download_count = download_count + 1 WHERE id = wp_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_wallpaper_share(wp_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.wallpaper_generations SET share_count = share_count + 1 WHERE id = wp_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_wallpaper_download(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wallpaper_share(uuid) TO anon, authenticated;
