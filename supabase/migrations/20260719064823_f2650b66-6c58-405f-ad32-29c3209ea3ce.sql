CREATE TABLE public.species_taxonomy_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id uuid NULL REFERENCES public.marches(id) ON DELETE CASCADE,
  alias_key text NOT NULL,
  canonical_scientific_name text NOT NULL,
  canonical_common_name_fr text NULL,
  reason text NOT NULL DEFAULT 'manual',
  notes text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX species_taxonomy_aliases_marche_key
  ON public.species_taxonomy_aliases (marche_id, alias_key)
  WHERE marche_id IS NOT NULL;
CREATE UNIQUE INDEX species_taxonomy_aliases_global_key
  ON public.species_taxonomy_aliases (alias_key)
  WHERE marche_id IS NULL;
CREATE INDEX species_taxonomy_aliases_canonical_idx
  ON public.species_taxonomy_aliases (canonical_scientific_name);

GRANT SELECT ON public.species_taxonomy_aliases TO anon, authenticated;
GRANT ALL ON public.species_taxonomy_aliases TO service_role;

ALTER TABLE public.species_taxonomy_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aliases lisibles par tous"
  ON public.species_taxonomy_aliases
  FOR SELECT
  USING (true);

CREATE POLICY "Admins gèrent les alias"
  ON public.species_taxonomy_aliases
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE OR REPLACE FUNCTION public.update_species_taxonomy_aliases_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER species_taxonomy_aliases_set_updated_at
  BEFORE UPDATE ON public.species_taxonomy_aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_species_taxonomy_aliases_updated_at();

COMMENT ON TABLE public.species_taxonomy_aliases IS
  'Fusions taxonomiques persistantes : mappe des noms sources vers un canonical, appliqué à la lecture par le pool d''espèces.';
