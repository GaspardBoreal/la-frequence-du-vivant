
CREATE OR REPLACE FUNCTION public.get_public_global_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'especes_tracees', (
      SELECT count(DISTINCT lower(coalesce(sp->>'scientificName', sp->>'scientific_name')))
      FROM biodiversity_snapshots, jsonb_array_elements(species_data) sp
      WHERE coalesce(sp->>'scientificName', sp->>'scientific_name') IS NOT NULL
    ),
    'domaines', (SELECT count(*) FROM marches),
    'marches_organisees', (SELECT count(*) FROM marche_events),
    'marcheurs', (SELECT count(*) FROM community_profiles),
    'observations_citoyennes', (SELECT count(*) FROM marcheur_observations),
    'participations_validees', (
      SELECT count(*) FROM marche_participations WHERE validated_at IS NOT NULL
    ),
    'photos_collectees', (
      (SELECT count(*) FROM marche_photos)
      + (SELECT count(*) FROM marcheur_medias WHERE type_media = 'photo')
    ),
    'computed_at', now()
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_global_stats() TO anon, authenticated, service_role;
