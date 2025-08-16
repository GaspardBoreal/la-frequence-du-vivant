import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteCollectionLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('data_collection_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        throw new Error(`Failed to delete collection log: ${error.message}`);
      }
    },
    onSuccess: () => {
      // Invalider le cache des logs pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ['data-collection-logs'] });
      queryClient.invalidateQueries({ queryKey: ['collection-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['biodiversity-timeline'] });
      toast.success('Log supprimé avec succès');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression du log');
    },
  });
};

export const useDeleteAllFailedLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('data_collection_logs')
        .delete()
        .eq('status', 'failed');

      if (error) {
        throw new Error(`Failed to delete failed logs: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-collection-logs'] });
      queryClient.invalidateQueries({ queryKey: ['collection-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['biodiversity-timeline'] });
      toast.success('Tous les logs en échec ont été supprimés');
    },
    onError: (error) => {
      console.error('Delete failed logs error:', error);
      toast.error('Erreur lors de la suppression des logs en échec');
    },
  });
};