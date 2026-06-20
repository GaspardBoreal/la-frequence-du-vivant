import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmOpportunity, OpportunityStatus } from '@/types/crm';
import type { CrmCompanyStage } from '@/types/crmCompany';

export interface PipelineMapPoint {
  id: string; // company_id
  lat: number;
  lng: number;
  title: string;
  ville: string | null;
  codeNaf: string | null;
  libelleNaf: string | null;
  companyStage: CrmCompanyStage | null;
  // Aggregated across all opportunities linked to this company (within filtered set)
  opportunities: Array<{
    id: string;
    titre: string | null;
    statut: OpportunityStatus;
    actions: string[];
  }>;
  // Dominant opportunity statut (most advanced) for pin coloring
  dominantStatut: OpportunityStatus;
  // Primary contact across linked opportunities
  contact: { prenom: string | null; nom: string | null; fonction: string | null; email: string | null } | null;
  marchesCount: number;
}

// Ordering: most advanced last so colors prefer "gagne" over "a_contacter".
const STATUT_RANK: Record<OpportunityStatus, number> = {
  perdu: 0,
  pas_interesse: 1,
  a_contacter: 2,
  relance_1: 3,
  relance_2: 4,
  relance_3: 5,
  gagne: 6,
};

export function useCrmPipelineMapData(filteredOpportunities: CrmOpportunity[]) {
  const oppIds = filteredOpportunities.map((o) => o.id).sort();
  const cacheKey = oppIds.join(',');

  return useQuery({
    queryKey: ['crm-pipeline-map', cacheKey],
    enabled: oppIds.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<{ points: PipelineMapPoint[]; missingGeoloc: number }> => {
      // 1. opp -> companies links
      const { data: oppCompanies, error: e1 } = await supabase
        .from('crm_opportunity_companies')
        .select('opportunity_id, company_id, role')
        .in('opportunity_id', oppIds);
      if (e1) throw e1;

      const companyIds = Array.from(new Set((oppCompanies ?? []).map((r: any) => r.company_id)));
      if (companyIds.length === 0) return { points: [], missingGeoloc: 0 };

      // 2. companies details
      const { data: companies, error: e2 } = await supabase
        .from('crm_companies')
        .select('id, denomination, nom_complet, ville, code_naf, libelle_naf, lifecycle_stage, latitude, longitude')
        .in('id', companyIds);
      if (e2) throw e2;

      // 3. opp -> contacts (primary preferred)
      const { data: oppContacts, error: e3 } = await supabase
        .from('crm_opportunity_contacts')
        .select('opportunity_id, contact_id, role, crm_contacts(prenom, nom, fonction, email)')
        .in('opportunity_id', oppIds);
      if (e3) throw e3;

      // 4. marches count per company
      const { data: events, error: e4 } = await supabase
        .from('crm_company_events' as any)
        .select('company_id')
        .in('company_id', companyIds);
      if (e4) throw e4;
      const marchesByCompany: Record<string, number> = {};
      (events ?? []).forEach((r: any) => {
        marchesByCompany[r.company_id] = (marchesByCompany[r.company_id] || 0) + 1;
      });

      // Index opps by id
      const oppById = new Map(filteredOpportunities.map((o) => [o.id, o]));
      // Build contact map: opportunity_id -> best contact (primary > first)
      const contactByOpp = new Map<string, any>();
      (oppContacts ?? []).forEach((r: any) => {
        const existing = contactByOpp.get(r.opportunity_id);
        if (!existing || r.role === 'primary') contactByOpp.set(r.opportunity_id, r.crm_contacts);
      });

      // Group opp ids per company
      const oppsByCompany: Record<string, string[]> = {};
      (oppCompanies ?? []).forEach((r: any) => {
        (oppsByCompany[r.company_id] ||= []).push(r.opportunity_id);
      });

      let missing = 0;
      const points: PipelineMapPoint[] = [];

      for (const c of companies ?? []) {
        const linkedOppIds = oppsByCompany[c.id] ?? [];
        const linkedOpps = linkedOppIds
          .map((id) => oppById.get(id))
          .filter(Boolean) as CrmOpportunity[];
        if (linkedOpps.length === 0) continue;

        if (c.latitude == null || c.longitude == null) {
          missing += 1;
          continue;
        }

        // Pick contact: from first opp that has one
        let contact: PipelineMapPoint['contact'] = null;
        for (const o of linkedOpps) {
          const k = contactByOpp.get(o.id);
          if (k) {
            contact = { prenom: k.prenom, nom: k.nom, fonction: k.fonction, email: k.email };
            break;
          }
        }
        // Fallback: opp inline contact (prenom/nom on the opp row)
        if (!contact && linkedOpps[0]) {
          const o = linkedOpps[0];
          contact = { prenom: o.prenom, nom: o.nom, fonction: o.fonction, email: o.email };
        }

        const opportunities = linkedOpps.map((o) => ({
          id: o.id,
          titre: o.titre,
          statut: o.statut as OpportunityStatus,
          actions: Array.isArray(o.actions_realisees) ? (o.actions_realisees as string[]) : [],
        }));

        const dominant = opportunities.reduce(
          (acc, o) => (STATUT_RANK[o.statut] > STATUT_RANK[acc] ? o.statut : acc),
          opportunities[0].statut,
        );

        points.push({
          id: c.id,
          lat: c.latitude,
          lng: c.longitude,
          title: c.denomination ?? c.nom_complet ?? 'Sans nom',
          ville: c.ville,
          codeNaf: c.code_naf,
          libelleNaf: c.libelle_naf,
          companyStage: (c.lifecycle_stage as CrmCompanyStage) ?? null,
          opportunities,
          dominantStatut: dominant,
          contact,
          marchesCount: marchesByCompany[c.id] ?? 0,
        });
      }

      return { points, missingGeoloc: missing };
    },
  });
}
