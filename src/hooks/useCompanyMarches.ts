import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanyMarcheRow {
  link_id: string;
  relation_type: string;
  notes: string | null;
  created_at: string;
  event: {
    id: string;
    title: string;
    date_marche: string | null;
    lieu: string | null;
    cover_image_url: string | null;
    event_type: string | null;
    is_public: boolean | null;
    public_slug: string | null;
  } | null;
}

export function useCompanyMarches(companyId: string | null) {
  return useQuery({
    queryKey: ['crm-company-marches', companyId],
    queryFn: async (): Promise<CompanyMarcheRow[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('crm_company_events' as any)
        .select(`
          id, relation_type, notes, created_at,
          event:marche_events(id, title, date_marche, lieu, cover_image_url, event_type, is_public, public_slug)
        `)
        .eq('company_id', companyId);
      if (error) throw error;
      return ((data ?? []) as any[]).map((r: any) => ({
        link_id: r.id,
        relation_type: r.relation_type,
        notes: r.notes,
        created_at: r.created_at,
        event: r.event,
      }));
    },
    enabled: !!companyId,
    staleTime: 15_000,
  });
}

export function useUpdateCompanyMarcheLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { relation_type?: string; notes?: string | null } }) => {
      const { error } = await supabase.from('crm_company_events' as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-company-marches'] });
      qc.invalidateQueries({ queryKey: ['crm-event-companies'] });
      toast.success('Lien mis à jour');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec'),
  });
}

export function useCreateMarcheEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; date_marche?: string | null; lieu?: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('marche_events')
        .insert({
          title: payload.title,
          date_marche: payload.date_marche || null,
          lieu: payload.lieu || null,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as { id: string; title: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marche-events'] });
    },
  });
}
