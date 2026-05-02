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
 * Agrégats d'impact des marcheur·euse·s.
 * - Sans paramètre → agrégats globaux (toute la communauté).
 * - Avec `eventId` → agrégats limités aux participant·e·s de cet événement.
 *
 * Utilise la RPC `get_community_impact_aggregates_scoped(p_event_id)` qui,
 * appelée avec `null`, renvoie le même résultat que l'ancienne RPC globale.
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
