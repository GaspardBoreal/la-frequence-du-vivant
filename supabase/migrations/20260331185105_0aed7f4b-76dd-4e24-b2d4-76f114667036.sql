CREATE OR REPLACE FUNCTION public.generate_community_affiliate_link(
  _exploration_id uuid,
  _channel text,
  _marche_event_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(link_id uuid, share_token text, generated_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_link public.community_affiliate_links%ROWTYPE;
  new_token text;
  lock_key bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _exploration_id IS NULL THEN
    RAISE EXCEPTION 'Exploration required';
  END IF;

  IF _channel NOT IN ('copy', 'share') THEN
    RAISE EXCEPTION 'Invalid affiliate channel';
  END IF;

  lock_key := hashtextextended(
    concat_ws('|', auth.uid()::text, _exploration_id::text, COALESCE(_marche_event_id::text, 'no-event'), _channel),
    0
  );
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT *
  INTO existing_link
  FROM public.community_affiliate_links
  WHERE marcheur_user_id = auth.uid()
    AND exploration_id = _exploration_id
    AND channel = _channel
    AND (
      (_marche_event_id IS NULL AND marche_event_id IS NULL)
      OR marche_event_id = _marche_event_id
    )
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF existing_link.id IS NULL THEN
    LOOP
      new_token := replace(gen_random_uuid()::text, '-', '');
      BEGIN
        INSERT INTO public.community_affiliate_links (
          marcheur_user_id,
          exploration_id,
          marche_event_id,
          channel,
          share_token,
          button_click_count,
          generated_count,
          last_generated_at
        ) VALUES (
          auth.uid(),
          _exploration_id,
          _marche_event_id,
          _channel,
          new_token,
          1,
          1,
          now()
        )
        RETURNING * INTO existing_link;

        EXIT;
      EXCEPTION
        WHEN unique_violation THEN
          IF EXISTS (
            SELECT 1
            FROM public.community_affiliate_links
            WHERE share_token = new_token
          ) THEN
            CONTINUE;
          END IF;

          SELECT *
          INTO existing_link
          FROM public.community_affiliate_links
          WHERE marcheur_user_id = auth.uid()
            AND exploration_id = _exploration_id
            AND channel = _channel
            AND (
              (_marche_event_id IS NULL AND marche_event_id IS NULL)
              OR marche_event_id = _marche_event_id
            )
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE;

          IF existing_link.id IS NULL THEN
            RAISE;
          END IF;

          UPDATE public.community_affiliate_links
          SET
            button_click_count = button_click_count + 1,
            generated_count = generated_count + 1,
            last_generated_at = now()
          WHERE id = existing_link.id
          RETURNING * INTO existing_link;

          EXIT;
      END;
    END LOOP;
  ELSE
    UPDATE public.community_affiliate_links
    SET
      button_click_count = button_click_count + 1,
      generated_count = generated_count + 1,
      last_generated_at = now()
    WHERE id = existing_link.id
    RETURNING * INTO existing_link;
  END IF;

  INSERT INTO public.community_affiliate_events (affiliate_link_id, event_type, metadata)
  VALUES
    (existing_link.id, 'button_click', jsonb_build_object('channel', _channel)),
    (existing_link.id, 'link_generated', jsonb_build_object('channel', _channel));

  RETURN QUERY
  SELECT existing_link.id, existing_link.share_token, existing_link.generated_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_community_affiliate_event(
  _share_token text,
  _event_type text,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _referred_user_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_link public.community_affiliate_links%ROWTYPE;
  event_id uuid;
  inserted_event boolean := false;
  lock_key bigint;
BEGIN
  IF _share_token IS NULL OR btrim(_share_token) = '' THEN
    RAISE EXCEPTION 'Share token required';
  END IF;

  SELECT * INTO target_link
  FROM public.community_affiliate_links
  WHERE share_token = _share_token
  LIMIT 1;

  IF target_link.id IS NULL THEN
    RAISE EXCEPTION 'Affiliate link not found';
  END IF;

  IF _event_type = 'account_created' THEN
    lock_key := hashtextextended(
      concat_ws('|', target_link.id::text, _event_type, COALESCE(_referred_user_id::text, 'no-user')),
      0
    );
    PERFORM pg_advisory_xact_lock(lock_key);

    SELECT id INTO event_id
    FROM public.community_affiliate_events
    WHERE affiliate_link_id = target_link.id
      AND event_type = 'account_created'
      AND referred_user_id = _referred_user_id
    LIMIT 1;

    IF event_id IS NULL THEN
      INSERT INTO public.community_affiliate_events (affiliate_link_id, event_type, metadata, referred_user_id)
      VALUES (target_link.id, _event_type, COALESCE(_metadata, '{}'::jsonb), _referred_user_id)
      RETURNING id INTO event_id;
      inserted_event := true;
    END IF;
  ELSE
    INSERT INTO public.community_affiliate_events (affiliate_link_id, event_type, metadata, referred_user_id)
    VALUES (target_link.id, _event_type, COALESCE(_metadata, '{}'::jsonb), _referred_user_id)
    RETURNING id INTO event_id;
    inserted_event := true;
  END IF;

  IF _event_type = 'landing_view' AND inserted_event THEN
    UPDATE public.community_affiliate_links
    SET landing_view_count = landing_view_count + 1,
        last_viewed_at = now()
    WHERE id = target_link.id;
  ELSIF _event_type = 'signup_started' AND inserted_event THEN
    UPDATE public.community_affiliate_links
    SET signup_started_count = signup_started_count + 1
    WHERE id = target_link.id;
  ELSIF _event_type = 'account_created' AND inserted_event THEN
    UPDATE public.community_affiliate_links
    SET account_created_count = account_created_count + 1
    WHERE id = target_link.id;
  END IF;

  RETURN event_id;
END;
$function$;