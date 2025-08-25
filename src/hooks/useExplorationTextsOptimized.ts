import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TextType } from '@/types/textTypes';

export interface ExplorationTextOptimized {
  id: string;
  marche_id: string;
  titre: string;
  contenu: string;
  type_texte: TextType;
  ordre: number | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
  marcheName: string;
  marcheOrdre: number;
  tags?: string[];
}

export const useExplorationTextsOptimized = (explorationSlug: string) => {
  return useQuery({
    queryKey: ['exploration-texts-optimized', explorationSlug],
    queryFn: async () => {
      if (!explorationSlug) return { exploration: null, texts: [] };

      console.log('🔍 Fetching exploration:', explorationSlug);

      // 1. Get exploration first
      const { data: exploration, error: explorationError } = await supabase
        .from('explorations')
        .select('*')
        .eq('slug', explorationSlug)
        .maybeSingle();

      if (explorationError) {
        console.error('❌ Exploration error:', explorationError);
        throw explorationError;
      }

      if (!exploration) {
        console.warn('⚠️ Exploration not found:', explorationSlug);
        return { exploration: null, texts: [] };
      }

      console.log('✅ Exploration found:', exploration.name);

      // 2. Get exploration marches
      const { data: explorationMarches, error: emError } = await supabase
        .from('exploration_marches')
        .select('marche_id, ordre')
        .eq('exploration_id', exploration.id);

      if (emError) {
        console.error('❌ Exploration marches error:', emError);
        throw emError;
      }

      const marcheIds = (explorationMarches || []).map(em => em.marche_id);
      console.log('📍 Found marche IDs:', marcheIds.length);

      if (marcheIds.length === 0) {
        return { exploration, texts: [] };
      }

      // 3. Get marches info
      const { data: marches, error: marchesError } = await supabase
        .from('marches')
        .select('id, nom_marche, ville')
        .in('id', marcheIds);

      if (marchesError) {
        console.error('❌ Marches error:', marchesError);
        throw marchesError;
      }

      // 4. Get texts for these marches
      const { data: textes, error: textesError } = await supabase
        .from('marche_textes')
        .select('*')
        .in('marche_id', marcheIds)
        .order('ordre', { ascending: true });

      if (textesError) {
        console.error('❌ Textes error:', textesError);
        throw textesError;
      }

      console.log('📚 Found texts:', textes?.length || 0);

      // 5. Enrich texts with marche info
      const marcheById = new Map((marches || []).map(m => [m.id, m]));
      const explorationMarcheByMarcheId = new Map(
        (explorationMarches || []).map(em => [em.marche_id, em])
      );

      const enrichedTexts: ExplorationTextOptimized[] = (textes || []).map(texte => {
        const marche = marcheById.get(texte.marche_id);
        const explorationMarche = explorationMarcheByMarcheId.get(texte.marche_id);
        
        return {
          id: texte.id,
          marche_id: texte.marche_id,
          titre: texte.titre,
          contenu: texte.contenu,
          type_texte: texte.type_texte as TextType,
          ordre: texte.ordre,
          metadata: texte.metadata as any,
          created_at: texte.created_at,
          updated_at: texte.updated_at,
          marcheName: marche?.nom_marche || marche?.ville || 'Marche',
          marcheOrdre: explorationMarche?.ordre || 0,
        };
      });

      // Sort by exploration marche order, then by text order
      enrichedTexts.sort((a, b) => {
        // First sort by marche order in exploration
        const marcheOrderA = a.marcheOrdre || 999;
        const marcheOrderB = b.marcheOrdre || 999;
        
        if (marcheOrderA !== marcheOrderB) {
          return marcheOrderA - marcheOrderB;
        }
        
        // Then sort by text order within marche
        const textOrderA = a.ordre || 999;
        const textOrderB = b.ordre || 999;
        
        if (textOrderA !== textOrderB) {
          return textOrderA - textOrderB;
        }
        
        // Finally sort by creation date as fallback
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      console.log('✨ Final enriched texts:', enrichedTexts.length);
      
      return { exploration, texts: enrichedTexts };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationSlug,
    refetchOnWindowFocus: false,
  });
};