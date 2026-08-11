import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  CrmCampaign,
  CrmCampaignMember,
  CampaignStats,
} from '@/types/crmCampaign';

const COMPANY_SELECT =
  'id, nom_complet, denomination, ville, departement, site_web, code_naf, libelle_naf, lifecycle_stage, dirigeants, notes';

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

export function useCrmCampaigns() {
  return useQuery({
    queryKey: ['crm-campaigns'],
    queryFn: async (): Promise<CrmCampaign[]> => {
      const { data, error } = await supabase
        .from('crm_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CrmCampaign[];
    },
    staleTime: 20_000,
  });
}

export function useCrmCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['crm-campaign', id],
    queryFn: async (): Promise<CrmCampaign | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('crm_campaigns')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as CrmCampaign) ?? null;
    },
    enabled: !!id,
  });
}

/** Compteurs légers par campagne pour l'écran de liste. */
export function useCampaignsOverview() {
  return useQuery({
    queryKey: ['crm-campaigns-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_campaign_members')
        .select('campaign_id, call_status')
        .limit(20000);
      if (error) throw error;
      const map = new Map<
        string,
        { enroles: number; joints: number; interesses: number; a_appeler: number }
      >();
      (data ?? []).forEach((r: any) => {
        const e =
          map.get(r.campaign_id) ?? { enroles: 0, joints: 0, interesses: 0, a_appeler: 0 };
        e.enroles += 1;
        if (['joint', 'interesse', 'refus'].includes(r.call_status)) e.joints += 1;
        if (r.call_status === 'interesse') e.interesses += 1;
        if (r.call_status === 'a_appeler') e.a_appeler += 1;
        map.set(r.campaign_id, e);
      });
      return map;
    },
    staleTime: 20_000,
  });
}

export function useCampaignMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['crm-campaigns'] });
    qc.invalidateQueries({ queryKey: ['crm-campaigns-overview'] });
    qc.invalidateQueries({ queryKey: ['crm-campaign'] });
  };

  const createCampaign = useMutation({
    mutationFn: async (payload: Partial<CrmCampaign>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('crm_campaigns')
        .insert({ ...(payload as any), created_by: userData.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CrmCampaign;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Campagne créée');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur à la création'),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_campaigns')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CrmCampaign;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Campagne mise à jour');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur à la mise à jour'),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Campagne supprimée');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur à la suppression'),
  });

  const duplicateCampaign = useMutation({
    mutationFn: async (c: CrmCampaign) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('crm_campaigns')
        .insert({
          nom: `${c.nom} (copie)`,
          objectif: c.objectif,
          statut: 'brouillon',
          description: c.description,
          pilote_id: c.pilote_id,
          objectif_contacts: c.objectif_contacts,
          objectif_taux: c.objectif_taux,
          script: c.script as any,
          ciblage: c.ciblage as any,
          couleur: c.couleur,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CrmCampaign;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Campagne dupliquée');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur à la duplication'),
  });

  return { createCampaign, updateCampaign, deleteCampaign, duplicateCampaign };
}

/* ------------------------------------------------------------------ */
/* Members                                                             */
/* ------------------------------------------------------------------ */

export function useCampaignMembers(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['crm-campaign-members', campaignId],
    queryFn: async (): Promise<CrmCampaignMember[]> => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('crm_campaign_members')
        .select(`*, company:crm_companies(${COMPANY_SELECT}), opportunity:crm_opportunities!crm_campaign_members_opportunity_id_fkey(id, statut)`)
        .eq('campaign_id', campaignId)
        .order('priorite', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as unknown as CrmCampaignMember[];
    },
    enabled: !!campaignId,
    staleTime: 10_000,
  });
}

/** Toutes les appartenances (pour signaler qu'une entreprise est déjà en campagne). */
export function useAllCampaignMemberships() {
  return useQuery({
    queryKey: ['crm-campaign-memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_campaign_members')
        .select('company_id, campaign_id')
        .limit(20000);
      if (error) throw error;
      const map = new Map<string, string[]>();
      (data ?? []).forEach((r: any) => {
        if (!r.company_id) return;
        map.set(r.company_id, [...(map.get(r.company_id) ?? []), r.campaign_id]);
      });
      return map;
    },
    staleTime: 20_000,
  });
}

