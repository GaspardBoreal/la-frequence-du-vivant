import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityImpactAggregates {
  total: number;
  with_gender: number;
  with_csp: number;
  with_birthdate: number;
  territories_count: number;
  by_age: Record<string, number>;
  by_gender: Record<string, number>;
  by_csp: Record<string, number>;
  by_role: Record<string, number>;
  csp_x_age: { csp: string; bracket: string; count: number }[];
  top_cities: { ville: string; count: number }[];
}

/**
 * Agrégats d'impact (admin uniquement, RPC gardée).
 * - Sans paramètre → agrégats globaux.
 * - Avec `eventId` → limités aux participant·e·s d'un événement.
 */
export function useCommunityImpactAggregates(eventId?: string | null) {
  return useQuery({
    queryKey: ['community-impact-aggregates', eventId ?? 'all'],
    queryFn: async (): Promise<CommunityImpactAggregates> => {
      const { data, error } = await supabase.rpc(
        'get_community_impact_aggregates_scoped' as never,
        { p_event_id: eventId ?? null } as never,
      );
      if (error) throw error;
      return data as unknown as CommunityImpactAggregates;
    },
    staleTime: 60_000,
  });
}

/**
 * Agrégats d'impact pour les marcheur·euse·s d'une exploration donnée.
 * Accessible aux utilisateurs connectés (RPC anonymisée — agrégats uniquement).
 */
export function useCommunityImpactAggregatesByExploration(explorationId?: string | null) {
  return useQuery({
    queryKey: ['community-impact-aggregates-by-exploration', explorationId],
    queryFn: async (): Promise<CommunityImpactAggregates> => {
      const { data, error } = await supabase.rpc(
        'get_community_impact_aggregates_by_exploration' as never,
        { p_exploration_id: explorationId } as never,
      );
      if (error) throw error;
      return data as unknown as CommunityImpactAggregates;
    },
    enabled: !!explorationId,
    staleTime: 60_000,
  });
}
