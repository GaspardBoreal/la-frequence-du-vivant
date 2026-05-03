-- 1) Add optional user_id link to exploration_marcheurs
ALTER TABLE public.exploration_marcheurs
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_exploration_marcheurs_user
  ON public.exploration_marcheurs(exploration_id, user_id)
  WHERE user_id IS NOT NULL;

-- 2) Updated reattribute_media: accept either an exploration_marcheurs.id
--    OR a community_profiles.user_id (auto-creates a shadow editorial row).
CREATE OR REPLACE FUNCTION public.reattribute_media(
  _source text,
  _media_id uuid,
  _marcheur_id uuid,
  _user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _exploration_id uuid;
  _previous uuid;
  _marcheur_exploration uuid;
  _resolved_marcheur uuid := _marcheur_id;
  _has_participation boolean;
  _profile RECORD;
  _next_ordre int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF _source NOT IN ('media','audio','conv') THEN
    RAISE EXCEPTION 'Invalid source: %', _source USING ERRCODE = '22023';
  END IF;

  -- Resolve current state and parent exploration
  IF _source = 'media' THEN
    SELECT mm.attributed_marcheur_id, e.id
      INTO _previous, _exploration_id
    FROM public.marcheur_medias mm
    JOIN public.marche_events me ON me.id = mm.marche_event_id
    JOIN public.explorations e ON e.id = me.exploration_id
    WHERE mm.id = _media_id;
  ELSIF _source = 'audio' THEN
    SELECT ma.attributed_marcheur_id, e.id
      INTO _previous, _exploration_id
    FROM public.marcheur_audio ma
    JOIN public.marche_events me ON me.id = ma.marche_event_id
    JOIN public.explorations e ON e.id = me.exploration_id
    WHERE ma.id = _media_id;
  ELSE
    SELECT cp.attributed_marcheur_id, cp.exploration_id
      INTO _previous, _exploration_id
    FROM public.exploration_convivialite_photos cp
    WHERE cp.id = _media_id;
  END IF;

  IF _exploration_id IS NULL THEN
    RAISE EXCEPTION 'Media not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_exploration_curator(_uid) THEN
    RAISE EXCEPTION 'Not authorized to reattribute media' USING ERRCODE = '42501';
  END IF;

  -- Resolve target. Three modes:
  --   a) _marcheur_id NULL and _user_id NULL  -> clear attribution
  --   b) _marcheur_id provided                -> must belong to this exploration
  --   c) _user_id provided                    -> participant of one of the marches; reuse or create a shadow editorial row
  IF _marcheur_id IS NULL AND _user_id IS NOT NULL THEN
    -- Verify the user has a validated participation on this exploration
    SELECT EXISTS(
      SELECT 1
      FROM public.marche_participations mp
      JOIN public.marche_events me ON me.id = mp.marche_event_id
      WHERE me.exploration_id = _exploration_id
        AND mp.user_id = _user_id
        AND mp.validated_at IS NOT NULL
    ) INTO _has_participation;

    IF NOT _has_participation THEN
      RAISE EXCEPTION 'User is not a validated participant of this exploration' USING ERRCODE = '42501';
    END IF;

    -- Reuse an existing editorial row linked to this user, if any
    SELECT em.id INTO _resolved_marcheur
    FROM public.exploration_marcheurs em
    WHERE em.exploration_id = _exploration_id
      AND em.user_id = _user_id
    LIMIT 1;

    IF _resolved_marcheur IS NULL THEN
      SELECT cp.prenom, cp.nom, cp.avatar_url
        INTO _profile
      FROM public.community_profiles cp
      WHERE cp.user_id = _user_id;

      IF _profile.prenom IS NULL THEN
        RAISE EXCEPTION 'Community profile missing for user %', _user_id USING ERRCODE = 'P0002';
      END IF;

      SELECT COALESCE(MAX(ordre), 0) + 1
        INTO _next_ordre
      FROM public.exploration_marcheurs
      WHERE exploration_id = _exploration_id;

      INSERT INTO public.exploration_marcheurs
        (exploration_id, user_id, prenom, nom, role, avatar_url, is_principal, ordre)
      VALUES
        (_exploration_id, _user_id, _profile.prenom, _profile.nom,
         'marcheur', _profile.avatar_url, false, _next_ordre)
      RETURNING id INTO _resolved_marcheur;
    END IF;
  ELSIF _marcheur_id IS NOT NULL THEN
    SELECT em.exploration_id INTO _marcheur_exploration
    FROM public.exploration_marcheurs em
    WHERE em.id = _marcheur_id;

    IF _marcheur_exploration IS NULL THEN
      RAISE EXCEPTION 'Marcheur not found' USING ERRCODE = 'P0002';
    END IF;
    IF _marcheur_exploration <> _exploration_id THEN
      RAISE EXCEPTION 'Marcheur does not belong to this exploration' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Apply update
  IF _source = 'media' THEN
    UPDATE public.marcheur_medias
       SET attributed_marcheur_id = _resolved_marcheur, updated_at = now()
     WHERE id = _media_id;
  ELSIF _source = 'audio' THEN
    UPDATE public.marcheur_audio
       SET attributed_marcheur_id = _resolved_marcheur, updated_at = now()
     WHERE id = _media_id;
  ELSE
    UPDATE public.exploration_convivialite_photos
       SET attributed_marcheur_id = _resolved_marcheur, updated_at = now()
     WHERE id = _media_id;
  END IF;

  INSERT INTO public.media_attribution_log
    (source, media_id, exploration_id, previous_marcheur_id, new_marcheur_id, performed_by)
  VALUES
    (_source, _media_id, _exploration_id, _previous, _resolved_marcheur, _uid);

  RETURN jsonb_build_object(
    'source', _source,
    'media_id', _media_id,
    'exploration_id', _exploration_id,
    'previous_marcheur_id', _previous,
    'new_marcheur_id', _resolved_marcheur
  );
END;
$function$;