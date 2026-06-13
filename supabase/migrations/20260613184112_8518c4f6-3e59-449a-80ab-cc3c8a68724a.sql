
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS role_type text DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS qualite text,
  ADD COLUMN IF NOT EXISTS is_dirigeant boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dirigeant_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS dirigeant_external_key text,
  ADD COLUMN IF NOT EXISTS date_naissance_partielle text,
  ADD COLUMN IF NOT EXISTS nationalite text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.crm_contacts ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_company_dirigeant_key_idx
  ON public.crm_contacts (company_id, dirigeant_external_key)
  WHERE dirigeant_external_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS crm_contacts_company_id_idx ON public.crm_contacts(company_id);

CREATE TABLE IF NOT EXISTS public.crm_contact_companies (
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'principal',
  qualite text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contact_companies TO authenticated;
GRANT ALL ON public.crm_contact_companies TO service_role;
ALTER TABLE public.crm_contact_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members manage contact companies" ON public.crm_contact_companies
  FOR ALL TO authenticated USING (can_access_crm(auth.uid())) WITH CHECK (can_access_crm(auth.uid()));

CREATE TABLE IF NOT EXISTS public.crm_opportunity_companies (
  opportunity_id uuid NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunity_companies TO authenticated;
GRANT ALL ON public.crm_opportunity_companies TO service_role;
ALTER TABLE public.crm_opportunity_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members manage opp companies" ON public.crm_opportunity_companies
  FOR ALL TO authenticated USING (can_access_crm(auth.uid())) WITH CHECK (can_access_crm(auth.uid()));
CREATE INDEX IF NOT EXISTS crm_opp_companies_company_idx ON public.crm_opportunity_companies(company_id);

CREATE TABLE IF NOT EXISTS public.crm_opportunity_contacts (
  opportunity_id uuid NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'interlocuteur',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, contact_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunity_contacts TO authenticated;
GRANT ALL ON public.crm_opportunity_contacts TO service_role;
ALTER TABLE public.crm_opportunity_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members manage opp contacts" ON public.crm_opportunity_contacts
  FOR ALL TO authenticated USING (can_access_crm(auth.uid())) WITH CHECK (can_access_crm(auth.uid()));
CREATE INDEX IF NOT EXISTS crm_opp_contacts_contact_idx ON public.crm_opportunity_contacts(contact_id);

CREATE OR REPLACE FUNCTION public.sync_company_dirigeants_to_contacts(_company_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company record;
  v_dir jsonb;
  v_nom text;
  v_prenom text;
  v_qualite text;
  v_key text;
  v_count integer := 0;
  v_contact_id uuid;
BEGIN
  SELECT id, siren, denomination, dirigeants
    INTO v_company
    FROM public.crm_companies
    WHERE id = _company_id;

  IF NOT FOUND OR v_company.dirigeants IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_dir IN SELECT * FROM jsonb_array_elements(v_company.dirigeants)
  LOOP
    v_qualite := NULLIF(trim(v_dir->>'qualite'), '');
    IF v_qualite ILIKE 'Commissaire aux comptes%' THEN
      CONTINUE;
    END IF;

    v_nom := NULLIF(trim(v_dir->>'nom'), '');
    v_prenom := NULLIF(trim(COALESCE(v_dir->>'prenoms', v_dir->>'prenom')), '');
    IF v_nom IS NULL AND v_prenom IS NULL THEN
      CONTINUE;
    END IF;

    v_key := lower(regexp_replace(
      COALESCE(v_company.siren, _company_id::text) || '|' ||
      COALESCE(v_nom, '') || '|' || COALESCE(v_prenom, '') || '|' || COALESCE(v_qualite, ''),
      '\s+', '_', 'g'));

    INSERT INTO public.crm_contacts (
      company_id, prenom, nom, fonction, qualite, segment, source,
      is_dirigeant, dirigeant_source, dirigeant_external_key,
      date_naissance_partielle, nationalite, role_type, entreprise
    ) VALUES (
      v_company.id, v_prenom, v_nom, v_qualite, v_qualite, 'entreprise', 'api_sirene',
      true, 'api_sirene', v_key,
      NULLIF(v_dir->>'date_de_naissance', ''),
      NULLIF(v_dir->>'nationalite', ''),
      'dirigeant', v_company.denomination
    )
    ON CONFLICT (company_id, dirigeant_external_key) WHERE dirigeant_external_key IS NOT NULL
    DO UPDATE SET
      prenom = COALESCE(EXCLUDED.prenom, public.crm_contacts.prenom),
      nom = COALESCE(EXCLUDED.nom, public.crm_contacts.nom),
      fonction = COALESCE(EXCLUDED.fonction, public.crm_contacts.fonction),
      qualite = COALESCE(EXCLUDED.qualite, public.crm_contacts.qualite),
      date_naissance_partielle = COALESCE(EXCLUDED.date_naissance_partielle, public.crm_contacts.date_naissance_partielle),
      nationalite = COALESCE(EXCLUDED.nationalite, public.crm_contacts.nationalite),
      entreprise = COALESCE(EXCLUDED.entreprise, public.crm_contacts.entreprise),
      updated_at = now()
    RETURNING id INTO v_contact_id;

    INSERT INTO public.crm_contact_companies (contact_id, company_id, role, qualite, is_primary)
    VALUES (v_contact_id, v_company.id, 'principal', v_qualite, true)
    ON CONFLICT (contact_id, company_id) DO UPDATE
      SET qualite = COALESCE(EXCLUDED.qualite, public.crm_contact_companies.qualite);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_dirigeants_to_contacts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.dirigeants IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.dirigeants IS DISTINCT FROM OLD.dirigeants) THEN
    PERFORM public.sync_company_dirigeants_to_contacts(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_companies_sync_dirigeants ON public.crm_companies;
CREATE TRIGGER crm_companies_sync_dirigeants
  AFTER INSERT OR UPDATE OF dirigeants ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_dirigeants_to_contacts();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.crm_companies WHERE dirigeants IS NOT NULL AND jsonb_array_length(dirigeants) > 0 LOOP
    PERFORM public.sync_company_dirigeants_to_contacts(r.id);
  END LOOP;
END $$;

INSERT INTO public.crm_opportunity_companies (opportunity_id, company_id, role)
SELECT id, company_id, 'primary' FROM public.crm_opportunities
WHERE company_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.crm_opportunity_contacts (opportunity_id, contact_id, role)
SELECT o.id, c.id, 'interlocuteur'
FROM public.crm_opportunities o
JOIN public.crm_contacts c ON lower(c.email) = lower(o.email)
WHERE o.email IS NOT NULL AND c.email IS NOT NULL
ON CONFLICT DO NOTHING;
