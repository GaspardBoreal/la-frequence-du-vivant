ALTER TABLE public.crm_campaigns
  ADD COLUMN IF NOT EXISTS canal text NOT NULL DEFAULT 'telephone';

ALTER TABLE public.crm_campaigns
  DROP CONSTRAINT IF EXISTS crm_campaigns_canal_check;
ALTER TABLE public.crm_campaigns
  ADD CONSTRAINT crm_campaigns_canal_check CHECK (canal IN ('telephone','email','mixte'));

ALTER TABLE public.crm_campaign_members
  ADD COLUMN IF NOT EXISTS email_status text NOT NULL DEFAULT 'non_contacte',
  ADD COLUMN IF NOT EXISTS emails_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_email_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_canal text;

ALTER TABLE public.crm_campaign_members
  DROP CONSTRAINT IF EXISTS crm_campaign_members_email_status_check;
ALTER TABLE public.crm_campaign_members
  ADD CONSTRAINT crm_campaign_members_email_status_check
  CHECK (email_status IN ('non_contacte','envoye','ouvert','repondu','desabonne','bounce'));

ALTER TABLE public.crm_campaign_members
  DROP CONSTRAINT IF EXISTS crm_campaign_members_next_action_canal_check;
ALTER TABLE public.crm_campaign_members
  ADD CONSTRAINT crm_campaign_members_next_action_canal_check
  CHECK (next_action_canal IS NULL OR next_action_canal IN ('telephone','email'));

ALTER TABLE public.crm_email_logs
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.crm_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS crm_email_logs_campaign_id_idx ON public.crm_email_logs (campaign_id);
CREATE INDEX IF NOT EXISTS crm_campaign_members_next_action_idx ON public.crm_campaign_members (campaign_id, next_action_at);