CREATE TABLE public.propriete_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  created_by uuid,
  titre text NOT NULL,
  intention text,
  date_tour date NOT NULL DEFAULT CURRENT_DATE,
  statut text NOT NULL DEFAULT 'recommande',
  duree_min integer,
  saison text,
  points_forts jsonb NOT NULL DEFAULT '[]'::jsonb,
  potentiels jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  source text NOT NULL DEFAULT 'manuel',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.propriete_tour_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.propriete_tours(id) ON DELETE CASCADE,
  titre text NOT NULL,
  volet text NOT NULL DEFAULT 'observer',
  detail text,
  schema_key text,
  moment text,
  difficulte smallint NOT NULL DEFAULT 1,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manuel',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_tours TO authenticated;
GRANT ALL ON public.propriete_tours TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_tour_actions TO authenticated;
GRANT ALL ON public.propriete_tour_actions TO service_role;

ALTER TABLE public.propriete_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propriete_tour_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tours accessibles aux ayants droit"
  ON public.propriete_tours FOR ALL TO authenticated
  USING (public.can_access_propriete(propriete_id))
  WITH CHECK (public.can_access_propriete(propriete_id));

CREATE POLICY "Actions de tour accessibles aux ayants droit"
  ON public.propriete_tour_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.propriete_tours t WHERE t.id = tour_id AND public.can_access_propriete(t.propriete_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.propriete_tours t WHERE t.id = tour_id AND public.can_access_propriete(t.propriete_id)));

CREATE INDEX idx_propriete_tours_prop_date ON public.propriete_tours(propriete_id, date_tour DESC);
CREATE INDEX idx_propriete_tour_actions_tour ON public.propriete_tour_actions(tour_id, order_index);

CREATE TRIGGER trg_propriete_tours_updated_at
  BEFORE UPDATE ON public.propriete_tours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();