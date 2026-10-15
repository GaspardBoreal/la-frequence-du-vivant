GRANT SELECT, UPDATE ON public.news TO authenticated;
CREATE POLICY "admins lisent la veille" ON public.news FOR SELECT TO authenticated USING (public.check_is_admin_user(auth.uid()));
CREATE POLICY "admins publient la veille" ON public.news FOR UPDATE TO authenticated USING (public.check_is_admin_user(auth.uid())) WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE TABLE public.news_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  raisons jsonb NOT NULL DEFAULT '[]'::jsonb,
  statut text NOT NULL DEFAULT 'valide',
  decided_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (news_id, target_type, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_links TO authenticated;
GRANT ALL ON public.news_links TO service_role;
ALTER TABLE public.news_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins gèrent les liens de veille" ON public.news_links FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid())) WITH CHECK (public.check_is_admin_user(auth.uid()));
CREATE OR REPLACE FUNCTION public.news_links_validate() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.target_type NOT IN ('exploration','propriete') THEN RAISE EXCEPTION 'target_type invalide'; END IF;
  IF NEW.statut NOT IN ('valide','ecarte') THEN RAISE EXCEPTION 'statut invalide'; END IF;
  NEW.updated_at = now(); RETURN NEW;
END $$;
CREATE TRIGGER news_links_validate BEFORE INSERT OR UPDATE ON public.news_links FOR EACH ROW EXECUTE FUNCTION public.news_links_validate();