export function useCampaignMemberMutations(campaignId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['crm-campaign-members'] });
    qc.invalidateQueries({ queryKey: ['crm-campaign-memberships'] });
    qc.invalidateQueries({ queryKey: ['crm-campaigns-overview'] });
    qc.invalidateQueries({ queryKey: ['campaign-stats'] });
    qc.invalidateQueries({ queryKey: ['campaign-daily'] });
    qc.invalidateQueries({ queryKey: ['crm-opportunities'] });
  };

  const enrollCompanies = useMutation({
    mutationFn: async ({
      campaign_id,
      companyIds,
    }: {
      campaign_id: string;
      companyIds: string[];
    }) => {
      if (companyIds.length === 0) return 0;
      const { data: userData } = await supabase.auth.getUser();
      const rows = companyIds.map((company_id) => ({
        campaign_id,
        company_id,
        added_by: userData.user?.id ?? null,
      }));
      const { data, error } = await supabase
        .from('crm_campaign_members')
        .upsert(rows as any, { onConflict: 'campaign_id,company_id', ignoreDuplicates: true })
        .select('id');
      if (error) throw error;
      return data?.length ?? 0;
    },
    onSuccess: (n) => {
      invalidate();
      toast.success(n > 0 ? `${n} prospect${n > 1 ? 's' : ''} enrôlé${n > 1 ? 's' : ''}` : 'Déjà enrôlés');
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur à l'enrôlement"),
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmCampaignMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_campaign_members')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.message ?? 'Erreur à la mise à jour'),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_campaign_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Prospect retiré de la campagne');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur au retrait'),
  });

  /** Issue d'appel "Intéressé" : crée l'opportunité rattachée et lie le membre. */
  const convertToOpportunity = useMutation({
    mutationFn: async ({
      member,
      campaign,
      note,
    }: {
      member: CrmCampaignMember;
      campaign: CrmCampaign;
      note?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const company = member.company;
      const dirigeant = Array.isArray(company?.dirigeants) ? company?.dirigeants?.[0] : null;
      const { data: opp, error } = await supabase
        .from('crm_opportunities')
        .insert({
          titre: `${company?.nom_complet ?? company?.denomination ?? 'Prospect'} — ${campaign.nom}`,
          prenom: (dirigeant as any)?.prenoms ?? '',
          nom: (dirigeant as any)?.nom ?? (company?.nom_complet ?? 'Contact'),
          entreprise: company?.nom_complet ?? company?.denomination ?? null,
          email: '',
          statut: 'relance_2',
          source: 'campagne',
          notes: note ?? null,
          campaign_id: campaign.id,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      if (company?.id) {
        await supabase
          .from('crm_opportunity_companies')
          .insert({ opportunity_id: (opp as any).id, company_id: company.id, role: 'prospect' } as any);
      }

      await supabase
        .from('crm_campaign_members')
        .update({ opportunity_id: (opp as any).id, call_status: 'interesse' } as any)
        .eq('id', member.id);

      return opp;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Intérêt détecté — opportunité créée');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur à la conversion'),
  });

  return { enrollCompanies, updateMember, removeMember, convertToOpportunity, campaignId };
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export function useCampaignStats(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async (): Promise<CampaignStats | null> => {
      if (!campaignId) return null;
      const { data, error } = await supabase.rpc('get_campaign_stats', {
        _campaign_id: campaignId,
      });
      if (error) throw error;
      return data as unknown as CampaignStats;
    },
    enabled: !!campaignId,
    staleTime: 5_000,
  });
}

export function useCampaignDaily(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-daily', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase.rpc('get_campaign_daily', {
        _campaign_id: campaignId,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ jour: string; appels: number; interesses: number }>;
    },
    enabled: !!campaignId,
    staleTime: 10_000,
  });
}
