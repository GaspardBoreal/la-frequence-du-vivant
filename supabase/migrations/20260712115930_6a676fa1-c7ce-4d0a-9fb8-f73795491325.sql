
-- 1) Table cache Carte Sol Vivant
CREATE TABLE IF NOT EXISTS public.carte_sol_vivant_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL UNIQUE,
  name text NOT NULL,
  category text,
  categories text[] DEFAULT '{}',
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  street_address text,
  website text,
  email text,
  description text,
  source_key text,
  status integer,
  raw jsonb,
  external_created_at timestamptz,
  external_updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.carte_sol_vivant_points TO anon;
GRANT SELECT ON public.carte_sol_vivant_points TO authenticated;
GRANT ALL ON public.carte_sol_vivant_points TO service_role;

ALTER TABLE public.carte_sol_vivant_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carte Sol Vivant public read"
  ON public.carte_sol_vivant_points FOR SELECT USING (true);

CREATE POLICY "Carte Sol Vivant service manage"
  ON public.carte_sol_vivant_points FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS carte_sol_vivant_points_category_idx
  ON public.carte_sol_vivant_points (category);
CREATE INDEX IF NOT EXISTS carte_sol_vivant_points_geo_idx
  ON public.carte_sol_vivant_points (latitude, longitude);

CREATE OR REPLACE FUNCTION public.carte_sol_vivant_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS carte_sol_vivant_touch_updated_at ON public.carte_sol_vivant_points;
CREATE TRIGGER carte_sol_vivant_touch_updated_at
  BEFORE UPDATE ON public.carte_sol_vivant_points
  FOR EACH ROW EXECUTE FUNCTION public.carte_sol_vivant_touch_updated_at();

-- 2) RPC get_marches_map_events
CREATE OR REPLACE FUNCTION public.get_marches_map_events()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  date_marche timestamptz,
  event_type text,
  lieu text,
  latitude numeric,
  longitude numeric,
  cover_image_url text,
  max_participants integer,
  is_public boolean,
  public_slug text,
  exploration_id uuid,
  exploration_name text,
  participants_count integer,
  species_count integer,
  has_audio boolean,
  has_marcheur_photos boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    me.id, me.title, me.description, me.date_marche, me.event_type, me.lieu,
    me.latitude, me.longitude, me.cover_image_url, me.max_participants,
    me.is_public, me.public_slug, me.exploration_id,
    e.name AS exploration_name,
    COALESCE((SELECT COUNT(*)::int FROM public.marche_participations mp WHERE mp.marche_event_id = me.id), 0),
    COALESCE((
      SELECT MAX(bs.total_species)::int
      FROM public.exploration_marches em
      JOIN public.biodiversity_snapshots bs ON bs.marche_id = em.marche_id
      WHERE em.exploration_id = me.exploration_id
    ), 0),
    EXISTS (
      SELECT 1
      FROM public.exploration_marches em
      JOIN public.marche_audio ma ON ma.marche_id = em.marche_id
      WHERE em.exploration_id = me.exploration_id LIMIT 1
    ),
    EXISTS (
      SELECT 1
      FROM public.exploration_marches em
      JOIN public.marcheur_medias mm ON mm.marche_id = em.marche_id
      WHERE em.exploration_id = me.exploration_id LIMIT 1
    )
  FROM public.marche_events me
  LEFT JOIN public.explorations e ON e.id = me.exploration_id
  WHERE me.latitude IS NOT NULL AND me.longitude IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_marches_map_events() TO anon, authenticated;

-- 3) Hero stats
CREATE OR REPLACE FUNCTION public.get_carte_mdv_hero_stats()
RETURNS TABLE (
  events_count integer,
  species_count integer,
  marcheurs_count integer,
  partners_count integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.marche_events WHERE latitude IS NOT NULL),
    (SELECT COALESCE(SUM(t.total_species), 0)::int FROM (
      SELECT MAX(bs.total_species) AS total_species
      FROM public.biodiversity_snapshots bs
      GROUP BY bs.marche_id
    ) t),
    (SELECT COUNT(*)::int FROM public.community_profiles),
    (SELECT COUNT(*)::int FROM public.carte_sol_vivant_points);
$$;

GRANT EXECUTE ON FUNCTION public.get_carte_mdv_hero_stats() TO anon, authenticated;
