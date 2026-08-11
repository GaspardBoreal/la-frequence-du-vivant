-- ============ CAMPAIGNS ============
CREATE TABLE public.crm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  objectif text NOT NULL DEFAULT 'partenariat',
  statut text NOT NULL DEFAULT 'brouillon',
  description text,
  date_debut date,
  date_fin date,
  pilote_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  objectif_contacts integer DEFAULT 0,
  objectif_taux numeric DEFAULT 10,
  script jsonb NOT NULL DEFAULT '{}'::jsonb,
  ciblage jsonb NOT NULL DEFAULT '{}'::jsonb,
  couleur text DEFAULT 'violet',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaigns TO authenticated;
GRANT ALL ON public.crm_campaigns TO service_role;

ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users manage campaigns"
ON public.crm_campaigns FOR ALL TO authenticated
USING (public.can_access_crm(auth.uid()))
WITH CHECK (public.can_access_crm(auth.uid()));

-- ============ CAMPAIGN MEMBERS ============
CREATE TABLE public.crm_campaign_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  call_status text NOT NULL DEFAULT 'a_appeler',
  priorite integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  last_call_at timestamptz,
  next_call_at timestamptz,
  refus_motif text,
  notes text,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX crm_campaign_members_unique_company
  ON public.crm_campaign_members (campaign_id, company_id)
  WHERE company_id IS NOT NULL;
CREATE INDEX crm_campaign_members_campaign_idx ON public.crm_campaign_members (campaign_id);
CREATE INDEX crm_campaign_members_status_idx ON public.crm_campaign_members (campaign_id, call_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaign_members TO authenticated;
GRANT ALL ON public.crm_campaign_members TO service_role;

ALTER TABLE public.crm_campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users manage campaign members"
ON public.crm_campaign_members FOR ALL TO authenticated
USING (public.can_access_crm(auth.uid()))
WITH CHECK (public.can_access_crm(auth.uid()));

-- ============ OPPORTUNITY LINK ============
ALTER TABLE public.crm_opportunities
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.crm_campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS crm_opportunities_campaign_idx ON public.crm_opportunities (campaign_id);

-- ============ TIMESTAMP TRIGGERS ============
CREATE OR REPLACE FUNCTION public.crm_campaigns_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_campaigns_set_updated_at
BEFORE UPDATE ON public.crm_campaigns
FOR EACH ROW EXECUTE FUNCTION public.crm_campaigns_touch_updated_at();

CREATE TRIGGER crm_campaign_members_set_updated_at
BEFORE UPDATE ON public.crm_campaign_members
FOR EACH ROW EXECUTE FUNCTION public.crm_campaigns_touch_updated_at();

-- ============ STATS ============
CREATE OR REPLACE FUNCTION public.get_campaign_stats(_campaign_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.can_access_crm(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'enroles', count(*),
    'a_appeler', count(*) FILTER (WHERE m.call_status = 'a_appeler'),
    'a_rappeler', count(*) FILTER (WHERE m.call_status = 'a_rappeler'),
    'joints', count(*) FILTER (WHERE m.call_status IN ('joint','interesse','refus')),
    'interesses', count(*) FILTER (WHERE m.call_status = 'interesse'),
    'refus', count(*) FILTER (WHERE m.call_status = 'refus'),
    'injoignables', count(*) FILTER (WHERE m.call_status = 'injoignable'),
    'appels', coalesce(sum(m.attempts), 0),
    'opportunites', count(*) FILTER (WHERE m.opportunity_id IS NOT NULL),
    'rappels_du_jour', count(*) FILTER (WHERE m.next_call_at IS NOT NULL AND m.next_call_at <= now())
  )
  INTO result
  FROM public.crm_campaign_members m
  WHERE m.campaign_id = _campaign_id;

  SELECT result || jsonb_build_object(
    'opp_actives', count(*) FILTER (WHERE o.statut NOT IN ('gagne','perdu','pas_interesse')),
    'opp_gagnees', count(*) FILTER (WHERE o.statut = 'gagne'),
    'opp_perdues', count(*) FILTER (WHERE o.statut IN ('perdu','pas_interesse')),
    'ca_potentiel', coalesce(sum(o.budget_estime) FILTER (WHERE o.statut NOT IN ('perdu','pas_interesse')), 0)
  )
  INTO result
  FROM public.crm_opportunities o
  WHERE o.campaign_id = _campaign_id;

  SELECT result || jsonb_build_object(
    'motifs_refus', coalesce(jsonb_agg(jsonb_build_object('motif', t.motif, 'n', t.n) ORDER BY t.n DESC), '[]'::jsonb)
  )
  INTO result
  FROM (
    SELECT coalesce(nullif(trim(m.refus_motif), ''), 'Non précisé') AS motif, count(*) AS n
    FROM public.crm_campaign_members m
    WHERE m.campaign_id = _campaign_id AND m.call_status = 'refus'
    GROUP BY 1
    LIMIT 8
  ) t;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_campaign_stats(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_campaign_stats(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_campaign_stats(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_campaign_daily(_campaign_id uuid)
RETURNS TABLE(jour date, appels bigint, interesses bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_access_crm(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT (m.last_call_at AT TIME ZONE 'Europe/Paris')::date AS jour,
         count(*)::bigint AS appels,
         count(*) FILTER (WHERE m.call_status = 'interesse')::bigint AS interesses
  FROM public.crm_campaign_members m
  WHERE m.campaign_id = _campaign_id AND m.last_call_at IS NOT NULL
  GROUP BY 1
  ORDER BY 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_campaign_daily(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_campaign_daily(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_campaign_daily(uuid) TO authenticated, service_role;