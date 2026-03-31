
-- Table frequence_citations
CREATE TABLE public.frequence_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texte TEXT NOT NULL,
  auteur TEXT NOT NULL,
  oeuvre TEXT NOT NULL,
  url TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.frequence_citations ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Anyone can read active citations"
  ON public.frequence_citations FOR SELECT
  USING (active = true);

-- Admin manage
CREATE POLICY "Admins can manage citations"
  ON public.frequence_citations FOR ALL
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_frequence_citations_updated_at
  BEFORE UPDATE ON public.frequence_citations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
