ALTER TABLE public.frequence_citations
  ADD COLUMN IF NOT EXISTS shown_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS viewed_count INTEGER NOT NULL DEFAULT 0;

CREATE POLICY "Authenticated users can increment counters"
ON public.frequence_citations FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);