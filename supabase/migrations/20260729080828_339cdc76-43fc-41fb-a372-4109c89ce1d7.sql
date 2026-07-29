CREATE TABLE public.propriete_ouvrage_kb (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outil_key text NOT NULL UNIQUE,
  mise_en_oeuvre jsonb NOT NULL DEFAULT '[]'::jsonb,
  calendrier text,
  entretien jsonb NOT NULL DEFAULT '{}'::jsonb,
  especes jsonb NOT NULL DEFAULT '[]'::jsonb,
  vigilance jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.propriete_ouvrage_kb TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_ouvrage_kb TO authenticated;
GRANT ALL ON public.propriete_ouvrage_kb TO service_role;

ALTER TABLE public.propriete_ouvrage_kb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ouvrage KB readable by everyone"
  ON public.propriete_ouvrage_kb FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert ouvrage KB"
  ON public.propriete_ouvrage_kb FOR INSERT TO authenticated
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can update ouvrage KB"
  ON public.propriete_ouvrage_kb FOR UPDATE TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete ouvrage KB"
  ON public.propriete_ouvrage_kb FOR DELETE TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE TRIGGER update_propriete_ouvrage_kb_updated_at
  BEFORE UPDATE ON public.propriete_ouvrage_kb
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();