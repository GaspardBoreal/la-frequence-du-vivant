CREATE TABLE public.crm_company_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'participant',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(company_id, event_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_company_events TO authenticated;
GRANT ALL ON public.crm_company_events TO service_role;

ALTER TABLE public.crm_company_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM members can read company-event links"
  ON public.crm_company_events FOR SELECT TO authenticated
  USING (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can insert company-event links"
  ON public.crm_company_events FOR INSERT TO authenticated
  WITH CHECK (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can update company-event links"
  ON public.crm_company_events FOR UPDATE TO authenticated
  USING (public.can_access_crm(auth.uid()))
  WITH CHECK (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can delete company-event links"
  ON public.crm_company_events FOR DELETE TO authenticated
  USING (public.can_access_crm(auth.uid()));

CREATE INDEX idx_crm_company_events_company ON public.crm_company_events(company_id);
CREATE INDEX idx_crm_company_events_event ON public.crm_company_events(event_id);