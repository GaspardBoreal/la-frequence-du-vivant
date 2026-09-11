CREATE TABLE public.marche_animation_idees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_event_id UUID NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  waypoint_id UUID NOT NULL REFERENCES public.exploration_waypoints(id) ON DELETE CASCADE,
  groupe TEXT NOT NULL DEFAULT 'lieu',
  ordre INTEGER NOT NULL DEFAULT 0,
  titre TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duree TEXT NOT NULL DEFAULT '',
  materiel TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'assistant',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marche_animation_idees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marche_animation_idees TO authenticated;
GRANT ALL ON public.marche_animation_idees TO service_role;

ALTER TABLE public.marche_animation_idees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Idees animation lisibles par tous"
ON public.marche_animation_idees FOR SELECT
USING (true);

CREATE POLICY "Curateurs peuvent creer des idees"
ON public.marche_animation_idees FOR INSERT TO authenticated
WITH CHECK (public.can_edit_marche_event(marche_event_id, auth.uid()));

CREATE POLICY "Curateurs peuvent modifier des idees"
ON public.marche_animation_idees FOR UPDATE TO authenticated
USING (public.can_edit_marche_event(marche_event_id, auth.uid()))
WITH CHECK (public.can_edit_marche_event(marche_event_id, auth.uid()));

CREATE POLICY "Curateurs peuvent supprimer des idees"
ON public.marche_animation_idees FOR DELETE TO authenticated
USING (public.can_edit_marche_event(marche_event_id, auth.uid()));

CREATE INDEX idx_marche_animation_idees_waypoint ON public.marche_animation_idees(waypoint_id, groupe, ordre);

CREATE TRIGGER update_marche_animation_idees_updated_at
BEFORE UPDATE ON public.marche_animation_idees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();