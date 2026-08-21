CREATE OR REPLACE FUNCTION public.get_public_global_stats()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'sols_documentes', (SELECT count(*) FROM propriete_soil_diagnostics),
    'prelevements_analyses', (SELECT count(*) FROM propriete_test_medias),
    'mesures_capteurs', (SELECT count(*) FROM iot_mesures),
    'sondes_actives', (SELECT count(*) FROM iot_capteurs WHERE coalesce(etat, 'service') = 'service'),
    'premiere_mesure_capteur', (SELECT min(mesure_at) FROM iot_mesures),
    'computed_at', now()
  );
$function$;