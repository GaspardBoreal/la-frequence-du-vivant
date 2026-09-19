CREATE OR REPLACE FUNCTION public.get_newsletter_campaign_kpis(_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE result jsonb;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs';
  END IF;

  SELECT jsonb_build_object(
    'recipients', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test),
    'sent', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test AND r.sent_at IS NOT NULL),
    'delivered', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test AND r.delivered_at IS NOT NULL),
    'opened', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test AND r.opened_at IS NOT NULL),
    'clicked', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test AND r.clicked_at IS NOT NULL),
    'bounced', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test AND r.bounced_at IS NOT NULL),
    'unsubscribed', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test AND r.unsubscribed_at IS NOT NULL),
    'failed', (SELECT COUNT(*) FROM newsletter_recipients r WHERE r.campaign_id = _campaign_id AND NOT r.is_test AND r.statut = 'failed'),
    'links', COALESCE((
      SELECT jsonb_agg(x) FROM (
        SELECT e.url, COUNT(*) AS n
        FROM newsletter_events e
        JOIN newsletter_recipients r ON r.id = e.recipient_id
        WHERE e.campaign_id = _campaign_id AND NOT r.is_test AND e.type = 'clicked' AND e.url IS NOT NULL
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
        JOIN newsletter_recipients r ON r.id = e.recipient_id
        WHERE e.campaign_id = _campaign_id AND NOT r.is_test AND e.type IN ('opened','clicked')
        GROUP BY date_trunc('hour', e.created_at)
      ) z), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END; $function$;