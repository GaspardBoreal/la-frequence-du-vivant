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
  WITH expl AS (
    SELECT DISTINCT exploration_id
    FROM public.marche_events
    WHERE exploration_id IS NOT NULL
  ),
  expl_counts AS (
    SELECT
      exploration_id,
      COALESCE((public.get_exploration_species_count(exploration_id) ->> 'total')::int, 0) AS species_count
    FROM expl
  )
  SELECT
    me.id, me.title, me.description, me.date_marche, me.event_type, me.lieu,
    me.latitude, me.longitude, me.cover_image_url, me.max_participants,
    me.is_public, me.public_slug, me.exploration_id,
    e.name AS exploration_name,
    COALESCE((SELECT COUNT(*)::int FROM public.marche_participations mp WHERE mp.marche_event_id = me.id), 0),
    COALESCE(ec.species_count, 0),
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
  LEFT JOIN expl_counts ec ON ec.exploration_id = me.exploration_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_marches_map_events() TO anon, authenticated;