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
        .select('campaign_id, call_status, email_status, emails_sent')
        .limit(20000);
      if (error) throw error;
      const map = new Map<
        string,
        {
          enroles: number;
          joints: number;
          interesses: number;
          a_appeler: number;
          emails_envoyes: number;
          reponses: number;
          a_ecrire: number;
        }
      >();
      (data ?? []).forEach((r: any) => {
        const e =
          map.get(r.campaign_id) ?? {
            enroles: 0,
            joints: 0,
            interesses: 0,
            a_appeler: 0,
            emails_envoyes: 0,
            reponses: 0,
            a_ecrire: 0,
          };
        e.enroles += 1;
        if (['joint', 'interesse', 'refus'].includes(r.call_status)) e.joints += 1;
        if (r.call_status === 'interesse') e.interesses += 1;
        if (r.call_status === 'a_appeler') e.a_appeler += 1;
        if ((r.emails_sent ?? 0) > 0) e.emails_envoyes += 1;
        else if (!['desabonne', 'bounce'].includes(r.email_status)) e.a_ecrire += 1;
        if (r.email_status === 'repondu') e.reponses += 1;
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
          canal: (c as any).canal ?? 'telephone',

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
      via,
    }: {
      member: CrmCampaignMember;
      campaign: CrmCampaign;
      note?: string;
      via?: 'telephone' | 'email';
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
        .update({
          opportunity_id: (opp as any).id,
          ...(via === 'email'
            ? { email_status: 'repondu' }
            : { call_status: 'interesse' }),
          next_action_at: null,
          next_action_canal: null,
        } as any)
        .eq('id', member.id);

      return opp;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Intérêt détecté — opportunité créée');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur à la conversion'),
  });

  /** Journalise un email envoyé depuis l'atelier et fait avancer la cadence. */
  const recordEmail = useMutation({
    mutationFn: async ({
      member,
      campaign,
      subject,
      body,
      recipient,
      nextActionCanal,
      nextActionAt,
    }: {
      member: CrmCampaignMember;
      campaign: CrmCampaign;
      subject: string;
      body: string;
      recipient?: string | null;
      nextActionCanal?: 'telephone' | 'email' | null;
      nextActionAt?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      await supabase.from('crm_email_logs').insert({
        campaign_id: campaign.id,
        opportunity_id: member.opportunity_id,
        contact_id: member.contact_id,
        recipient_email: recipient ?? 'inconnu@—',
        subject,
        body_preview: body.slice(0, 500),
        email_type: 'campagne',
        status: 'envoye_manuel',
        sent_by: userData.user?.id ?? null,
        sent_at: new Date().toISOString(),
      } as any);

      const { error } = await supabase
        .from('crm_campaign_members')
        .update({
          email_status: member.email_status === 'repondu' ? 'repondu' : 'envoye',
          emails_sent: (member.emails_sent ?? 0) + 1,
          last_email_at: new Date().toISOString(),
          next_action_canal: nextActionCanal ?? null,
          next_action_at: nextActionAt ?? null,
        } as any)
        .eq('id', member.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.message ?? "Erreur à l'enregistrement de l'email"),
  });

  return {
    enrollCompanies,
    updateMember,
    removeMember,
    convertToOpportunity,
    recordEmail,
    campaignId,
  };
}


/* ------------------------------------------------------------------ */
/* Transfert de campagne                                               */
/* ------------------------------------------------------------------ */

export interface TransferTarget {
  /** Membre de campagne à déplacer (si connu). */
  memberId?: string | null;
  /** Opportunité concernée (si connue). */
  opportunityId?: string | null;
  /** Entreprise concernée (nécessaire si aucun membre n'existe encore). */
  companyId?: string | null;
}

/** Déplace un prospect (et son opportunité) d'une campagne à une autre — ou l'en détache. */
export function useCampaignTransfer() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['crm-campaign-members'] });
    qc.invalidateQueries({ queryKey: ['crm-campaign-memberships'] });
    qc.invalidateQueries({ queryKey: ['crm-campaigns-overview'] });
    qc.invalidateQueries({ queryKey: ['campaign-stats'] });
    qc.invalidateQueries({ queryKey: ['campaign-daily'] });
    qc.invalidateQueries({ queryKey: ['crm-opportunities'] });
    qc.invalidateQueries({ queryKey: ['crm-company-opportunities'] });
  };

  const transferOne = async (t: TransferTarget, targetCampaignId: string | null) => {
    const { data: userData } = await supabase.auth.getUser();

    // 1. Retrouver le membre concerné
    let member: any = null;
    if (t.memberId) {
      const { data } = await supabase
        .from('crm_campaign_members')
        .select('*')
        .eq('id', t.memberId)
        .maybeSingle();
      member = data;
    } else if (t.opportunityId) {
      const { data } = await supabase
        .from('crm_campaign_members')
        .select('*')
        .eq('opportunity_id', t.opportunityId)
        .limit(1)
        .maybeSingle();
      member = data;
    }

    const companyId = member?.company_id ?? t.companyId ?? null;
    const opportunityId = t.opportunityId ?? member?.opportunity_id ?? null;

    // 2. Détachement pur
    if (!targetCampaignId) {
      if (member) {
        const { error } = await supabase.from('crm_campaign_members').delete().eq('id', member.id);
        if (error) throw error;
      }
      if (opportunityId) {
        const { error } = await supabase
          .from('crm_opportunities')
          .update({ campaign_id: null } as any)
          .eq('id', opportunityId);
        if (error) throw error;
      }
      return;
    }

    // 3. Déplacement / création du membre
    if (member) {
      let existing: any = null;
      if (companyId) {
        const { data } = await supabase
          .from('crm_campaign_members')
          .select('*')
          .eq('campaign_id', targetCampaignId)
          .eq('company_id', companyId)
          .maybeSingle();
        existing = data;
      }

      if (existing && existing.id !== member.id) {
        // Fusion : on garde la ligne cible en y reportant l'historique le plus riche
        const srcCall = member.last_call_at ? new Date(member.last_call_at).getTime() : 0;
        const dstCall = existing.last_call_at ? new Date(existing.last_call_at).getTime() : 0;
        const keepSource = srcCall >= dstCall;
        const merged: any = {
          opportunity_id: existing.opportunity_id ?? member.opportunity_id ?? null,
          attempts: Math.max(existing.attempts ?? 0, member.attempts ?? 0),
          priorite: Math.max(existing.priorite ?? 0, member.priorite ?? 0),
          last_call_at: keepSource ? member.last_call_at : existing.last_call_at,
          next_call_at: existing.next_call_at ?? member.next_call_at,
          call_status: keepSource ? member.call_status : existing.call_status,
          refus_motif: keepSource ? member.refus_motif ?? existing.refus_motif : existing.refus_motif,
          notes: [existing.notes, member.notes].filter(Boolean).join('\n') || null,
        };
        const { error: upErr } = await supabase
          .from('crm_campaign_members')
          .update(merged)
          .eq('id', existing.id);
        if (upErr) throw upErr;
        const { error: delErr } = await supabase
          .from('crm_campaign_members')
          .delete()
          .eq('id', member.id);
        if (delErr) throw delErr;
      } else if (member.campaign_id !== targetCampaignId) {
        const { error } = await supabase
          .from('crm_campaign_members')
          .update({ campaign_id: targetCampaignId } as any)
          .eq('id', member.id);
        if (error) throw error;
      }
    } else if (companyId) {
      const { error } = await supabase
        .from('crm_campaign_members')
        .upsert(
          {
            campaign_id: targetCampaignId,
            company_id: companyId,
            opportunity_id: opportunityId,
            added_by: userData.user?.id ?? null,
          } as any,
          { onConflict: 'campaign_id,company_id', ignoreDuplicates: false },
        );
      if (error) throw error;
      if (opportunityId) {
        await supabase
          .from('crm_campaign_members')
          .update({ opportunity_id: opportunityId } as any)
          .eq('campaign_id', targetCampaignId)
          .eq('company_id', companyId);
      }
    }

    // 4. L'opportunité suit toujours
    if (opportunityId) {
      const { error } = await supabase
        .from('crm_opportunities')
        .update({ campaign_id: targetCampaignId } as any)
        .eq('id', opportunityId);
      if (error) throw error;
    }
  };

  return useMutation({
    mutationFn: async ({
      targets,
      targetCampaignId,
    }: {
      targets: TransferTarget[];
      targetCampaignId: string | null;
    }) => {
      for (const t of targets) {
        await transferOne(t, targetCampaignId);
      }
      return targets.length;
    },
    onSuccess: (n, vars) => {
      invalidate();
      toast.success(
        vars.targetCampaignId
          ? `${n} élément${n > 1 ? 's' : ''} transféré${n > 1 ? 's' : ''} de campagne`
          : 'Retiré de la campagne',
      );
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur au transfert'),
  });
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
