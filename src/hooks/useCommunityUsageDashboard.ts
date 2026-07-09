import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UsageKpis {
  total_users: number;
  dau_7d: number;
  wau_30d: number;
  mau_90d: number;
  with_participation: number;
  returning: number;
  contributors: number;
  adherents: number;
  avg_events_30d: number;
  avg_contribs: number;
}

export interface UsageBubblePoint {
  user_id: string;
  name: string;
  x: number; // recency 0..90
  y: number; // events_30d
  z: number; // bubble size
  persona: string;
  contribs: number;
  participations: number;
  role: string | null;
}

export interface UsagePersonaMember {
  user_id: string;
  profile_id: string;
  prenom: string | null;
  nom: string | null;
  ville: string | null;
  role: string | null;
  slug: string | null;
  avatar_url: string | null;
  events_30d: number;
  contrib_count: number;
  participations: number;
  days_since_active: number;
  last_seen_at: string | null;
  signup_at: string;
  is_adherent: boolean;
}

export interface UsageHeatmapCell { dow: number; hour: number; count: number }
export interface UsageRadarCell { persona: string; feature: string; count: number }
export interface UsageFunnel {
  inscrits: number;
  actifs_30d: number;
  participants: number;
  fideles: number;
  contributeurs: number;
  adherents: number;
}
export interface UsageCity { ville: string; count: number }
export interface UsageDailyPoint { day: string; active_users: number }

export interface UsageDashboardPayload {
  kpis: UsageKpis;
  personas: { key: string; count: number }[];
  persona_members: Record<string, UsagePersonaMember[]>;
  bubble: UsageBubblePoint[];
  heatmap: UsageHeatmapCell[];
  radar: UsageRadarCell[];
  funnel: UsageFunnel;
  top_cities: UsageCity[];
  daily: UsageDailyPoint[];
  range: { from: string; to: string };
  generated_at: string;
}

const emptyKpis: UsageKpis = {
  total_users: 0,
  dau_7d: 0,
  wau_30d: 0,
  mau_90d: 0,
  with_participation: 0,
  returning: 0,
  contributors: 0,
  adherents: 0,
  avg_events_30d: 0,
  avg_contribs: 0,
};

const emptyFunnel: UsageFunnel = {
  inscrits: 0,
  actifs_30d: 0,
  participants: 0,
  fideles: 0,
  contributeurs: 0,
  adherents: 0,
};

function getUsageDashboardErrorMessage(error: { message?: string; details?: string | null; code?: string | null }) {
  const rawMessage = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();

  if (rawMessage.includes('not_authenticated') || rawMessage.includes('jwt')) {
    return 'Session expirée : reconnectez-vous pour consulter les usages.';
  }

  if (rawMessage.includes('not_admin') || rawMessage.includes('unauthorized') || rawMessage.includes('forbidden')) {
    return 'Accès réservé aux administrateurs de la communauté.';
  }

  return 'Impossible de charger les données d’usage pour le moment.';
}

function normalizeUsageDashboardPayload(payload: Partial<UsageDashboardPayload>): UsageDashboardPayload {
  return {
    kpis: { ...emptyKpis, ...(payload.kpis ?? {}) },
    personas: payload.personas ?? [],
    persona_members: payload.persona_members ?? {},
    bubble: payload.bubble ?? [],
    heatmap: payload.heatmap ?? [],
    radar: payload.radar ?? [],
    funnel: { ...emptyFunnel, ...(payload.funnel ?? {}) },
    top_cities: payload.top_cities ?? [],
    daily: payload.daily ?? [],
    range: payload.range ?? { from: '', to: '' },
    generated_at: payload.generated_at ?? new Date().toISOString(),
  };
}

export function useCommunityUsageDashboard(days = 90) {
  return useQuery({
    queryKey: ['community-usage-dashboard', days],
    queryFn: async (): Promise<UsageDashboardPayload> => {
      const to = new Date();
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
      const { data, error } = await supabase.rpc(
        'get_community_usage_dashboard' as never,
        { p_from: from.toISOString(), p_to: to.toISOString() } as never,
      );
      if (error) {
        console.error('[get_community_usage_dashboard] RPC error', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(getUsageDashboardErrorMessage(error));
      }

      if (!data) {
        throw new Error('La requête d’usage n’a retourné aucune réponse exploitable.');
      }

      return normalizeUsageDashboardPayload(data as unknown as Partial<UsageDashboardPayload>);
    },
    staleTime: 5 * 60 * 1000,
  });
}
