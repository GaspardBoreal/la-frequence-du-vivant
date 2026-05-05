import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';

/**
 * Liste de toutes les marches publiées d'une exploration, avec coordonnées.
 * Utilisée comme fond de carte dans le modal espèce (points gris des marches sans
 * observation de l'espèce courante).
 */
export function useExplorationAllMarches(explorationId?: string) {
  return useQuery({
    queryKey: ['exploration-all-marches', explorationId],
    queryFn: async (): Promise<SpeciesMarcheData[]> => {
      if (!explorationId) return [];
      const { data } = await supabase
        .from('exploration_marches')
        .select(`ordre, marche_id, marches (id, nom_marche, ville, latitude, longitude)`)
        .eq('exploration_id', explorationId)
        .in('publication_status', ['published', 'published_public']);
      if (!data) return [];
      return data
        .map((em: any) => ({
          marcheId: em.marche_id,
          marcheName: em.marches?.nom_marche || em.marches?.ville || '',
          ville: em.marches?.ville || '',
          order: em.ordre ?? 0,
          observationCount: 0,
          latitude: em.marches?.latitude,
          longitude: em.marches?.longitude,
        }))
        .sort((a, b) => a.order - b.order);
    },
    enabled: !!explorationId,
    staleTime: 1000 * 60 * 30,
  });
}
