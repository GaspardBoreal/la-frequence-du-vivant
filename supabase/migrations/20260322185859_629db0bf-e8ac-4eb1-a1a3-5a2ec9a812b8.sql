CREATE TABLE public.marche_organisateurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  adresse text,
  code_postal text,
  ville text,
  pays text DEFAULT 'France',
  email text,
  telephone text,
  site_web text,
  logo_url text,
  description text,
  type_structure text DEFAULT 'association',
  domaines text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marche_organisateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view organisateurs"
  ON public.marche_organisateurs FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage organisateurs"
  ON public.marche_organisateurs FOR ALL TO authenticated
  USING (check_is_admin_user(auth.uid()))
  WITH CHECK (check_is_admin_user(auth.uid()));

ALTER TABLE public.marches
  ADD COLUMN organisateur_id uuid REFERENCES public.marche_organisateurs(id);