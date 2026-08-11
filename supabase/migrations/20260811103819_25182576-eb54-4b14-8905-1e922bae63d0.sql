DROP INDEX IF EXISTS public.crm_campaign_members_campaign_company_uniq;
DROP INDEX IF EXISTS public.crm_campaign_members_unique_company;

ALTER TABLE public.crm_campaign_members
  ADD CONSTRAINT crm_campaign_members_campaign_company_key
  UNIQUE (campaign_id, company_id);