
DO $$ BEGIN
  CREATE TYPE public.adhesion_college AS ENUM ('fondateurs', 'actifs', 'partenaires_mecenes');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.community_profiles
  ADD COLUMN IF NOT EXISTS is_adherent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS college_adhesion public.adhesion_college,
  ADD COLUMN IF NOT EXISTS adhesion_date timestamptz,
  ADD COLUMN IF NOT EXISTS adhesion_source text,
  ADD COLUMN IF NOT EXISTS adhesion_campaign text,
  ADD COLUMN IF NOT EXISTS rgpd_newsletter_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rgpd_newsletter_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS adhesion_commentaires text,
  ADD COLUMN IF NOT EXISTS adhesion_numero serial;

CREATE INDEX IF NOT EXISTS idx_community_profiles_is_adherent ON public.community_profiles(is_adherent) WHERE is_adherent = true;
CREATE INDEX IF NOT EXISTS idx_community_profiles_college_adhesion ON public.community_profiles(college_adhesion);

CREATE TABLE IF NOT EXISTS public.adhesion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  prenom text NOT NULL,
  nom text NOT NULL,
  telephone text,
  ville text,
  types_marches text[] NOT NULL DEFAULT '{}',
  autre_type_marche text,
  commentaires text,
  college_demande public.adhesion_college,
  rgpd_consent boolean NOT NULL DEFAULT false,
  source text,
  campaign text,
  user_agent text,
  matched_profile_id uuid REFERENCES public.community_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','linked','created','rejected','duplicate')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.adhesion_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adhesion_requests TO authenticated;
GRANT ALL ON public.adhesion_requests TO service_role;

ALTER TABLE public.adhesion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit adhesion request"
  ON public.adhesion_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read all adhesion requests"
  ON public.adhesion_requests FOR SELECT
  TO authenticated USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can update adhesion requests"
  ON public.adhesion_requests FOR UPDATE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete adhesion requests"
  ON public.adhesion_requests FOR DELETE
  TO authenticated USING (public.check_is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_adhesion_requests_email ON public.adhesion_requests(lower(email));
CREATE INDEX IF NOT EXISTS idx_adhesion_requests_status ON public.adhesion_requests(status);
CREATE INDEX IF NOT EXISTS idx_adhesion_requests_campaign ON public.adhesion_requests(campaign);
CREATE INDEX IF NOT EXISTS idx_adhesion_requests_created_at ON public.adhesion_requests(created_at DESC);

CREATE OR REPLACE FUNCTION public.adhesion_requests_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_adhesion_requests_updated_at ON public.adhesion_requests;
CREATE TRIGGER trg_adhesion_requests_updated_at
  BEFORE UPDATE ON public.adhesion_requests
  FOR EACH ROW EXECUTE FUNCTION public.adhesion_requests_set_updated_at();

CREATE TABLE IF NOT EXISTS public.adhesion_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  support text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.adhesion_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adhesion_campaigns TO authenticated;
GRANT ALL ON public.adhesion_campaigns TO service_role;

ALTER TABLE public.adhesion_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read campaigns"
  ON public.adhesion_campaigns FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Admins insert campaigns"
  ON public.adhesion_campaigns FOR INSERT
  TO authenticated WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins update campaigns"
  ON public.adhesion_campaigns FOR UPDATE
  TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins delete campaigns"
  ON public.adhesion_campaigns FOR DELETE
  TO authenticated USING (public.check_is_admin_user(auth.uid()));

DROP TRIGGER IF EXISTS trg_adhesion_campaigns_updated_at ON public.adhesion_campaigns;
CREATE TRIGGER trg_adhesion_campaigns_updated_at
  BEFORE UPDATE ON public.adhesion_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.adhesion_requests_set_updated_at();

INSERT INTO public.adhesion_campaigns (slug, label, description, support)
VALUES ('flyer-devenez-marcheur', 'Flyer — Devenez marcheur du vivant', 'Flyer A6 d''appel à l''adhésion, distribué lors des marches et événements.', 'flyer')
ON CONFLICT (slug) DO NOTHING;
