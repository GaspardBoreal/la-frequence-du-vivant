import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { NewsletterBlock, NewsletterUnivers } from '@/lib/newsletter/blocks';

const db = supabase as any;

export interface NewsletterCampaign {
  id: string;
  nom: string;
  univers: NewsletterUnivers;
  objet: string;
  preheader: string | null;
  from_name: string;
  from_email: string | null;
  reply_to: string | null;
  blocks: NewsletterBlock[];
  audience: { mode: 'univers' | 'selection'; profileIds: string[] };
  statut: 'brouillon' | 'test' | 'envoi_en_cours' | 'envoyee' | 'arretee';
  recipients_count: number;
  sent_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AudienceRow {
  profile_id: string;
  user_id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  ville: string | null;
  role: string | null;
  univers: string[];
  unsubscribed: boolean;
  last_activity: string | null;
}

export interface CampaignKpis {
  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  failed: number;
  links: Array<{ url: string; n: number }>;
  timeline: Array<{ h: string; opened: number; clicked: number }>;
}

/** Message d'erreur lisible pour une personne non technique. */
function humanError(e: unknown): string {
  const msg = (e as Error)?.message ?? '';
  if (/JWT|session|auth/i.test(msg)) return 'Votre session a expiré, reconnectez-vous.';
  if (/permission|row-level|administrateur/i.test(msg)) return "Accès réservé aux administrateurs.";
  if (/Failed to fetch|network/i.test(msg)) return 'Connexion interrompue, réessayez.';
  return msg || 'Une erreur est survenue.';
}

export function useNewsletterCampaigns() {
  return useQuery({
    queryKey: ['newsletter-campaigns'],
    queryFn: async (): Promise<NewsletterCampaign[]> => {
      const { data, error } = await db
        .from('newsletter_campaigns')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNewsletterCampaign(id?: string) {
  return useQuery({
    queryKey: ['newsletter-campaign', id],
    enabled: !!id,
    queryFn: async (): Promise<NewsletterCampaign | null> => {
      const { data, error } = await db.from('newsletter_campaigns').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useNewsletterMutations() {
  const qc = useQueryClient();
  const invalidate = (id?: string) => {
    qc.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
    if (id) qc.invalidateQueries({ queryKey: ['newsletter-campaign', id] });
  };

  const create = useMutation({
    mutationFn: async (payload: Partial<NewsletterCampaign>) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await db
        .from('newsletter_campaigns')
        .insert({ ...payload, created_by: auth.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as NewsletterCampaign;
    },
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(humanError(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<NewsletterCampaign> & { id: string }) => {
      const { data, error } = await db.from('newsletter_campaigns').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data as NewsletterCampaign;
    },
    onSuccess: (d) => invalidate(d.id),
    onError: (e) => toast.error(humanError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('newsletter_campaigns').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Campagne supprimée');
    },
    onError: (e) => toast.error(humanError(e)),
  });

  const duplicate = useMutation({
    mutationFn: async (c: NewsletterCampaign) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await db
        .from('newsletter_campaigns')
        .insert({
          nom: `${c.nom} (copie)`,
          univers: c.univers,
          objet: c.objet,
          preheader: c.preheader,
          from_name: c.from_name,
          from_email: c.from_email,
          reply_to: c.reply_to,
          blocks: c.blocks,
          audience: c.audience,
          created_by: auth.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as NewsletterCampaign;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Campagne dupliquée');
    },
    onError: (e) => toast.error(humanError(e)),
  });

  return { create, update, remove, duplicate };
}

export function useNewsletterAudience(univers: NewsletterUnivers) {
  return useQuery({
    queryKey: ['newsletter-audience', univers],
    staleTime: 60_000,
    queryFn: async (): Promise<AudienceRow[]> => {
      // PostgREST renvoie au maximum 1000 lignes : on pagine pour compter tout le monde.
      const rows: AudienceRow[] = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db
          .rpc('get_newsletter_audience', { _univers: univers, _profile_ids: null })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const page = (data ?? []) as AudienceRow[];
        rows.push(...page);
        if (page.length < PAGE) break;
      }
      return rows;
    },
  });
}

export function useCampaignKpis(campaignId?: string) {
  return useQuery({
    queryKey: ['newsletter-kpis', campaignId],
    enabled: !!campaignId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<CampaignKpis> => {
      const { data, error } = await db.rpc('get_newsletter_campaign_kpis', { _campaign_id: campaignId });
      if (error) throw error;
      return data as CampaignKpis;
    },
  });
}

export function useCampaignRecipients(campaignId?: string) {
  return useQuery({
    queryKey: ['newsletter-recipients', campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await db
        .from('newsletter_recipients')
        .select('id, email, nom, statut, sent_at, opened_at, clicked_at, open_count, click_count, error')
        .eq('campaign_id', campaignId)
        .order('opened_at', { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Envoi (test ou réel) via la fonction sécurisée. */
export type SendResult = {
  ok: boolean;
  sent: number;
  failed: number;
  /** Adresse d'expéditeur réellement utilisée par Resend. */
  from?: string;
  messageIds?: string[];
  failures?: Array<{ email: string; error: string }>;
};

/** Statut de livraison lu chez Resend pour un message déjà envoyé. */
export type DeliveryStatus = {
  id: string;
  to?: string;
  /** Événement Resend brut : sent, delivered, delivery_delayed, bounced, complained, opened, clicked. */
  lastEvent?: string;
  error?: string;
};

/** Relit le statut de livraison des messages d'un test (action « status »). */
export function useDeliveryStatus() {
  return useMutation({
    mutationFn: async (vars: { messageIds: string[] }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Votre session a expiré, reconnectez-vous.');

      const { data, error } = await supabase.functions.invoke('newsletter-send', {
        body: { action: 'status', messageIds: vars.messageIds },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) {
        let detail = error.message;
        try {
          const ctx = (error as any).context;
          if (ctx?.text) {
            const body = await ctx.text();
            const parsed = JSON.parse(body);
            detail = parsed.error || parsed.details || body;
          }
        } catch {
          /* on garde le message initial */
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return (data?.statuses ?? []) as DeliveryStatus[];
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

export function useSendNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { campaignId: string; test?: boolean; testEmails?: string[] }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Votre session a expiré, reconnectez-vous.');

      const { data, error } = await supabase.functions.invoke('newsletter-send', {
        body: vars,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) {
        let detail = error.message;
        try {
          const ctx = (error as any).context;
          if (ctx?.text) {
            const body = await ctx.text();
            const parsed = JSON.parse(body);
            detail = parsed.error || parsed.details || body;
          }
        } catch {
          /* on garde le message initial */
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return data as SendResult;
    },
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ['newsletter-campaign', vars.campaignId] });
      qc.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      qc.invalidateQueries({ queryKey: ['newsletter-kpis', vars.campaignId] });
      qc.invalidateQueries({ queryKey: ['newsletter-recipients', vars.campaignId] });
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

/** Étiquettes d'univers posées à la main. */
export function useAudienceTags() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['newsletter-audience-tags'],
    queryFn: async () => {
      const { data, error } = await db.from('newsletter_audience_tags').select('profile_id, univers');
      if (error) throw error;
      return (data ?? []) as Array<{ profile_id: string; univers: string }>;
    },
  });

  const toggle = useMutation({
    mutationFn: async (vars: { profileId: string; univers: string; active: boolean }) => {
      if (vars.active) {
        const { data: auth } = await supabase.auth.getUser();
        const { error } = await db
          .from('newsletter_audience_tags')
          .upsert(
            { profile_id: vars.profileId, univers: vars.univers, created_by: auth.user?.id ?? null },
            { onConflict: 'profile_id,univers' },
          );
        if (error) throw error;
      } else {
        const { error } = await db
          .from('newsletter_audience_tags')
          .delete()
          .eq('profile_id', vars.profileId)
          .eq('univers', vars.univers);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter-audience-tags'] });
      qc.invalidateQueries({ queryKey: ['newsletter-audience'] });
    },
    onError: (e) => toast.error(humanError(e)),
  });

  return { ...query, toggle };
}
