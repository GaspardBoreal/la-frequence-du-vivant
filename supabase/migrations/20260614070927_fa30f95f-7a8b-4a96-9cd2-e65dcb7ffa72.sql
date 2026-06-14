ALTER TABLE public.crm_companies
  ADD COLUMN IF NOT EXISTS site_web text,
  ADD COLUMN IF NOT EXISTS primary_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS crm_companies_primary_contact_idx ON public.crm_companies(primary_contact_id);