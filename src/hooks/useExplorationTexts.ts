import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarcheTexte } from '@/hooks/useMarcheTextes';

export interface ExplorationText extends MarcheTexte {}

export const useExplorationTexts = (explorationId: string) => {
  return useQuery({
    queryKey: ['exploration-texts', explorationId],
    queryFn: async () => {
      if (!explorationId) return [] as ExplorationText[];

      const { data: em, error: emError } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);

      if (emError) throw emError;
      const marcheIds = (em || []).map((m) => m.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [] as ExplorationText[];

      const { data: textes, error } = await supabase
        .from('marche_textes')
        .select('*')
        .in('marche_id', marcheIds)
        .order('ordre', { ascending: true });

      if (error) throw error;
      return (textes || []) as ExplorationText[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationId,
  });
};
