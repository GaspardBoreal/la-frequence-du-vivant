import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { transformSupabaseToLegacyFormat } from '@/utils/supabaseDataTransformer';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';

const DORDOGNE_SLUG = 'remontee-dordogne-atlas-eaux-vivantes-2025-2045';

interface ExplorationMarche extends MarcheTechnoSensible {
  ordre: number;
}

export const useExplorationMarchesList = () => {
  return useQuery({
    queryKey: ['exploration-marches-list', DORDOGNE_SLUG],
    queryFn: async (): Promise<ExplorationMarche[]> => {
      // 1. Récupérer l'exploration par son slug
      const { data: exploration, error: explorationError } = await supabase
        .from('explorations')
        .select('id')
        .eq('slug', DORDOGNE_SLUG)
        .single();

      if (explorationError || !exploration) {
        console.error('Exploration non trouvée:', explorationError);
        return [];
      }

      // 2. Récupérer les marches associées avec leur ordre
      const { data: explorationMarches, error: marchesError } = await supabase
        .from('exploration_marches')
        .select(`
          ordre,
          marche_id,
          marches!inner (
            id,
            ville,
            nom_marche,
            date,
            adresse,
            departement,
            region,
            descriptif_court,
            descriptif_long,
            latitude,
            longitude,
            theme_principal,
            sous_themes,
            temperature,
            lien_google_drive
          )
        `)
        .eq('exploration_id', exploration.id)
        .order('ordre', { ascending: true });

      if (marchesError) {
        console.error('Erreur récupération marches exploration:', marchesError);
        return [];
      }

      // 3. Transformer au format MarcheTechnoSensible avec ordre
      const transformedMarches: ExplorationMarche[] = (explorationMarches || []).map((em: any) => {
        const marche = em.marches;
        const transformed = transformSupabaseToLegacyFormat({
          ...marche,
          photos: [],
          audio: [],
          videos: [],
          documents: [],
          etudes: [],
          textes: [],
          tags: []
        });
        
        return {
          ...transformed,
          ordre: em.ordre ?? 0
        };
      });

      return transformedMarches;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
};

export type { ExplorationMarche };
