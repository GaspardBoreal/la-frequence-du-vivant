import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarcheTexte } from '@/hooks/useMarcheTextes';

export interface ExplorationTextOptimized extends MarcheTexte {
  marcheName: string;
  marcheOrdre: number;
  tags?: string[];
}

export const useExplorationTextsOptimized = (explorationSlug: string) => {
  return useQuery({
    queryKey: ['exploration-texts-optimized', explorationSlug],
    queryFn: async () => {
      if (!explorationSlug) return { exploration: null, texts: [] };

      // Get exploration and texts in parallel
      const [explorationResult, textsResult] = await Promise.all([
        supabase
          .from('explorations')
          .select('*')
          .eq('slug', explorationSlug)
          .single(),
        
        supabase
          .from('exploration_marches')
          .select(`
            marche_id,
            marches!inner(id, nom_marche, ville, ordre),
            marche_textes!inner(*)
          `)
          .eq('explorations!inner.slug', explorationSlug)
      ]);

      if (explorationResult.error) throw explorationResult.error;
      if (textsResult.error && textsResult.error.code !== 'PGRST116') {
        throw textsResult.error;
      }

      const exploration = explorationResult.data;
      
      // Flatten and enrich texts with marche info
      const enrichedTexts: ExplorationTextOptimized[] = [];
      
      if (textsResult.data) {
        textsResult.data.forEach((em: any) => {
          if (em.marche_textes && Array.isArray(em.marche_textes)) {
            em.marche_textes.forEach((texte: any) => {
              enrichedTexts.push({
                ...texte,
                marcheName: em.marches?.nom_marche || em.marches?.ville || 'Marche',
                marcheOrdre: em.marches?.ordre || 0,
              });
            });
          }
        });
      }

      // Sort texts by marche order then by text order
      enrichedTexts.sort((a, b) => {
        if (a.marcheOrdre !== b.marcheOrdre) {
          return a.marcheOrdre - b.marcheOrdre;
        }
        return (a.ordre || 0) - (b.ordre || 0);
      });

      return { exploration, texts: enrichedTexts };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationSlug,
  });
};