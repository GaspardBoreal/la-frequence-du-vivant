
-- ============ Tables ============
CREATE TABLE public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  univers text NOT NULL DEFAULT 'tous',
  objet text NOT NULL DEFAULT '',
  preheader text,
  from_name text NOT NULL DEFAULT 'La Fréquence du Vivant',
  from_email text,
  reply_to text,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  audience jsonb NOT NULL DEFAULT '{"mode":"univers","profileIds":[]}'::jsonb,
  statut text NOT NULL DEFAULT 'brouillon',
  recipients_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletter_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  profile_id uuid,
  campaign_id uuid REFERENCES public.newsletter_campaigns(id) ON DELETE SET NULL,
  motif text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletter_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  profile_id uuid,
  email text NOT NULL,
  nom text,
  statut text NOT NULL DEFAULT 'queued',
  resend_message_id text,
  token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  unsubscribed_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, email)
);
CREATE UNIQUE INDEX newsletter_recipients_token_idx ON public.newsletter_recipients(token);
CREATE INDEX newsletter_recipients_campaign_idx ON public.newsletter_recipients(campaign_id, statut);
CREATE INDEX newsletter_recipients_message_idx ON public.newsletter_recipients(resend_message_id);

CREATE TABLE public.newsletter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.newsletter_recipients(id) ON DELETE CASCADE,
  type text NOT NULL,
  url text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX newsletter_events_campaign_idx ON public.newsletter_events(campaign_id, type, created_at);

CREATE TABLE public.newsletter_audience_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  univers text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, univers)
);

-- ============ Grants ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_audience_tags TO authenticated;
GRANT SELECT ON public.newsletter_recipients TO authenticated;
GRANT SELECT ON public.newsletter_events TO authenticated;
GRANT SELECT ON public.newsletter_unsubscribes TO authenticated;
GRANT ALL ON public.newsletter_campaigns TO service_role;
GRANT ALL ON public.newsletter_recipients TO service_role;
GRANT ALL ON public.newsletter_events TO service_role;
GRANT ALL ON public.newsletter_unsubscribes TO service_role;
GRANT ALL ON public.newsletter_audience_tags TO service_role;

-- ============ RLS ============
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_audience_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.newsletter_campaigns
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins manage audience tags" ON public.newsletter_audience_tags
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins read recipients" ON public.newsletter_recipients
  FOR SELECT TO authenticated USING (public.check_is_admin_user(auth.uid()));
CREATE POLICY "Admins read events" ON public.newsletter_events
  FOR SELECT TO authenticated USING (public.check_is_admin_user(auth.uid()));
CREATE POLICY "Admins read unsubscribes" ON public.newsletter_unsubscribes
  FOR SELECT TO authenticated USING (public.check_is_admin_user(auth.uid()));

-- ============ updated_at ============
CREATE OR REPLACE FUNCTION public.newsletter_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_newsletter_campaigns_touch BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_touch_updated_at();
CREATE TRIGGER trg_newsletter_recipients_touch BEFORE UPDATE ON public.newsletter_recipients
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_touch_updated_at();

-- ============ Audience ============
CREATE OR REPLACE FUNCTION public.get_newsletter_audience(_univers text DEFAULT 'tous', _profile_ids uuid[] DEFAULT NULL)
RETURNS TABLE(
  profile_id uuid, user_id uuid, email text, prenom text, nom text,
  ville text, role text, univers text[], unsubscribed boolean, last_activity timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT cp.id, cp.user_id, cp.prenom, cp.nom, cp.ville, cp.role::text AS role
    FROM community_profiles cp
    WHERE cp.user_id IS NOT NULL
  ), univ AS (
    SELECT b.id,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN EXISTS (SELECT 1 FROM propriete_marcheurs pm WHERE pm.community_profile_id = b.id) THEN 'jardin' END,
        CASE WHEN EXISTS (SELECT 1 FROM marche_participations mp WHERE mp.user_id = b.user_id) THEN 'marches' END,
        CASE WHEN EXISTS (
          SELECT 1 FROM marche_participations mp
          JOIN marche_events me ON me.id = mp.marche_event_id
          WHERE mp.user_id = b.user_id
            AND (me.title ILIKE '%vign%' OR COALESCE(me.category,'') ILIKE '%vign%' OR COALESCE(me.lieu,'') ILIKE '%vign%')
        ) THEN 'vignoble' END
      ], NULL)
      || COALESCE((SELECT ARRAY_AGG(t.univers) FROM newsletter_audience_tags t WHERE t.profile_id = b.id), ARRAY[]::text[]) AS univers
    FROM base b
  )
  SELECT b.id, b.user_id, LOWER(u.email::text), b.prenom, b.nom, b.ville, b.role,
    ARRAY(SELECT DISTINCT x FROM unnest(un.univers) x) AS univers,
    EXISTS (SELECT 1 FROM newsletter_unsubscribes nu WHERE nu.email = LOWER(u.email::text)) AS unsubscribed,
    (SELECT MAX(l.created_at) FROM marcheur_activity_logs l WHERE l.user_id = b.user_id) AS last_activity
  FROM base b
  JOIN univ un ON un.id = b.id
  JOIN auth.users u ON u.id = b.user_id
  WHERE public.check_is_admin_user(auth.uid())
    AND u.email IS NOT NULL
    AND (_profile_ids IS NULL OR b.id = ANY(_profile_ids))
    AND (_univers IS NULL OR _univers = 'tous' OR _univers = ANY(un.univers))
  ORDER BY b.prenom NULLS LAST, b.nom NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.get_newsletter_audience(text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_newsletter_audience(text, uuid[]) TO authenticated, service_role;

-- ============ KPI ============
CREATE OR REPLACE FUNCTION public.get_newsletter_campaign_kpis(_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs';
  END IF;

  SELECT jsonb_build_object(
    'recipients', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id),
    'sent', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND r.sent_at IS NOT NULL),
    'delivered', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND r.delivered_at IS NOT NULL),
    'opened', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND r.opened_at IS NOT NULL),
    'clicked', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND r.clicked_at IS NOT NULL),
    'bounced', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND r.bounced_at IS NOT NULL),
    'unsubscribed', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND r.unsubscribed_at IS NOT NULL),
    'failed', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND r.statut = 'failed'),
    'links', COALESCE((
      SELECT jsonb_agg(x) FROM (
        SELECT e.url, COUNT(*) AS n
        FROM newsletter_events e
        WHERE e.campaign_id = _campaign_id AND e.type = 'clicked' AND e.url IS NOT NULL
        GROUP BY e.url ORDER BY COUNT(*) DESC LIMIT 10
      ) x), '[]'::jsonb),
    'timeline', COALESCE((
      SELECT jsonb_agg(y ORDER BY y->>'h') FROM (
        SELECT jsonb_build_object(
          'h', to_char(date_trunc('hour', e.created_at), 'YYYY-MM-DD HH24:00'),
          'opened', COUNT(*) FILTER (WHERE e.type = 'opened'),
          'clicked', COUNT(*) FILTER (WHERE e.type = 'clicked')
        ) AS y
        FROM newsletter_events e
        WHERE e.campaign_id = _campaign_id AND e.type IN ('opened','clicked')
        GROUP BY date_trunc('hour', e.created_at)
      ) z), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.get_newsletter_campaign_kpis(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_newsletter_campaign_kpis(uuid) TO authenticated, service_role;
