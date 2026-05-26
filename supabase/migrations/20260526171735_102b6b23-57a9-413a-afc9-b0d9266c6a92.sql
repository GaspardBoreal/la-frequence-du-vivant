
CREATE OR REPLACE FUNCTION public.admin_purge_user_cascade(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted jsonb := '{}'::jsonb;
  c bigint;
  is_admin boolean;
BEGIN
  IF target_user_id IS NULL THEN RAISE EXCEPTION 'target_user_id required'; END IF;

  SELECT EXISTS(SELECT 1 FROM admin_users WHERE user_id = target_user_id) INTO is_admin;
  IF is_admin THEN RAISE EXCEPTION 'forbidden: target is admin'; END IF;

  WITH d AS (
    DELETE FROM marcheur_observations
    WHERE marcheur_id IN (SELECT id FROM exploration_marcheurs WHERE user_id = target_user_id)
    RETURNING 1
  ) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_observations', c);

  UPDATE marcheur_observations SET curated_by_user_id = NULL WHERE curated_by_user_id = target_user_id;
  GET DIAGNOSTICS c = ROW_COUNT;
  deleted := deleted || jsonb_build_object('marcheur_observations_curated_by_nulled', c);

  WITH d AS (DELETE FROM marcheur_medias WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_medias', c);
  WITH d AS (DELETE FROM marcheur_audio WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_audio', c);
  WITH d AS (DELETE FROM marcheur_textes WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_textes', c);
  WITH d AS (DELETE FROM marcheur_species_tags WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_species_tags', c);
  WITH d AS (DELETE FROM marcheur_activity_logs WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_activity_logs', c);
  WITH d AS (DELETE FROM marcheur_backfill_log WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_backfill_log', c);

  WITH d AS (DELETE FROM exploration_marcheurs WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('exploration_marcheurs', c);

  WITH d AS (DELETE FROM exploration_convivialite_photos WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('exploration_convivialite_photos', c);
  WITH d AS (DELETE FROM event_testimonies WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('event_testimonies', c);
  WITH d AS (DELETE FROM kigo_entries WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('kigo_entries', c);
  WITH d AS (DELETE FROM quiz_responses WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('quiz_responses', c);
  WITH d AS (DELETE FROM frequences_log WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('frequences_log', c);
  WITH d AS (DELETE FROM sound_recordings WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('sound_recordings', c);

  -- Curations marcheur : on dénoue l'auteur via la colonne created_by
  UPDATE curation_marcheurs SET created_by = NULL WHERE created_by = target_user_id;
  GET DIAGNOSTICS c = ROW_COUNT;
  deleted := deleted || jsonb_build_object('curation_marcheurs_created_by_nulled', c);

  WITH d AS (DELETE FROM marche_participations WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marche_participations', c);
  WITH d AS (DELETE FROM event_invited_readers WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('event_invited_readers', c);
  WITH d AS (DELETE FROM event_invitations WHERE consumed_by_user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('event_invitations', c);

  WITH d AS (DELETE FROM community_profiles WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('community_profiles', c);

  RETURN deleted;
END;
$$;

-- Purge immédiate des 3 fantômes Aurélien
SELECT public.admin_purge_user_cascade('3ad53b2b-9897-46ab-8c43-82fd68c42330'::uuid);
SELECT public.admin_purge_user_cascade('ced8277b-899c-4895-b3dd-a7bf325e1fd3'::uuid);
SELECT public.admin_purge_user_cascade('df57cd31-4409-4114-a3d1-273937a7fd8e'::uuid);
