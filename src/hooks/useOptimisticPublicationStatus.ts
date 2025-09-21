import { useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook optimisé pour les mises à jour de statut de publication avec :
 * - Updates optimistes instantanés
 * - Débouncing pour éviter les requêtes multiples
 * - Gestion d'erreurs avec rollback automatique
 * - Feedback utilisateur immédiat
 */
export const useOptimisticPublicationStatus = () => {
  const queryClient = useQueryClient();
  const debounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  const mutation = useMutation({
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
    
    onMutate: async ({ explorationId, marcheId, publicationStatus }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['exploration-marches', explorationId] });
      
      // Snapshot pour rollback
      const previousData = queryClient.getQueryData(['exploration-marches', explorationId]);
      
      // Update optimiste instantané
      queryClient.setQueryData(['exploration-marches', explorationId], (old: any) => {
        if (!old) return old;
        
        return old.map((marche: any) => 
          marche.marche_id === marcheId 
            ? { ...marche, publication_status: publicationStatus }
            : marche
        );
      });
      
      return { previousData };
    },
    
    onSuccess: () => {
      // Toast de succès discret
      toast.success('✓ Statut mis à jour', { 
        duration: 1500,
        position: 'bottom-right'
      });
    },
    
    onError: (error, variables, context) => {
      // Rollback automatique
      if (context?.previousData) {
        queryClient.setQueryData(['exploration-marches', variables.explorationId], context.previousData);
      }
      
      console.error('Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour', {
        duration: 3000,
        position: 'bottom-right'
      });
    },
    
    onSettled: (data, error, variables) => {
      // Nettoyage du débounce
      const key = `${variables.explorationId}-${variables.marcheId}`;
      if (debounceRef.current[key]) {
        clearTimeout(debounceRef.current[key]);
        delete debounceRef.current[key];
      }
      
      // Refetch seulement en cas d'erreur
      if (error) {
        queryClient.invalidateQueries({ 
          queryKey: ['exploration-marches', variables.explorationId] 
        });
      }
    }
  });
  
  // Fonction debouncée pour éviter les clics multiples rapides
  const updateStatusDebounced = useCallback((
    explorationId: string, 
    marcheId: string, 
    publicationStatus: 'published_public' | 'published_readers' | 'draft'
  ) => {
    const key = `${explorationId}-${marcheId}`;
    
    // Annuler le timer précédent
    if (debounceRef.current[key]) {
      clearTimeout(debounceRef.current[key]);
    }
    
    // Créer nouveau timer avec délai minimal
    debounceRef.current[key] = setTimeout(() => {
      mutation.mutate({ explorationId, marcheId, publicationStatus });
    }, 100); // 100ms de débounce
    
  }, [mutation]);
  
  return {
    updateStatus: updateStatusDebounced,
    isLoading: mutation.isPending,
    error: mutation.error
  };
};