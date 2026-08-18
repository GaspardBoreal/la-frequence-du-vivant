CREATE OR REPLACE FUNCTION public.admin_count_user_cascade(target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  counts jsonb := '{}'::jsonb;
  c bigint;
BEGIN
  IF target_user_id IS NULL THEN RAISE EXCEPTION 'target_user_id required'; END IF;

  SELECT count(*) INTO c FROM marcheur_observations
    WHERE marcheur_id IN (SELECT id FROM exploration_marcheurs WHERE user_id = target_user_id);
  counts := counts || jsonb_build_object('marcheur_observations', c);

  SELECT count(*) INTO c FROM marcheur_medias WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('marcheur_medias', c);
  SELECT count(*) INTO c FROM marcheur_audio WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('marcheur_audio', c);
  SELECT count(*) INTO c FROM marcheur_textes WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('marcheur_textes', c);
  SELECT count(*) INTO c FROM marcheur_species_tags WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('marcheur_species_tags', c);
  SELECT count(*) INTO c FROM marcheur_activity_logs WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('marcheur_activity_logs', c);
  SELECT count(*) INTO c FROM marcheur_backfill_log WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('marcheur_backfill_log', c);

  SELECT count(*) INTO c FROM exploration_marcheurs WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('exploration_marcheurs', c);
  SELECT count(*) INTO c FROM exploration_convivialite_photos WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('exploration_convivialite_photos', c);
  SELECT count(*) INTO c FROM event_testimonies WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('event_testimonies', c);
  SELECT count(*) INTO c FROM kigo_entries WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('kigo_entries', c);
  SELECT count(*) INTO c FROM quiz_responses WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('quiz_responses', c);
  SELECT count(*) INTO c FROM frequences_log WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('frequences_log', c);
  SELECT count(*) INTO c FROM sound_recordings WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('sound_recordings', c);

  SELECT count(*) INTO c FROM marcheur_observations WHERE curated_by_user_id = target_user_id;
  counts := counts || jsonb_build_object('marcheur_observations_curated_by', c);

  SELECT count(*) INTO c FROM curation_marcheurs WHERE created_by = target_user_id;
  counts := counts || jsonb_build_object('curation_marcheurs_created_by', c);

  SELECT count(*) INTO c FROM marche_participations WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('marche_participations', c);
  SELECT count(*) INTO c FROM event_invited_readers WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('event_invited_readers', c);
  SELECT count(*) INTO c FROM event_invitations WHERE consumed_by_user_id = target_user_id;
  counts := counts || jsonb_build_object('event_invitations', c);
  SELECT count(*) INTO c FROM community_profiles WHERE user_id = target_user_id;
  counts := counts || jsonb_build_object('community_profiles', c);

  RETURN counts;
END;
$function$;