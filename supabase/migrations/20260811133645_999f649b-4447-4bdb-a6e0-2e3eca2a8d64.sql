CREATE OR REPLACE FUNCTION public.get_campaign_stats(_campaign_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
    'opp_qualifiees', count(*) FILTER (WHERE o.statut IN ('relance_2','relance_3','gagne')),
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