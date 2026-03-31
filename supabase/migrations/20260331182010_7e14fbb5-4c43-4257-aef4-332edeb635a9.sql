CREATE TABLE public.community_affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marcheur_user_id UUID NOT NULL,
  exploration_id UUID NOT NULL REFERENCES public.explorations(id) ON DELETE CASCADE,
  marche_event_id UUID NULL REFERENCES public.marche_events(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  button_click_count INTEGER NOT NULL DEFAULT 0,
  generated_count INTEGER NOT NULL DEFAULT 0,
  landing_view_count INTEGER NOT NULL DEFAULT 0,
  signup_started_count INTEGER NOT NULL DEFAULT 0,
  account_created_count INTEGER NOT NULL DEFAULT 0,
  last_generated_at TIMESTAMP WITH TIME ZONE NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_affiliate_links_marcheur_user_id
  ON public.community_affiliate_links (marcheur_user_id);
CREATE INDEX idx_community_affiliate_links_exploration_id
  ON public.community_affiliate_links (exploration_id);
CREATE INDEX idx_community_affiliate_links_marche_event_id
  ON public.community_affiliate_links (marche_event_id);
CREATE UNIQUE INDEX idx_community_affiliate_links_unique_no_event
  ON public.community_affiliate_links (marcheur_user_id, exploration_id, channel)
  WHERE marche_event_id IS NULL;
CREATE UNIQUE INDEX idx_community_affiliate_links_unique_with_event
  ON public.community_affiliate_links (marcheur_user_id, exploration_id, marche_event_id, channel)
  WHERE marche_event_id IS NOT NULL;

CREATE TABLE public.community_affiliate_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_link_id UUID NOT NULL REFERENCES public.community_affiliate_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  referred_user_id UUID NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_affiliate_events_link_id
  ON public.community_affiliate_events (affiliate_link_id);
CREATE INDEX idx_community_affiliate_events_type
  ON public.community_affiliate_events (event_type);
CREATE INDEX idx_community_affiliate_events_referred_user_id
  ON public.community_affiliate_events (referred_user_id);
CREATE UNIQUE INDEX idx_community_affiliate_events_unique_account_created
  ON public.community_affiliate_events (affiliate_link_id, referred_user_id, event_type)
  WHERE event_type = 'account_created' AND referred_user_id IS NOT NULL;

ALTER TABLE public.community_affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_affiliate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate links"
ON public.community_affiliate_links
FOR SELECT
USING (auth.uid() = marcheur_user_id);

CREATE POLICY "Admins can view all affiliate links"
ON public.community_affiliate_links
FOR SELECT
USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Users can view events for their affiliate links"
ON public.community_affiliate_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.community_affiliate_links l
    WHERE l.id = affiliate_link_id
      AND l.marcheur_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all affiliate events"
ON public.community_affiliate_events
FOR SELECT
USING (public.check_is_admin_user(auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_community_affiliate_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.channel NOT IN ('copy', 'share') THEN
    RAISE EXCEPTION 'Invalid affiliate channel';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_community_affiliate_link_trigger
BEFORE INSERT OR UPDATE ON public.community_affiliate_links
FOR EACH ROW
EXECUTE FUNCTION public.validate_community_affiliate_link();

CREATE OR REPLACE FUNCTION public.validate_community_affiliate_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN ('button_click', 'link_generated', 'landing_view', 'signup_started', 'account_created') THEN
    RAISE EXCEPTION 'Invalid affiliate event type';
  END IF;

  IF NEW.event_type = 'account_created' AND NEW.referred_user_id IS NULL THEN
    RAISE EXCEPTION 'account_created requires referred_user_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_community_affiliate_event_trigger
BEFORE INSERT OR UPDATE ON public.community_affiliate_events
FOR EACH ROW
EXECUTE FUNCTION public.validate_community_affiliate_event();

CREATE TRIGGER update_community_affiliate_links_updated_at
BEFORE UPDATE ON public.community_affiliate_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_community_affiliate_link(
  _exploration_id UUID,
  _channel TEXT,
  _marche_event_id UUID DEFAULT NULL
)
RETURNS TABLE(link_id UUID, share_token TEXT, generated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_link public.community_affiliate_links%ROWTYPE;
  new_token TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _channel NOT IN ('copy', 'share') THEN
    RAISE EXCEPTION 'Invalid affiliate channel';
  END IF;

  IF _marche_event_id IS NULL THEN
    SELECT * INTO existing_link
    FROM public.community_affiliate_links
    WHERE marcheur_user_id = auth.uid()
      AND exploration_id = _exploration_id
      AND marche_event_id IS NULL
      AND channel = _channel
    LIMIT 1;
  ELSE
    SELECT * INTO existing_link
    FROM public.community_affiliate_links
    WHERE marcheur_user_id = auth.uid()
      AND exploration_id = _exploration_id
      AND marche_event_id = _marche_event_id
      AND channel = _channel
    LIMIT 1;
  END IF;

  IF existing_link.id IS NULL THEN
    new_token := replace(gen_random_uuid()::text, '-', '');

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
$$;

CREATE OR REPLACE FUNCTION public.record_community_affiliate_event(
  _share_token TEXT,
  _event_type TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb,
  _referred_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_link public.community_affiliate_links%ROWTYPE;
  event_id UUID;
BEGIN
  SELECT * INTO target_link
  FROM public.community_affiliate_links
  WHERE share_token = _share_token
  LIMIT 1;

  IF target_link.id IS NULL THEN
    RAISE EXCEPTION 'Affiliate link not found';
  END IF;

  INSERT INTO public.community_affiliate_events (affiliate_link_id, event_type, metadata, referred_user_id)
  VALUES (target_link.id, _event_type, COALESCE(_metadata, '{}'::jsonb), _referred_user_id)
  ON CONFLICT ON CONSTRAINT idx_community_affiliate_events_unique_account_created DO NOTHING
  RETURNING id INTO event_id;

  IF _event_type = 'landing_view' THEN
    UPDATE public.community_affiliate_links
    SET landing_view_count = landing_view_count + 1,
        last_viewed_at = now()
    WHERE id = target_link.id;
  ELSIF _event_type = 'signup_started' THEN
    UPDATE public.community_affiliate_links
    SET signup_started_count = signup_started_count + 1
    WHERE id = target_link.id;
  ELSIF _event_type = 'account_created' AND event_id IS NOT NULL THEN
    UPDATE public.community_affiliate_links
    SET account_created_count = account_created_count + 1
    WHERE id = target_link.id;
  END IF;

  RETURN event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_affiliate_landing(_share_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_link RECORD;
  marche_ids UUID[];
  result JSONB;
BEGIN
  SELECT
    l.id,
    l.share_token,
    l.channel,
    l.exploration_id,
    l.marche_event_id,
    e.name AS exploration_name,
    e.description AS exploration_description,
    e.slug AS exploration_slug,
    e.cover_image_url,
    me.title AS marche_event_title,
    me.date_marche,
    me.lieu,
    cp.prenom AS inviter_prenom,
    cp.nom AS inviter_nom,
    cp.role AS inviter_role
  INTO target_link
  FROM public.community_affiliate_links l
  JOIN public.explorations e ON e.id = l.exploration_id
  LEFT JOIN public.marche_events me ON me.id = l.marche_event_id
  LEFT JOIN public.community_profiles cp ON cp.user_id = l.marcheur_user_id
  WHERE l.share_token = _share_token
  LIMIT 1;

  IF target_link.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT array_agg(em.marche_id ORDER BY em.ordre)
  INTO marche_ids
  FROM public.exploration_marches em
  WHERE em.exploration_id = target_link.exploration_id;

  result := jsonb_build_object(
    'share_token', target_link.share_token,
    'channel', target_link.channel,
    'exploration', jsonb_build_object(
      'id', target_link.exploration_id,
      'name', target_link.exploration_name,
      'description', target_link.exploration_description,
      'slug', target_link.exploration_slug,
      'cover_image_url', target_link.cover_image_url
    ),
    'inviter', jsonb_build_object(
      'prenom', COALESCE(target_link.inviter_prenom, 'Un marcheur'),
      'nom', COALESCE(target_link.inviter_nom, ''),
      'role', COALESCE(target_link.inviter_role, 'marcheur')
    ),
    'marche_event', CASE
      WHEN target_link.marche_event_id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', target_link.marche_event_id,
        'title', target_link.marche_event_title,
        'date_marche', target_link.date_marche,
        'lieu', target_link.lieu
      )
    END,
    'stats', jsonb_build_object(
      'media_count', COALESCE((
        SELECT COUNT(*)
        FROM public.marcheur_medias mm
        WHERE mm.is_public = true
          AND mm.marche_id = ANY(COALESCE(marche_ids, ARRAY[]::uuid[]))
      ), 0),
      'audio_count', COALESCE((
        SELECT COUNT(*)
        FROM public.marcheur_audio ma
        WHERE ma.is_public = true
          AND ma.marche_id = ANY(COALESCE(marche_ids, ARRAY[]::uuid[]))
      ), 0),
      'text_count', COALESCE((
        SELECT COUNT(*)
        FROM public.marcheur_textes mt
        WHERE mt.is_public = true
          AND mt.marche_id = ANY(COALESCE(marche_ids, ARRAY[]::uuid[]))
      ), 0),
      'species_count', COALESCE((
        SELECT SUM(bs.total_species)
        FROM public.biodiversity_snapshots bs
        WHERE bs.marche_id = ANY(COALESCE(marche_ids, ARRAY[]::uuid[]))
      ), 0)
    ),
    'hero_media', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', mm.id,
        'title', mm.titre,
        'type', mm.type_media,
        'url', COALESCE(mm.url_fichier, mm.external_url)
      ) ORDER BY mm.created_at DESC)
      FROM (
        SELECT id, titre, type_media, url_fichier, external_url, created_at
        FROM public.marcheur_medias
        WHERE is_public = true
          AND marche_id = ANY(COALESCE(marche_ids, ARRAY[]::uuid[]))
        ORDER BY created_at DESC
        LIMIT 8
      ) mm
    ), '[]'::jsonb),
    'audio_highlights', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ma.id,
        'title', ma.titre,
        'url', ma.url_fichier,
        'duration', ma.duree_secondes
      ) ORDER BY ma.created_at DESC)
      FROM (
        SELECT id, titre, url_fichier, duree_secondes, created_at
        FROM public.marcheur_audio
        WHERE is_public = true
          AND marche_id = ANY(COALESCE(marche_ids, ARRAY[]::uuid[]))
        ORDER BY created_at DESC
        LIMIT 6
      ) ma
    ), '[]'::jsonb),
    'text_highlights', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', mt.id,
        'title', mt.titre,
        'content', mt.contenu
      ) ORDER BY mt.created_at DESC)
      FROM (
        SELECT id, titre, contenu, created_at
        FROM public.marcheur_textes
        WHERE is_public = true
          AND marche_id = ANY(COALESCE(marche_ids, ARRAY[]::uuid[]))
        ORDER BY created_at DESC
        LIMIT 4
      ) mt
    ), '[]'::jsonb)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_affiliate_admin_stats()
