CREATE TABLE public.event_signup_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  label text,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  email_subject text,
  email_html text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_signup_links TO authenticated;
GRANT ALL ON public.event_signup_links TO service_role;

ALTER TABLE public.event_signup_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage event signup links"
ON public.event_signup_links FOR ALL TO authenticated
USING (public.check_is_admin_user(auth.uid()))
WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE TRIGGER event_signup_links_updated_at
BEFORE UPDATE ON public.event_signup_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_signup_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.event_signup_links(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (link_id, user_id, kind)
);

GRANT SELECT ON public.event_signup_emails TO authenticated;
GRANT ALL ON public.event_signup_emails TO service_role;

ALTER TABLE public.event_signup_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read event signup emails"
ON public.event_signup_emails FOR SELECT TO authenticated
USING (public.check_is_admin_user(auth.uid()));

CREATE OR REPLACE FUNCTION public.peek_event_signup_link(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  e record;
BEGIN
  SELECT * INTO l FROM public.event_signup_links WHERE code = _code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_code');
  END IF;
  IF NOT l.is_active THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'inactive');
  END IF;
  IF l.expires_at IS NOT NULL AND l.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  SELECT title, date_marche, lieu INTO e FROM public.marche_events WHERE id = l.event_id;
  RETURN jsonb_build_object(
    'valid', true,
    'event_id', l.event_id,
    'title', e.title,
    'date_marche', e.date_marche,
    'lieu', e.lieu
  );
END;
$$;

REVOKE ALL ON FUNCTION public.peek_event_signup_link(text) FROM public;
GRANT EXECUTE ON FUNCTION public.peek_event_signup_link(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_event_signup_link(_code text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  uid uuid := auth.uid();
  existed boolean := false;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO l FROM public.event_signup_links WHERE code = _code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;
  IF NOT l.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'inactive');
  END IF;
  IF l.expires_at IS NOT NULL AND l.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.marche_participations
    WHERE user_id = uid AND marche_event_id = l.event_id
  ) INTO existed;

  IF NOT existed THEN
    INSERT INTO public.marche_participations (user_id, marche_event_id, validation_method)
    VALUES (uid, l.event_id, 'qr_signup');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', l.event_id,
    'link_id', l.id,
    'already_registered', existed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_event_signup_link(text) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_event_signup_link(text) TO authenticated, service_role;