CREATE OR REPLACE FUNCTION public.get_admin_entity_context(_type text, _id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
  _uuid uuid;
BEGIN
  -- Sécurité : admin uniquement
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF _type IS NULL OR _id IS NULL THEN
    RETURN jsonb_build_object('error', 'missing_params');
  END IF;

  -- ───────── MARCHE EVENT ─────────
  IF _type = 'marche_event' THEN
    BEGIN
      _uuid := _id::uuid;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('error', 'invalid_uuid');
    END;

    SELECT jsonb_build_object(
      'type', 'marche_event',
      'event', to_jsonb(me.*) - 'description',
      'description_excerpt', LEFT(COALESCE(me.description, ''), 500),
      'organisateur', (
        SELECT to_jsonb(o.*) FROM marche_organisateurs o WHERE o.id = me.organisateur_id
      ),
      'exploration_liee', (
        SELECT jsonb_build_object(
          'id', e.id, 'name', e.name, 'slug', e.slug,
          'published', e.published, 'exploration_type', e.exploration_type
        ) FROM explorations e WHERE e.id = me.exploration_id
      ),
      'inscriptions', (
        SELECT jsonb_build_object(
          'total', COUNT(*),
          'validees', COUNT(*) FILTER (WHERE statut = 'validee'),
          'en_attente', COUNT(*) FILTER (WHERE statut = 'en_attente'),
          'annulees', COUNT(*) FILTER (WHERE statut = 'annulee')
        ) FROM marche_event_inscriptions WHERE marche_event_id = me.id
      ),
      'derniers_marcheurs_inscrits', (
        SELECT jsonb_agg(jsonb_build_object(
          'prenom', cp.prenom, 'nom', cp.nom,
          'role', cp.role, 'ville', cp.ville,
          'statut', mei.statut,
          'inscrit_le', mei.created_at
        ) ORDER BY mei.created_at DESC)
        FROM (
          SELECT * FROM marche_event_inscriptions
          WHERE marche_event_id = me.id ORDER BY created_at DESC LIMIT 10
        ) mei
        LEFT JOIN community_profiles cp ON cp.user_id = mei.user_id
      ),
      'biodiversite', (
        SELECT jsonb_build_object(
          'total_especes', COALESCE(SUM(bs.total_species), 0),
          'observations_recentes', COALESCE(SUM(bs.recent_observations), 0),
          'snapshots_count', COUNT(*)
        )
        FROM exploration_marches em
        JOIN biodiversity_snapshots bs ON bs.marche_id::text = em.marche_id::text
        WHERE em.exploration_id = me.exploration_id
      ),
      'medias', (
        SELECT jsonb_build_object(
          'photos', (SELECT COUNT(*) FROM exploration_marches em
                     JOIN marche_photos mp ON mp.marche_id = em.marche_id
                     WHERE em.exploration_id = me.exploration_id),
          'audios', (SELECT COUNT(*) FROM exploration_marches em
                     JOIN marche_audio ma ON ma.marche_id = em.marche_id
                     WHERE em.exploration_id = me.exploration_id)
        )
      )
    ) INTO _result
    FROM marche_events me
    WHERE me.id = _uuid;

    RETURN COALESCE(_result, jsonb_build_object('error', 'not_found'));
  END IF;

  -- ───────── MARCHEUR (community profile par slug) ─────────
  IF _type = 'marcheur' THEN
    SELECT jsonb_build_object(
      'type', 'marcheur',
      'profil', to_jsonb(cp.*) - 'telephone' - 'date_naissance',
      'participations', (
        SELECT jsonb_build_object(
          'total', COUNT(*),
          'validees', COUNT(*) FILTER (WHERE statut = 'validee')
        ) FROM marche_event_inscriptions WHERE user_id = cp.user_id
      ),
      'dernieres_marches', (
        SELECT jsonb_agg(jsonb_build_object(
          'titre', me.titre,
          'date_debut', me.date_debut,
          'statut_inscription', mei.statut
        ) ORDER BY me.date_debut DESC)
        FROM (
          SELECT * FROM marche_event_inscriptions
          WHERE user_id = cp.user_id ORDER BY created_at DESC LIMIT 10
        ) mei
        JOIN marche_events me ON me.id = mei.marche_event_id
      ),
      'filleuls_count', (
        SELECT COALESCE(SUM(account_created_count), 0)
        FROM community_affiliate_links WHERE marcheur_user_id = cp.user_id
      )
    ) INTO _result
    FROM community_profiles cp
    WHERE cp.slug = _id OR cp.id::text = _id OR cp.user_id::text = _id;

    RETURN COALESCE(_result, jsonb_build_object('error', 'not_found'));
  END IF;

  -- ───────── EXPLORATION ─────────
  IF _type = 'exploration' THEN
    SELECT jsonb_build_object(
      'type', 'exploration',
      'exploration', to_jsonb(e.*) - 'description' - 'meta_description',
      'marches_liees_count', (
        SELECT COUNT(*) FROM exploration_marches WHERE exploration_id = e.id
      ),
      'evenements_lies', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', me.id, 'titre', me.titre, 'date_debut', me.date_debut, 'statut', me.statut
        ) ORDER BY me.date_debut DESC)
        FROM marche_events me WHERE me.exploration_id = e.id LIMIT 10
      ),
      'biodiversite', (
        SELECT jsonb_build_object(
          'total_especes', COALESCE(SUM(bs.total_species), 0),
          'snapshots', COUNT(*)
        )
        FROM exploration_marches em
        JOIN biodiversity_snapshots bs ON bs.marche_id::text = em.marche_id::text
        WHERE em.exploration_id = e.id
      )
    ) INTO _result
    FROM explorations e
    WHERE e.id::text = _id OR e.slug = _id;

    RETURN COALESCE(_result, jsonb_build_object('error', 'not_found'));
  END IF;

  RETURN jsonb_build_object('error', 'unknown_type');
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_entity_context(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_entity_context(text, text) TO authenticated;