import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook pour récupérer les marches d'une exploration selon leur statut de publication
export const useExplorationMarchesByStatus = (explorationId: string, readersMode: boolean = false) => {
  return useQuery({
    queryKey: ['exploration-marches-by-status', explorationId, readersMode],
    queryFn: async () => {
      if (!explorationId) return [];
      
      const { data, error } = await supabase
        .rpc('get_exploration_marches_by_status', {
          exploration_id_param: explorationId,
          include_drafts: !readersMode, // En mode lecteurs, ne pas inclure les brouillons
          readers_mode: readersMode
        });
      
      if (error) {
        console.error('Erreur lors de la récupération des marches par statut:', error);
        throw error;
      }

      // Enrichir avec les données complètes des marches
      if (data && data.length > 0) {
        const marcheIds = data.map((em: any) => em.marche_id);
        
        const { data: marchesData, error: marchesError } = await supabase
          .from('marches')
          .select(`
            *,
            photos:marche_photos(id, nom_fichier, url_supabase, titre, description, ordre),
            audio:marche_audio(id, nom_fichier, url_supabase, titre, description, duree_secondes, ordre)
          `)
          .in('id', marcheIds);

        if (marchesError) {
          console.error('Erreur lors de la récupération des données des marches:', marchesError);
          throw marchesError;
        }

        // Combiner les données
        return data.map((em: any) => ({
          ...em,
          marche: marchesData?.find(m => m.id === em.marche_id)
        }));
      }
      
      return data || [];
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};