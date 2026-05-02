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

export function useCommunityImpactAggregates() {
  return useQuery({
    queryKey: ['community-impact-aggregates'],
    queryFn: async (): Promise<CommunityImpactAggregates> => {
      const { data, error } = await supabase.rpc('get_community_impact_aggregates' as never);
      if (error) throw error;
      return data as unknown as CommunityImpactAggregates;
    },
    staleTime: 60_000,
  });
}
