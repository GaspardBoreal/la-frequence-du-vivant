ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS presentation text NOT NULL DEFAULT 'journal',
  ADD COLUMN IF NOT EXISTS tracking_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.newsletter_campaigns
  DROP CONSTRAINT IF EXISTS newsletter_campaigns_presentation_check;
ALTER TABLE public.newsletter_campaigns
  ADD CONSTRAINT newsletter_campaigns_presentation_check CHECK (presentation IN ('journal','lettre'));