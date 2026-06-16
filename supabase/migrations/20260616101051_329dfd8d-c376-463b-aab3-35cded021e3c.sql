
DO $$ BEGIN
  CREATE TYPE public.crm_mission_status AS ENUM ('a_faire','en_cours','realisee','archivee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_mission_priority AS ENUM ('basse','normale','haute','critique');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_mission_assignee_role AS ENUM ('owner','collab','watcher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.can_access_crm(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::public.crm_role,'member'::public.crm_role)
  );
$$;

CREATE TABLE public.crm_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description_rich jsonb,
  statut public.crm_mission_status NOT NULL DEFAULT 'a_faire',
  priorite public.crm_mission_priority NOT NULL DEFAULT 'normale',
  due_at timestamptz,
  start_at timestamptz,
  completed_at timestamptz,
  estimated_minutes int,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  marche_event_id uuid REFERENCES public.marche_events(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  color text,
  ai_score numeric,
  ai_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_missions TO authenticated;
GRANT ALL ON public.crm_missions TO service_role;
ALTER TABLE public.crm_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members read missions" ON public.crm_missions FOR SELECT TO authenticated USING (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM members insert missions" ON public.crm_missions FOR INSERT TO authenticated WITH CHECK (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM members update missions" ON public.crm_missions FOR UPDATE TO authenticated USING (public.can_access_crm(auth.uid())) WITH CHECK (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM members delete missions" ON public.crm_missions FOR DELETE TO authenticated USING (public.can_access_crm(auth.uid()));

CREATE TABLE public.crm_mission_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.crm_missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.crm_mission_assignee_role NOT NULL DEFAULT 'owner',
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_mission_assignees TO authenticated;
GRANT ALL ON public.crm_mission_assignees TO service_role;
ALTER TABLE public.crm_mission_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members manage assignees" ON public.crm_mission_assignees FOR ALL TO authenticated USING (public.can_access_crm(auth.uid())) WITH CHECK (public.can_access_crm(auth.uid()));

CREATE TABLE public.crm_mission_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.crm_missions(id) ON DELETE CASCADE,
  author_id uuid,
  body_rich jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_mission_comments TO authenticated;
GRANT ALL ON public.crm_mission_comments TO service_role;
ALTER TABLE public.crm_mission_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members read comments" ON public.crm_mission_comments FOR SELECT TO authenticated USING (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM members write comments" ON public.crm_mission_comments FOR INSERT TO authenticated WITH CHECK (public.can_access_crm(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "Authors update own comments" ON public.crm_mission_comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own comments" ON public.crm_mission_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.crm_mission_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.crm_missions(id) ON DELETE CASCADE,
  actor_id uuid,
  type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.crm_mission_activity TO authenticated;
GRANT ALL ON public.crm_mission_activity TO service_role;
ALTER TABLE public.crm_mission_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members read activity" ON public.crm_mission_activity FOR SELECT TO authenticated USING (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM members insert activity" ON public.crm_mission_activity FOR INSERT TO authenticated WITH CHECK (public.can_access_crm(auth.uid()));

CREATE OR REPLACE FUNCTION public.crm_missions_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.statut = 'realisee' AND (OLD.statut IS DISTINCT FROM 'realisee') THEN
    NEW.completed_at := now();
  END IF;
  IF NEW.statut <> 'realisee' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_missions_touch
BEFORE UPDATE ON public.crm_missions
FOR EACH ROW EXECUTE FUNCTION public.crm_missions_touch_updated_at();

CREATE OR REPLACE FUNCTION public.crm_missions_log_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_mission_activity(mission_id, actor_id, type, payload)
    VALUES (NEW.id, NEW.created_by, 'created', jsonb_build_object('titre', NEW.titre));
  ELSIF TG_OP = 'UPDATE' AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    INSERT INTO public.crm_mission_activity(mission_id, actor_id, type, payload)
    VALUES (NEW.id, auth.uid(), 'status_change',
      jsonb_build_object('from', OLD.statut, 'to', NEW.statut));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_missions_log_status_ins
AFTER INSERT ON public.crm_missions
FOR EACH ROW EXECUTE FUNCTION public.crm_missions_log_status();

CREATE TRIGGER trg_crm_missions_log_status_upd
AFTER UPDATE ON public.crm_missions
FOR EACH ROW EXECUTE FUNCTION public.crm_missions_log_status();

CREATE INDEX idx_crm_missions_statut ON public.crm_missions(statut);
CREATE INDEX idx_crm_missions_due ON public.crm_missions(due_at);
CREATE INDEX idx_crm_missions_opp ON public.crm_missions(opportunity_id);
CREATE INDEX idx_crm_missions_company ON public.crm_missions(company_id);
CREATE INDEX idx_crm_mission_assignees_user ON public.crm_mission_assignees(user_id);
CREATE INDEX idx_crm_mission_comments_mission ON public.crm_mission_comments(mission_id);
CREATE INDEX idx_crm_mission_activity_mission ON public.crm_mission_activity(mission_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_mission_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_mission_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_mission_activity;
