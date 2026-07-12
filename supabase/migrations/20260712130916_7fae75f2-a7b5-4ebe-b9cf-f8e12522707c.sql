DROP FUNCTION IF EXISTS public.get_carte_mdv_hero_stats();

CREATE OR REPLACE FUNCTION public.get_carte_mdv_hero_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _events_count int := 0;
  _marches_count int := 0;
  _total_km numeric := 0;
  _marcheurs_count int := 0;
  _participations_count int := 0;
  _species_count int := 0;
BEGIN
  SELECT COUNT(*)::int INTO _events_count
  FROM marche_events WHERE latitude IS NOT NULL;

  WITH expl_ids AS (
    SELECT DISTINCT exploration_id FROM marche_events WHERE exploration_id IS NOT NULL
  ),
  ordered_marches AS (
    SELECT
      em.exploration_id, m.id AS marche_id,
      m.latitude, m.longitude, m.distance_km AS manual_km,
      LAG(m.latitude)  OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS prev_lat,
      LAG(m.longitude) OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS prev_lng,
      ROW_NUMBER() OVER (PARTITION BY em.exploration_id ORDER BY em.ordre NULLS LAST, em.created_at) AS rn
    FROM exploration_marches em
    JOIN marches m ON m.id = em.marche_id
    WHERE em.exploration_id IN (SELECT exploration_id FROM expl_ids)
  ),
  segments AS (
    SELECT COALESCE(manual_km, public.haversine_km(prev_lat, prev_lng, latitude, longitude)) AS segment_km
    FROM ordered_marches WHERE rn > 1
  )
  SELECT
    (SELECT COUNT(DISTINCT em.marche_id) FROM exploration_marches em
       WHERE em.exploration_id IN (SELECT exploration_id FROM expl_ids)),
    (SELECT COALESCE(SUM(segment_km),0) FROM segments)
  INTO _marches_count, _total_km;

  SELECT COUNT(*)::int INTO _marcheurs_count FROM community_profiles;

  SELECT COUNT(*)::int INTO _participations_count
  FROM marche_participations WHERE validated_at IS NOT NULL;

  SELECT COALESCE(SUM(species_count),0)::int INTO _species_count
  FROM public.get_marches_map_events();

  RETURN jsonb_build_object(
    'events_count', _events_count,
    'marches_count', _marches_count,
    'total_km', _total_km,
    'marcheurs_count', _marcheurs_count,
    'participations_count', _participations_count,
    'species_count', _species_count,
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_carte_mdv_hero_stats() TO anon, authenticated;