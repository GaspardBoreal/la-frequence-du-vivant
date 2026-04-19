DROP FUNCTION IF EXISTS public.get_admin_entity_context(text, text);

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
  -- Admin check
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  IF _type = 'marche_event' THEN
    BEGIN _uuid := _id::uuid; EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('error','invalid uuid'); END;

    SELECT jsonb_build_object(
      'event', to_jsonb(me.*),
      'exploration', (
        SELECT jsonb_build_object(
          'id', e.id, 'name', e.name, 'slug', e.slug,
          'exploration_type', e.exploration_type, 'published', e.published,
          'description', e.description
        ) FROM explorations e WHERE e.id = me.exploration_id
      ),
      'exploration_marches_count', (
        SELECT count(*) FROM exploration_marches em WHERE em.exploration_id = me.exploration_id
      ),
      'parties_count', (
        SELECT count(DISTINCT em.partie_id) FROM exploration_marches em
         WHERE em.exploration_id = me.exploration_id AND em.partie_id IS NOT NULL
      ),
      'participants', jsonb_build_object(
        'total', (SELECT count(*) FROM marche_participations mp WHERE mp.marche_event_id = me.id),
        'validated', (SELECT count(*) FROM marche_participations mp WHERE mp.marche_event_id = me.id AND mp.validated_at IS NOT NULL),
        'pending',  (SELECT count(*) FROM marche_participations mp WHERE mp.marche_event_id = me.id AND mp.validated_at IS NULL)
      ),
      'recent_participants', (
        SELECT jsonb_agg(jsonb_build_object(
          'prenom', cp.prenom, 'nom', cp.nom, 'role', cp.role,
          'ville', cp.ville, 'validated_at', mp.validated_at
        ) ORDER BY mp.created_at DESC)
        FROM (
          SELECT * FROM marche_participations WHERE marche_event_id = me.id
          ORDER BY created_at DESC LIMIT 10
        ) mp
        LEFT JOIN community_profiles cp ON cp.user_id = mp.user_id
      ),
      'media_aggregates', (
        SELECT jsonb_build_object(
          'photos', (SELECT count(*) FROM marche_photos mph
                      WHERE mph.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = me.exploration_id)),
          'audios', (SELECT count(*) FROM marche_audio ma
                      WHERE ma.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = me.exploration_id)),
          'textes', (SELECT count(*) FROM marche_textes mt
                      WHERE mt.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = me.exploration_id))
        )
      ),
      'biodiversity', (
        SELECT jsonb_build_object(
          'total_species', COALESCE(SUM(bs.total_species), 0),
          'birds', COALESCE(SUM(bs.birds_count), 0),
          'plants', COALESCE(SUM(bs.plants_count), 0),
          'fungi', COALESCE(SUM(bs.fungi_count), 0),
          'others', COALESCE(SUM(bs.others_count), 0),
          'snapshots_count', count(*)
        ) FROM biodiversity_snapshots bs
        WHERE bs.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = me.exploration_id)
      ),
      'organisateurs', (
        SELECT jsonb_agg(DISTINCT jsonb_build_object('nom', mo.nom, 'ville', mo.ville, 'type_structure', mo.type_structure))
        FROM marches m
        LEFT JOIN marche_organisateurs mo ON mo.id = m.organisateur_id
        WHERE m.id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = me.exploration_id)
          AND mo.id IS NOT NULL
      )
    ) INTO _result
    FROM marche_events me
    WHERE me.id = _uuid;

    RETURN COALESCE(_result, jsonb_build_object('error','event not found'));

  ELSIF _type = 'marcheur' THEN
    -- _id may be a slug or a uuid
    SELECT jsonb_build_object(
      'profile', jsonb_build_object(
        'prenom', cp.prenom, 'nom', cp.nom, 'ville', cp.ville,
        'role', cp.role, 'marches_count', cp.marches_count,
        'formation_validee', cp.formation_validee,
        'certification_validee', cp.certification_validee,
        'kigo_accueil', cp.kigo_accueil,
        'superpouvoir_sensoriel', cp.superpouvoir_sensoriel,
        'niveau_intimite_vivant', cp.niveau_intimite_vivant,
        'slug', cp.slug, 'created_at', cp.created_at
      ),
      'participations_count', (SELECT count(*) FROM marche_participations mp WHERE mp.user_id = cp.user_id),
      'recent_participations', (
        SELECT jsonb_agg(jsonb_build_object(
          'event_title', me.title, 'date_marche', me.date_marche, 'lieu', me.lieu,
          'event_type', me.event_type, 'validated', mp.validated_at IS NOT NULL
        ) ORDER BY me.date_marche DESC)
        FROM (SELECT * FROM marche_participations WHERE user_id = cp.user_id ORDER BY created_at DESC LIMIT 10) mp
        LEFT JOIN marche_events me ON me.id = mp.marche_event_id
      )
    ) INTO _result
    FROM community_profiles cp
    WHERE cp.slug = _id OR cp.id::text = _id OR cp.user_id::text = _id
    LIMIT 1;

    RETURN COALESCE(_result, jsonb_build_object('error','marcheur not found'));

  ELSIF _type = 'exploration' THEN
    BEGIN _uuid := _id::uuid; EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('error','invalid uuid'); END;

    SELECT jsonb_build_object(
      'exploration', to_jsonb(e.*),
      'marches_count', (SELECT count(*) FROM exploration_marches em WHERE em.exploration_id = e.id),
      'parties_count', (SELECT count(DISTINCT partie_id) FROM exploration_marches WHERE exploration_id = e.id AND partie_id IS NOT NULL),
      'linked_events_count', (SELECT count(*) FROM marche_events me WHERE me.exploration_id = e.id),
      'media_aggregates', jsonb_build_object(
        'photos', (SELECT count(*) FROM marche_photos mp WHERE mp.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = e.id)),
        'audios', (SELECT count(*) FROM marche_audio ma WHERE ma.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = e.id)),
        'textes', (SELECT count(*) FROM marche_textes mt WHERE mt.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = e.id))
      ),
      'biodiversity', (
        SELECT jsonb_build_object(
          'total_species', COALESCE(SUM(bs.total_species),0),
          'snapshots_count', count(*)
        ) FROM biodiversity_snapshots bs
        WHERE bs.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = e.id)
      )
    ) INTO _result
    FROM explorations e
    WHERE e.id = _uuid;

    RETURN COALESCE(_result, jsonb_build_object('error','exploration not found'));
  END IF;

  RETURN jsonb_build_object('error','unknown entity type');
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_entity_context(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_entity_context(text, text) TO authenticated;