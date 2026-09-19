-- Marque les envois de test pour les exclure des statistiques d'audience réelle
ALTER TABLE public.newsletter_recipients
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS newsletter_recipients_campaign_test_idx
  ON public.newsletter_recipients (campaign_id, email) WHERE is_test;