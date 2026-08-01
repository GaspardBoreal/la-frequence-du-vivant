CREATE TABLE IF NOT EXISTS public.propriete_ouvrage_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  objet_id uuid NOT NULL REFERENCES public.propriete_objets(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT 'Scénario A',
  retenu boolean NOT NULL DEFAULT false,
  plantings jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ouvrage_scenarios_objet ON public.propriete_ouvrage_scenarios(objet_id);
CREATE INDEX IF NOT EXISTS idx_ouvrage_scenarios_prop ON public.propriete_ouvrage_scenarios(propriete_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ouvrage_scenario_retenu
  ON public.propriete_ouvrage_scenarios(objet_id) WHERE retenu;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_ouvrage_scenarios TO authenticated;
GRANT ALL ON public.propriete_ouvrage_scenarios TO service_role;

ALTER TABLE public.propriete_ouvrage_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvrage_scenarios_select" ON public.propriete_ouvrage_scenarios
  FOR SELECT TO authenticated USING (public.can_access_propriete(propriete_id));
CREATE POLICY "ouvrage_scenarios_write" ON public.propriete_ouvrage_scenarios
  FOR ALL TO authenticated
  USING (public.can_curate_propriete_parcelles(propriete_id))
  WITH CHECK (public.can_curate_propriete_parcelles(propriete_id));

DROP TRIGGER IF EXISTS trg_ouvrage_scenarios_touch ON public.propriete_ouvrage_scenarios;
CREATE TRIGGER trg_ouvrage_scenarios_touch BEFORE UPDATE ON public.propriete_ouvrage_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at_generic();