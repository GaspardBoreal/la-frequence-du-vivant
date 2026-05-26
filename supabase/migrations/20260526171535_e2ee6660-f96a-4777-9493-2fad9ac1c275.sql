
-- 1) Compter par table sans rien supprimer
CREATE OR REPLACE FUNCTION public.admin_count_user_cascade(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  SELECT count(*) INTO c FROM curation_marcheurs WHERE curated_by_user_id = target_user_id;
  counts := counts || jsonb_build_object('curation_marcheurs_curated_by', c);

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
$$;

-- 2) Purge effective (toutes tables sauf admin_users/team_members/user_roles)
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

  -- a) Observations rattachées aux marcheurs de l'utilisateur
  WITH d AS (
    DELETE FROM marcheur_observations
    WHERE marcheur_id IN (SELECT id FROM exploration_marcheurs WHERE user_id = target_user_id)
    RETURNING 1
  ) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marcheur_observations', c);

  -- b) Tables marcheur_* par user_id
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

  -- c) Fiches marcheur (peuvent rester des observations sans user_id côté FK → déjà purgées en a)
  WITH d AS (DELETE FROM exploration_marcheurs WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('exploration_marcheurs', c);

  -- d) Autres traces user
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

  -- e) Curations : on conserve la curation, on dénoue juste l'auteur
  UPDATE curation_marcheurs SET curated_by_user_id = NULL WHERE curated_by_user_id = target_user_id;
  GET DIAGNOSTICS c = ROW_COUNT;
  deleted := deleted || jsonb_build_object('curation_marcheurs_curated_by_nulled', c);

  -- f) Participations, invitations
  WITH d AS (DELETE FROM marche_participations WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('marche_participations', c);
  WITH d AS (DELETE FROM event_invited_readers WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('event_invited_readers', c);
  WITH d AS (DELETE FROM event_invitations WHERE consumed_by_user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('event_invitations', c);

  -- g) Profil
  WITH d AS (DELETE FROM community_profiles WHERE user_id = target_user_id RETURNING 1) SELECT count(*) INTO c FROM d;
  deleted := deleted || jsonb_build_object('community_profiles', c);

  RETURN deleted;
END;
$$;

-- 3) Lister les fiches marcheur orphelines (user_id ne référence plus un compte auth)
CREATE OR REPLACE FUNCTION public.admin_orphan_exploration_marcheurs()
RETURNS TABLE(
  marcheur_id uuid,
  user_id uuid,
  exploration_id uuid,
  prenom text,
  nom text,
  created_at timestamptz,
  nb_observations bigint,
  nb_medias bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    em.id AS marcheur_id,
    em.user_id,
    em.exploration_id,
    em.prenom,
    em.nom,
    em.created_at,
    (SELECT count(*) FROM marcheur_observations o WHERE o.marcheur_id = em.id) AS nb_observations,
    (SELECT count(*) FROM marcheur_medias m WHERE m.user_id = em.user_id) AS nb_medias
  FROM exploration_marcheurs em
  WHERE em.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = em.user_id)
  ORDER BY em.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_count_user_cascade(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_purge_user_cascade(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_orphan_exploration_marcheurs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_count_user_cascade(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_purge_user_cascade(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_orphan_exploration_marcheurs() TO service_role;
