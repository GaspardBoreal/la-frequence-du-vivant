import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook pour ajouter une marche à une exploration
export const useAddMarcheToExploration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ explorationId, marcheId, ordre, publicationStatus = 'published_public' }: {
      explorationId: string;
      marcheId: string;
      ordre?: number;
      publicationStatus?: 'published_public' | 'published_readers' | 'draft';
    }) => {
      const { data, error } = await supabase
        .from('exploration_marches')
        .insert({
          exploration_id: explorationId,
          marche_id: marcheId,
          ordre,
          publication_status: publicationStatus
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-marches', variables.explorationId] });
      toast.success('Marche ajoutée à l\'exploration');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'ajout de la marche:', error);
      toast.error('Erreur lors de l\'ajout de la marche');
    }
  });
};

// Hook pour supprimer une marche d'une exploration
export const useRemoveMarcheFromExploration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ explorationId, marcheId }: {
      explorationId: string;
      marcheId: string;
    }) => {
      const { error } = await supabase
        .from('exploration_marches')
        .delete()
        .eq('exploration_id', explorationId)
        .eq('marche_id', marcheId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-marches', variables.explorationId] });
      toast.success('Marche supprimée de l\'exploration');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression de la marche:', error);
      toast.error('Erreur lors de la suppression de la marche');
    }
  });
};

// Hook pour réorganiser les marches d'une exploration
export const useReorderExplorationMarches = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ explorationId, marcheOrders }: {
      explorationId: string;
      marcheOrders: { marcheId: string; ordre: number }[];
    }) => {
      // Mise à jour de l'ordre de toutes les marches en une seule transaction
      const updates = marcheOrders.map(async ({ marcheId, ordre }) => {
        const { error } = await supabase
          .from('exploration_marches')
          .update({ ordre })
          .eq('exploration_id', explorationId)
          .eq('marche_id', marcheId);
        
        if (error) throw error;
      });
      
      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-marches', variables.explorationId] });
      toast.success('Ordre des marches mis à jour');
    },
    onError: (error) => {
      console.error('Erreur lors de la réorganisation:', error);
      toast.error('Erreur lors de la réorganisation des marches');
    }
  });
};

// Hook optimisé pour mettre à jour le statut de publication d'une marche
export const useUpdateMarchePublicationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ explorationId, marcheId, publicationStatus }: {
      explorationId: string;
      marcheId: string;
      publicationStatus: 'published_public' | 'published_readers' | 'draft';
    }) => {
      const { error } = await supabase
        .from('exploration_marches')
        .update({ publication_status: publicationStatus })
        .eq('exploration_id', explorationId)
        .eq('marche_id', marcheId);
      
      if (error) throw error;
      return { explorationId, marcheId, publicationStatus };
    },
    // Update optimiste : mise à jour immédiate du cache
    onMutate: async ({ explorationId, marcheId, publicationStatus }) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ['exploration-marches', explorationId] });
      
      // Snapshot de l'état précédent pour le rollback
      const previousData = queryClient.getQueryData(['exploration-marches', explorationId]);
      
      // Update optimiste du cache
      queryClient.setQueryData(['exploration-marches', explorationId], (old: any) => {
        if (!old) return old;
        
        return old.map((marche: any) => 
          marche.marche_id === marcheId 
            ? { ...marche, publication_status: publicationStatus }
            : marche
        );
      });
      
      // Toast immédiat pour feedback utilisateur
      toast.info('Mise à jour en cours...', { duration: 1000 });
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Statut de publication mis à jour', { duration: 2000 });
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousData) {
        queryClient.setQueryData(['exploration-marches', variables.explorationId], context.previousData);
      }
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    },
    // Finalisation : on peut refetch si nécessaire, mais généralement pas besoin
    onSettled: (data, error, variables) => {
      // Refetch seulement en cas d'erreur pour s'assurer de la cohérence
      if (error) {
        queryClient.invalidateQueries({ queryKey: ['exploration-marches', variables.explorationId] });
      }
    }
  });
};

// Hook pour mettre à jour en lot le statut de publication
export const useBatchUpdatePublicationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ explorationId, marcheIds, publicationStatus }: {
      explorationId: string;
      marcheIds: string[];
      publicationStatus: 'published_public' | 'published_readers' | 'draft';
    }) => {
      const { error } = await supabase
        .from('exploration_marches')
        .update({ publication_status: publicationStatus })
        .eq('exploration_id', explorationId)
        .in('marche_id', marcheIds);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-marches', variables.explorationId] });
      toast.success(`${variables.marcheIds.length} marche(s) mises à jour`);
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour en lot:', error);
      toast.error('Erreur lors de la mise à jour en lot');
    }
  });
};

// Hook pour récupérer les marches disponibles (non assignées à une exploration)
export const useAvailableMarches = (explorationId?: string) => {
  return {
    queryKey: ['available-marches', explorationId],
    queryFn: async () => {
      if (!explorationId) return [];
      
      // Récupérer toutes les marches
      const { data: allMarches, error: allMarchesError } = await supabase
        .from('marches')
        .select('id, ville, nom_marche, date, descriptif_court, latitude, longitude')
        .order('ville');
      
      if (allMarchesError) throw allMarchesError;
      
      // Récupérer les marches déjà assignées à cette exploration
      const { data: assignedMarches, error: assignedError } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);
      
      if (assignedError) throw assignedError;
      
      const assignedIds = new Set(assignedMarches?.map(em => em.marche_id) || []);
      
      // Filtrer les marches disponibles
      return allMarches?.filter(marche => !assignedIds.has(marche.id)) || [];
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
  };
};