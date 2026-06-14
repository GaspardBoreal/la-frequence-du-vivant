import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmCompany, CrmCompanyStage, CrmCompanyActivity } from '@/types/crmCompany';
import { toast } from 'sonner';

export interface CrmCompaniesFilters {
  stage?: CrmCompanyStage | 'all';
  search?: string;
  assigned_to?: string;
  region?: string;
  departement?: string;
  ville?: string;
  code_naf?: string;
  geolocated_only?: boolean;
}

export function useCrmCompanies(filters: CrmCompaniesFilters = {}) {
  return useQuery({
    queryKey: ['crm-companies', filters],
    queryFn: async () => {
      let q = supabase.from('crm_companies').select('*').order('updated_at', { ascending: false }).limit(500);
      if (filters.stage && filters.stage !== 'all') q = q.eq('lifecycle_stage', filters.stage);
      if (filters.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
      if (filters.region) q = q.eq('region', filters.region);
      if (filters.departement) q = q.eq('departement', filters.departement);
      if (filters.ville) q = q.ilike('ville', `%${filters.ville.trim()}%`);
      if (filters.code_naf) q = q.eq('code_naf', filters.code_naf);
      if (filters.geolocated_only) q = q.not('latitude', 'is', null).not('longitude', 'is', null);
      if (filters.search) {
        const s = filters.search.trim();
        q = q.or(`denomination.ilike.%${s}%,nom_complet.ilike.%${s}%,siren.ilike.%${s}%,ville.ilike.%${s}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CrmCompany[];
    },
    staleTime: 30_000,
  });
}


export function useCrmCompany(id: string | null) {
  return useQuery({
    queryKey: ['crm-company', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('crm_companies').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as CrmCompany | null;
    },
    enabled: !!id,
  });
}

export function useCrmCompanyActivities(companyId: string | null) {
  return useQuery({
    queryKey: ['crm-company-activities', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('crm_company_activities').select('*')
        .eq('company_id', companyId).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as CrmCompanyActivity[];
    },
    enabled: !!companyId,
  });
}

export function useImportCompanies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { sirens: string[]; assigned_to?: string | null; tags?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('import-companies-batch', { body: payload });
      if (error) throw error;
      return data as { imported: number; results: Array<{ id: string; siren: string }> };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['crm-companies'] });
      qc.invalidateQueries({ queryKey: ['company-search'] });
      toast.success(`${data.imported} entreprise(s) ajoutée(s) comme Suspect`);
    },
    onError: (e: any) => toast.error('Import échoué', { description: e?.message }),
  });
}

export function useUpdateCompanyStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: CrmCompanyStage }) => {
      const { data, error } = await supabase
        .from('crm_companies').update({ lifecycle_stage: stage }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-companies'] });
      qc.invalidateQueries({ queryKey: ['crm-company'] });
      qc.invalidateQueries({ queryKey: ['crm-company-activities'] });
      toast.success('Stage mis à jour');
    },
    onError: (e: any) => toast.error('Échec mise à jour', { description: e?.message }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CrmCompany> }) => {
      const { data, error } = await supabase.from('crm_companies').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-companies'] });
      qc.invalidateQueries({ queryKey: ['crm-company'] });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-companies'] });
      toast.success('Entreprise supprimée');
    },
    onError: (e: any) => toast.error('Suppression échouée', { description: e?.message }),
  });
}

export function useAddCompanyActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CrmCompanyActivity> & { company_id: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      const { data, error } = await supabase.from('crm_company_activities').insert({
        ...payload, performed_by: user?.id,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-company-activities', vars.company_id] });
      toast.success('Activité enregistrée');
    },
    onError: (e: any) => toast.error('Échec', { description: e?.message }),
  });
}
