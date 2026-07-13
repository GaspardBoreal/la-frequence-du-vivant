
CREATE TABLE public.crm_opportunity_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  label TEXT,
  uploaded_by UUID,
  indexed_for_rag BOOLEAN NOT NULL DEFAULT false,
  rag_indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunity_documents TO authenticated;
GRANT ALL ON public.crm_opportunity_documents TO service_role;

ALTER TABLE public.crm_opportunity_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view opportunity documents"
  ON public.crm_opportunity_documents FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert opportunity documents"
  ON public.crm_opportunity_documents FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update opportunity documents"
  ON public.crm_opportunity_documents FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete opportunity documents"
  ON public.crm_opportunity_documents FOR DELETE
  TO authenticated USING (true);

CREATE INDEX idx_crm_opp_docs_opportunity ON public.crm_opportunity_documents(opportunity_id);

CREATE TRIGGER update_crm_opp_docs_updated_at
  BEFORE UPDATE ON public.crm_opportunity_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for the crm-opportunity-docs bucket (bucket created via tool)
CREATE POLICY "Authenticated can read crm-opportunity-docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'crm-opportunity-docs');

CREATE POLICY "Authenticated can upload crm-opportunity-docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'crm-opportunity-docs');

CREATE POLICY "Authenticated can update crm-opportunity-docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'crm-opportunity-docs');

CREATE POLICY "Authenticated can delete crm-opportunity-docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'crm-opportunity-docs');
