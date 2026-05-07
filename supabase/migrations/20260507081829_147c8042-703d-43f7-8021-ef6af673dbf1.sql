-- Helper: can edit waypoints for a marche event (admin / ambassadeur / sentinelle / créateur)
CREATE OR REPLACE FUNCTION public.can_edit_marche_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.community_profiles cp
        WHERE cp.user_id = _user_id
          AND cp.role::text IN ('ambassadeur', 'sentinelle')
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = _user_id AND ur.role::text = 'admin'
      )
      OR EXISTS (
        SELECT 1 FROM public.marche_events me
        WHERE me.id = _event_id AND me.created_by = _user_id
      )
    );
$$;

CREATE TABLE public.exploration_waypoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  after_marche_id uuid NOT NULL REFERENCES public.marches(id) ON DELETE CASCADE,
  ordre integer NOT NULL DEFAULT 0,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  label text,
  include_in_biodiversity boolean NOT NULL DEFAULT false,
  biodiversity_synced_at timestamptz,
  cadastre_synced_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exploration_waypoints_event_segment
  ON public.exploration_waypoints (marche_event_id, after_marche_id, ordre);

ALTER TABLE public.exploration_waypoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Waypoints readable by authenticated"
  ON public.exploration_waypoints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Waypoints readable by anon"
  ON public.exploration_waypoints FOR SELECT TO anon USING (true);
CREATE POLICY "Curators can insert waypoints"
  ON public.exploration_waypoints FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_marche_event(marche_event_id, auth.uid()));
CREATE POLICY "Curators can update waypoints"
  ON public.exploration_waypoints FOR UPDATE TO authenticated
  USING (public.can_edit_marche_event(marche_event_id, auth.uid()))
  WITH CHECK (public.can_edit_marche_event(marche_event_id, auth.uid()));
CREATE POLICY "Curators can delete waypoints"
  ON public.exploration_waypoints FOR DELETE TO authenticated
  USING (public.can_edit_marche_event(marche_event_id, auth.uid()));

CREATE TRIGGER trg_exploration_waypoints_updated_at
  BEFORE UPDATE ON public.exploration_waypoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.waypoint_biodiversity_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waypoint_id uuid NOT NULL REFERENCES public.exploration_waypoints(id) ON DELETE CASCADE,
  species_count integer NOT NULL DEFAULT 0,
  observations_count integer NOT NULL DEFAULT 0,
  species jsonb NOT NULL DEFAULT '[]'::jsonb,
  collected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waypoint_bio_snapshots_waypoint ON public.waypoint_biodiversity_snapshots(waypoint_id);

ALTER TABLE public.waypoint_biodiversity_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Waypoint snapshots readable by authenticated"
  ON public.waypoint_biodiversity_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Waypoint snapshots readable by anon"
  ON public.waypoint_biodiversity_snapshots FOR SELECT TO anon USING (true);