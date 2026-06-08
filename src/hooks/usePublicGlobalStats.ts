import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicGlobalStats {
  especes_tracees: number;
  domaines: number;
  marches_organisees: number;
  marcheurs: number;
  observations_citoyennes: number;
  participations_validees: number;
  photos_collectees: number;
  computed_at: string;
}

/**
 * Source de vérité unique pour les chiffres clés affichés sur les pages publiques
 * (/agent-ia, /marches-du-vivant, fiche imprimable). RPC public — pas d'auth requise.
 */
export const usePublicGlobalStats = () => {
  return useQuery({
    queryKey: ['public-global-stats'],
    queryFn: async (): Promise<PublicGlobalStats> => {
      const { data, error } = await supabase.rpc('get_public_global_stats');
      if (error) throw error;
      return data as unknown as PublicGlobalStats;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: 'always',
    retry: 2,
  });
};
