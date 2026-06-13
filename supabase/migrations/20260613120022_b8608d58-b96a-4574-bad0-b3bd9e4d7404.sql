
-- ============ Phase A: Fondations CRM B2B ============

-- 1. Enum lifecycle
DO $$ BEGIN
  CREATE TYPE public.crm_company_stage AS ENUM ('suspect', 'prospect', 'client', 'inactif');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_devis_statut AS ENUM ('aucun', 'en_cours', 'en_negociation', 'signe', 'perdu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_company_activity_type AS ENUM ('appel', 'mail', 'rdv', 'note', 'stage_change', 'import', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Table crm_companies
CREATE TABLE IF NOT EXISTS public.crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siren text UNIQUE NOT NULL,
  siret_siege text,
  denomination text,
  nom_complet text,
  lifecycle_stage public.crm_company_stage NOT NULL DEFAULT 'suspect',
  assigned_to uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  source text DEFAULT 'api_gouv',
  last_contacted_at timestamptz,
  next_action_at timestamptz,
  next_action_label text,
  -- cache API gouv
  code_naf text,
  libelle_naf text,
  forme_juridique text,
  tranche_effectif text,
  categorie_entreprise text,
  etat_administratif text,
  adresse text,
  ville text,
  code_postal text,
  departement text,
  region text,
  latitude double precision,
  longitude double precision,
  dirigeants jsonb DEFAULT '[]'::jsonb,
  qualites_labels jsonb DEFAULT '{}'::jsonb,
  finances jsonb DEFAULT '[]'::jsonb,
  raw_payload jsonb,
  api_synced_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_companies_stage ON public.crm_companies(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_companies_assigned ON public.crm_companies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_companies_tags ON public.crm_companies USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_crm_companies_geo ON public.crm_companies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_crm_companies_naf ON public.crm_companies(code_naf);
CREATE INDEX IF NOT EXISTS idx_crm_companies_region ON public.crm_companies(region);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_companies TO authenticated;
GRANT ALL ON public.crm_companies TO service_role;

ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;

-- Helper: peut accéder au CRM ?
CREATE OR REPLACE FUNCTION public.can_access_crm(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.user_roles ur ON ur.user_id = tm.user_id
    WHERE tm.user_id = _user_id AND tm.is_active = true
  );
$$;

CREATE POLICY "CRM members can read companies"
  ON public.crm_companies FOR SELECT
  TO authenticated
  USING (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can insert companies"
  ON public.crm_companies FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can update companies"
  ON public.crm_companies FOR UPDATE
  TO authenticated
  USING (public.can_access_crm(auth.uid()))
  WITH CHECK (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can delete companies"
  ON public.crm_companies FOR DELETE
  TO authenticated
  USING (public.can_access_crm(auth.uid()));

-- 3. Table crm_company_activities
CREATE TABLE IF NOT EXISTS public.crm_company_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  performed_by uuid,
  type public.crm_company_activity_type NOT NULL DEFAULT 'note',
  summary text,
  outcome text,
  next_action_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_activities_company ON public.crm_company_activities(company_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_company_activities TO authenticated;
GRANT ALL ON public.crm_company_activities TO service_role;

ALTER TABLE public.crm_company_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM members can read activities"
  ON public.crm_company_activities FOR SELECT
  TO authenticated USING (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can insert activities"
  ON public.crm_company_activities FOR INSERT
  TO authenticated WITH CHECK (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can update activities"
  ON public.crm_company_activities FOR UPDATE
  TO authenticated USING (public.can_access_crm(auth.uid()));

CREATE POLICY "CRM members can delete activities"
  ON public.crm_company_activities FOR DELETE
  TO authenticated USING (public.can_access_crm(auth.uid()));

-- 4. Évolution crm_opportunities (devis + company link)
ALTER TABLE public.crm_opportunities
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS devis_statut public.crm_devis_statut NOT NULL DEFAULT 'aucun',
  ADD COLUMN IF NOT EXISTS devis_montant_ht numeric,
  ADD COLUMN IF NOT EXISTS devis_envoye_le date,
  ADD COLUMN IF NOT EXISTS devis_signe_le date;

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_company ON public.crm_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_devis ON public.crm_opportunities(devis_statut);

-- 5. Évolution crm_contacts
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON public.crm_contacts(company_id);

-- 6. Trigger updated_at
CREATE OR REPLACE FUNCTION public.crm_companies_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_crm_companies_updated_at ON public.crm_companies;
CREATE TRIGGER trg_crm_companies_updated_at
  BEFORE UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.crm_companies_set_updated_at();

-- 7. Trigger : log auto changement de stage
CREATE OR REPLACE FUNCTION public.crm_log_stage_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.lifecycle_stage IS DISTINCT FROM OLD.lifecycle_stage THEN
    INSERT INTO public.crm_company_activities(company_id, performed_by, type, summary)
    VALUES (NEW.id, auth.uid(), 'stage_change',
      'Stage: ' || OLD.lifecycle_stage::text || ' → ' || NEW.lifecycle_stage::text);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_crm_log_stage_change ON public.crm_companies;
CREATE TRIGGER trg_crm_log_stage_change
  AFTER UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.crm_log_stage_change();
