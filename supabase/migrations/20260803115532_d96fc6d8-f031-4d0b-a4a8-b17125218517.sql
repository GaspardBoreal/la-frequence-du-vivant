CREATE TABLE public.propriete_chantier_species_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.propriete_chantiers(id) ON DELETE CASCADE,
  scientific_name text NOT NULL,
  statut text NOT NULL DEFAULT 'conservee',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chantier_id, scientific_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_chantier_species_phases TO authenticated;
GRANT ALL ON public.propriete_chantier_species_phases TO service_role;

ALTER TABLE public.propriete_chantier_species_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY chantier_species_phases_all
ON public.propriete_chantier_species_phases
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.propriete_chantiers c WHERE c.id = chantier_id AND public.can_access_propriete(c.propriete_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.propriete_chantiers c WHERE c.id = chantier_id AND public.can_access_propriete(c.propriete_id)));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_chantier_species_phases_updated_at
BEFORE UPDATE ON public.propriete_chantier_species_phases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();