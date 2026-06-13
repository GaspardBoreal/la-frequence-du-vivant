import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmHomeStats {
  contacts: number;
  dirigeants: number;
  suspects: number;
  prospects: number;
  clients: number;
  inactifs: number;
  opportunitesActives: number;
  opportunitesSignees: number;
  opportunitesTotal: number;
  caPotentiel: number;
  marchesAVenir: number;
  marchesPassees: number;
  commandes: number;
  factures: number;
}

const ACTIVE_STATUSES = ['a_contacter', 'relance_1', 'relance_2', 'relance_3'];

export function useCrmHomeStats() {
  return useQuery({
    queryKey: ['crm-home-stats'],
    queryFn: async (): Promise<CrmHomeStats> => {
      const nowIso = new Date().toISOString();

      const [
        contactsRes,
        dirigeantsRes,
        companiesRes,
        oppsRes,
        eventsUpcomingRes,
        eventsPastRes,
      ] = await Promise.all([
        supabase.from('crm_contacts').select('id', { count: 'exact', head: true }),
        supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('is_dirigeant', true),
        supabase.from('crm_companies').select('lifecycle_stage'),
        supabase.from('crm_opportunities').select('statut, budget_estime'),
        supabase
          .from('marche_events')
          .select('id', { count: 'exact', head: true })
          .gte('date_marche', nowIso),
        supabase
          .from('marche_events')
          .select('id', { count: 'exact', head: true })
          .lt('date_marche', nowIso),
      ]);

      const companies = (companiesRes.data || []) as { lifecycle_stage: string }[];
      const opps = (oppsRes.data || []) as { statut: string; budget_estime: number | null }[];

      const byStage = (stage: string) =>
        companies.filter((c) => c.lifecycle_stage === stage).length;

      const active = opps.filter((o) => ACTIVE_STATUSES.includes(o.statut)).length;
      const signed = opps.filter((o) => o.statut === 'gagne').length;
      const caPotentiel = opps
        .filter((o) => ACTIVE_STATUSES.includes(o.statut))
        .reduce((sum, o) => sum + (o.budget_estime || 0), 0);

      return {
        contacts: contactsRes.count || 0,
        dirigeants: dirigeantsRes.count || 0,
        suspects: byStage('suspect'),
        prospects: byStage('prospect'),
        clients: byStage('client'),
        inactifs: byStage('inactif'),
        opportunitesActives: active,
        opportunitesSignees: signed,
        opportunitesTotal: opps.length,
        caPotentiel,
        marchesAVenir: eventsUpcomingRes.count || 0,
        marchesPassees: eventsPastRes.count || 0,
        commandes: 0,
        factures: 0,
      };
    },
    staleTime: 60_000,
  });
}