RETURNS TABLE(
  link_id UUID,
  marcheur_user_id UUID,
  marcheur_prenom TEXT,
  marcheur_nom TEXT,
  exploration_id UUID,
  exploration_name TEXT,
  marche_event_id UUID,
  marche_event_title TEXT,
  channel TEXT,
  share_token TEXT,
  button_click_count INTEGER,
  generated_count INTEGER,
  landing_view_count INTEGER,
  signup_started_count INTEGER,
  account_created_count INTEGER,
  conversion_rate NUMERIC,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.marcheur_user_id,
    cp.prenom,
    cp.nom,
    l.exploration_id,
    e.name,
    l.marche_event_id,
    me.title,
    l.channel,
    l.share_token,
    l.button_click_count,
    l.generated_count,
    l.landing_view_count,
    l.signup_started_count,
    l.account_created_count,
    CASE
      WHEN l.landing_view_count > 0 THEN round((l.account_created_count::numeric / l.landing_view_count::numeric) * 100, 1)
      ELSE 0
    END,
    l.last_generated_at,
    l.created_at
  FROM public.community_affiliate_links l
  LEFT JOIN public.community_profiles cp ON cp.user_id = l.marcheur_user_id
  LEFT JOIN public.explorations e ON e.id = l.exploration_id
  LEFT JOIN public.marche_events me ON me.id = l.marche_event_id
  WHERE public.check_is_admin_user(auth.uid())
  ORDER BY l.account_created_count DESC, l.landing_view_count DESC, l.generated_count DESC;
$$;