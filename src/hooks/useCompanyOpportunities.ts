import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmOpportunity } from '@/types/crm';

export interface CompanyOpportunityRow extends CrmOpportunity {
  link_role: string;
}

export function useCompanyOpportunities(companyId: string | null) {
  return useQuery({
    queryKey: ['crm-company-opportunities', companyId],
    queryFn: async (): Promise<CompanyOpportunityRow[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('crm_opportunity_companies')
        .select('role, opportunity:crm_opportunities(*, assigned_member:team_members(*))')
        .eq('company_id', companyId);
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => r.opportunity ? { ...(r.opportunity as CrmOpportunity), link_role: r.role } : null)
        .filter(Boolean) as CompanyOpportunityRow[];
    },
    enabled: !!companyId,
    staleTime: 15_000,
  });
}
