-- Cache des taxons iNaturalist : résolution ID → nom de famille + iconic_taxon
CREATE TABLE IF NOT EXISTS public.inat_taxa_cache (
  taxon_id BIGINT PRIMARY KEY,
  name TEXT,
  rank TEXT,
  family_name TEXT,
  iconic_taxon TEXT,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inat_taxa_cache_family ON public.inat_taxa_cache(family_name);
CREATE INDEX IF NOT EXISTS idx_inat_taxa_cache_iconic ON public.inat_taxa_cache(iconic_taxon);

ALTER TABLE public.inat_taxa_cache ENABLE ROW LEVEL SECURITY;

-- Lecture publique (référentiel taxonomique, aucune PII)
CREATE POLICY "inat_taxa_cache_public_read"
ON public.inat_taxa_cache
FOR SELECT
USING (true);

-- Écriture : service_role uniquement (edge functions)
CREATE POLICY "inat_taxa_cache_service_write"
ON public.inat_taxa_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);