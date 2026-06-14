import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrmContactRow {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  entreprise: string | null;
  fonction: string | null;
  qualite: string | null;
  segment: string | null;
  source: string | null;
  notes: string | null;
  linkedin_url: string | null;
  role_type: string | null;
  is_dirigeant: boolean;
  dirigeant_source: string | null;
  dirigeant_external_key: string | null;
  date_naissance_partielle: string | null;
  nationalite: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmContactsFilters {
  search?: string;
  roleType?: string | 'all';
  companyId?: string | null;
  dirigeantOnly?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  fonction?: string;
  entreprise?: string;
}

export function useCrmContacts(filters: CrmContactsFilters = {}) {
  return useQuery({
    queryKey: ['crm-contacts', filters],
    queryFn: async () => {
      let q = supabase
        .from('crm_contacts')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1000);
      if (filters.companyId) q = q.eq('company_id', filters.companyId);
      if (filters.roleType && filters.roleType !== 'all') q = q.eq('role_type', filters.roleType);
      if (filters.dirigeantOnly) q = q.eq('is_dirigeant', true);
      if (filters.hasEmail) q = q.not('email', 'is', null).neq('email', '');
      if (filters.hasPhone) q = q.not('telephone', 'is', null).neq('telephone', '');
      if (filters.fonction) q = q.ilike('fonction', `%${filters.fonction.trim()}%`);
      if (filters.entreprise) q = q.ilike('entreprise', `%${filters.entreprise.trim()}%`);
      if (filters.search) {
        const s = filters.search.trim();
        q = q.or(
          `nom.ilike.%${s}%,prenom.ilike.%${s}%,email.ilike.%${s}%,entreprise.ilike.%${s}%,fonction.ilike.%${s}%`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CrmContactRow[];
    },
    staleTime: 30_000,
  });
}


export interface CrmContactInput {
  prenom?: string | null;
  nom?: string | null;
  email?: string | null;
  telephone?: string | null;
  entreprise?: string | null;
  fonction?: string | null;
  qualite?: string | null;
  segment?: string | null;
  role_type?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
  company_id?: string | null;
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CrmContactInput) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert({
          ...input,
          segment: input.segment ?? 'general',
          source: 'manual',
          dirigeant_source: 'manual',
          is_dirigeant: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CrmContactRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
      qc.invalidateQueries({ queryKey: ['crm-home-stats'] });
      toast.success('Contact créé');
    },
    onError: (e: any) => toast.error(`Erreur : ${e?.message ?? e}`),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: CrmContactInput & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CrmContactRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (e: any) => toast.error(`Erreur : ${e?.message ?? e}`),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
      qc.invalidateQueries({ queryKey: ['crm-home-stats'] });
      toast.success('Contact supprimé');
    },
    onError: (e: any) => toast.error(`Erreur : ${e?.message ?? e}`),
  });
}
