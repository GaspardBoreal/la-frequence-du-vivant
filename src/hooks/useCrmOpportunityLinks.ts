import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OppLinkedCompany {
  company_id: string;
  role: string;
  denomination?: string | null;
  ville?: string | null;
  lifecycle_stage?: string | null;
}

export interface OppLinkedContact {
  contact_id: string;
  role: string;
  prenom?: string | null;
  nom?: string | null;
  email?: string | null;
  fonction?: string | null;
}

export function useOpportunityLinks(opportunityId: string | null) {
  return useQuery({
    queryKey: ['crm-opp-links', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return { companies: [], contacts: [] };
      const [companiesRes, contactsRes] = await Promise.all([
        supabase
          .from('crm_opportunity_companies')
          .select('company_id, role, crm_companies(denomination, ville, lifecycle_stage)')
          .eq('opportunity_id', opportunityId),
        supabase
          .from('crm_opportunity_contacts')
          .select('contact_id, role, crm_contacts(prenom, nom, email, fonction)')
          .eq('opportunity_id', opportunityId),
      ]);
      if (companiesRes.error) throw companiesRes.error;
      if (contactsRes.error) throw contactsRes.error;
      const companies: OppLinkedCompany[] = (companiesRes.data ?? []).map((r: any) => ({
        company_id: r.company_id,
        role: r.role,
        denomination: r.crm_companies?.denomination,
        ville: r.crm_companies?.ville,
        lifecycle_stage: r.crm_companies?.lifecycle_stage,
      }));
      const contacts: OppLinkedContact[] = (contactsRes.data ?? []).map((r: any) => ({
        contact_id: r.contact_id,
        role: r.role,
        prenom: r.crm_contacts?.prenom,
        nom: r.crm_contacts?.nom,
        email: r.crm_contacts?.email,
        fonction: r.crm_contacts?.fonction,
      }));
      return { companies, contacts };
    },
    enabled: !!opportunityId,
  });
}

export async function syncOpportunityLinks(
  opportunityId: string,
  companies: OppLinkedCompany[],
  contacts: OppLinkedContact[],
) {
  // Replace strategy: delete then insert (small N, safe).
  await supabase.from('crm_opportunity_companies').delete().eq('opportunity_id', opportunityId);
  await supabase.from('crm_opportunity_contacts').delete().eq('opportunity_id', opportunityId);
  if (companies.length > 0) {
    const { error } = await supabase.from('crm_opportunity_companies').insert(
      companies.map((c) => ({
        opportunity_id: opportunityId,
        company_id: c.company_id,
        role: c.role || 'primary',
      })),
    );
    if (error) throw error;
  }
  if (contacts.length > 0) {
    const { error } = await supabase.from('crm_opportunity_contacts').insert(
      contacts.map((c) => ({
        opportunity_id: opportunityId,
        contact_id: c.contact_id,
        role: c.role || 'interlocuteur',
      })),
    );
    if (error) throw error;
  }
}

export function useInvalidateOpportunityLinks() {
  const qc = useQueryClient();
  return (opportunityId?: string) => {
    qc.invalidateQueries({ queryKey: ['crm-opp-links', opportunityId] });
    qc.invalidateQueries({ queryKey: ['crm-opportunities'] });
  };
}
