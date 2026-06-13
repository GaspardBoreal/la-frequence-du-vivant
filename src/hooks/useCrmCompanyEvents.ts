import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrmCompanyEvent {
  id: string;
  company_id: string;
  event_id: string;
  relation_type: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CrmCompanyEventWithCompany extends CrmCompanyEvent {
  company?: { id: string; nom_complet: string; denomination: string | null; lifecycle_stage: string };
}

export const RELATION_TYPES = [
  { value: 'participant', label: 'Participant' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'organisateur', label: 'Organisateur' },
  { value: 'invite', label: 'Invité' },
];

export function useEventCompanies(eventId: string | null) {
  return useQuery({
    queryKey: ['crm-event-companies', eventId],
    queryFn: async (): Promise<CrmCompanyEventWithCompany[]> => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('crm_company_events' as any)
        .select('*, company:crm_companies(id, nom_complet, denomination, lifecycle_stage)')
        .eq('event_id', eventId);
      if (error) throw error;
      return (data || []) as unknown as CrmCompanyEventWithCompany[];
    },
    enabled: !!eventId,
  });
}

export function useEventCompanyCounts(eventIds: string[]) {
  return useQuery({
    queryKey: ['crm-event-company-counts', eventIds.sort().join(',')],
    queryFn: async (): Promise<Record<string, number>> => {
      if (eventIds.length === 0) return {};
      const { data, error } = await supabase
        .from('crm_company_events' as any)
        .select('event_id')
        .in('event_id', eventIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.event_id] = (counts[r.event_id] || 0) + 1;
      });
      return counts;
    },
    enabled: eventIds.length > 0,
  });
}

export function useLinkCompanyEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { company_id: string; event_id: string; relation_type?: string; notes?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('crm_company_events' as any)
        .insert({
          company_id: params.company_id,
          event_id: params.event_id,
          relation_type: params.relation_type || 'participant',
          notes: params.notes || null,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-event-companies', vars.event_id] });
      qc.invalidateQueries({ queryKey: ['crm-event-company-counts'] });
      toast.success('Entreprise liée');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la liaison'),
  });
}

export function useUnlinkCompanyEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_company_events' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-event-companies'] });
      qc.invalidateQueries({ queryKey: ['crm-event-company-counts'] });
      toast.success('Lien supprimé');
    },
  });
}
