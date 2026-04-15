-- Add categorie column to frequence_citations
ALTER TABLE public.frequence_citations
  ADD COLUMN categorie text NOT NULL DEFAULT 'geopoetique';

-- Index for filtering by category
CREATE INDEX idx_frequence_citations_categorie ON public.frequence_citations (categorie);