CREATE TABLE public.partner_ai_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source_page text NOT NULL DEFAULT '',
  partner_slug text NOT NULL DEFAULT '',
  nom text,
  type_structure text,
  territoire text,
  productions text,
  demarrage text,
  projet text,
  objectifs text,
  livrables text,
  difficulte text,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  form_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dimensionnement jsonb NOT NULL DEFAULT '{}'::jsonb,
  plan jsonb,
  precisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  iterations integer NOT NULL DEFAULT 1,
  ai_model text,
  duration_ms integer,
  status text NOT NULL DEFAULT 'done',
  error_message text,
  session_key text
);

CREATE INDEX idx_partner_ai_simulations_created ON public.partner_ai_simulations (created_at DESC);
CREATE INDEX idx_partner_ai_simulations_slug ON public.partner_ai_simulations (partner_slug);
CREATE INDEX idx_partner_ai_simulations_session ON public.partner_ai_simulations (session_key);

GRANT SELECT, UPDATE, DELETE ON public.partner_ai_simulations TO authenticated;
GRANT ALL ON public.partner_ai_simulations TO service_role;

ALTER TABLE public.partner_ai_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins lisent les simulations IA partenaires"
  ON public.partner_ai_simulations FOR SELECT TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Admins modifient les simulations IA partenaires"
  ON public.partner_ai_simulations FOR UPDATE TO authenticated
  USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins suppriment les simulations IA partenaires"
  ON public.partner_ai_simulations FOR DELETE TO authenticated
  USING (public.is_admin_user());

CREATE TRIGGER partner_ai_simulations_touch
  BEFORE UPDATE ON public.partner_ai_simulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();