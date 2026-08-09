CREATE TABLE public.partner_roadmap_task_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_slug TEXT NOT NULL,
  roadmap_date TEXT NOT NULL,
  priority_code TEXT NOT NULL,
  task_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT partner_roadmap_task_status_unique UNIQUE (roadmap_slug, roadmap_date, priority_code, task_key),
  CONSTRAINT partner_roadmap_task_status_status_check CHECK (status IN ('todo','doing','done'))
);

GRANT SELECT, INSERT, UPDATE ON public.partner_roadmap_task_status TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_roadmap_task_status TO authenticated;
GRANT ALL ON public.partner_roadmap_task_status TO service_role;

ALTER TABLE public.partner_roadmap_task_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roadmap task status readable"
  ON public.partner_roadmap_task_status FOR SELECT USING (true);

CREATE POLICY "Roadmap task status insertable"
  ON public.partner_roadmap_task_status FOR INSERT WITH CHECK (true);

CREATE POLICY "Roadmap task status updatable"
  ON public.partner_roadmap_task_status FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER partner_roadmap_task_status_touch
  BEFORE UPDATE ON public.partner_roadmap_task_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();