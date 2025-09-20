import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useMarketDataSync = () => {
  const queryClient = useQueryClient();

  const invalidateMarketData = () => {
    // Invalider tous les caches liés aux marchés
    queryClient.invalidateQueries({ queryKey: ['marches-supabase'] });
    queryClient.invalidateQueries({ queryKey: ['marches-with-data'] });
    queryClient.invalidateQueries({ queryKey: ['data-collection-logs'] });
    queryClient.invalidateQueries({ queryKey: ['collection-timeline'] });
    queryClient.invalidateQueries({ queryKey: ['biodiversity-timeline'] });
    
    console.log('🔄 Cache des données de marchés invalidé');
  };

  const invalidateAudioData = (marcheId?: string) => {
    // Invalider tous les caches liés aux audios
    if (marcheId) {
      queryClient.invalidateQueries({ queryKey: ['audios-count', marcheId] });
      queryClient.invalidateQueries({ queryKey: ['existing-audio', marcheId] });
    }
    queryClient.invalidateQueries({ queryKey: ['audios-count'] });
    queryClient.invalidateQueries({ queryKey: ['existing-audio'] });
    
    console.log('🔄 Cache des données audio invalidé' + (marcheId ? ` pour marche ${marcheId}` : ''));
  };

  const invalidatePhotoData = (marcheId?: string) => {
    // Invalider tous les caches liés aux photos
    if (marcheId) {
      queryClient.invalidateQueries({ queryKey: ['photos-count', marcheId] });
      queryClient.invalidateQueries({ queryKey: ['existing-photos', marcheId] });
    }
    queryClient.invalidateQueries({ queryKey: ['photos-count'] });
    queryClient.invalidateQueries({ queryKey: ['existing-photos'] });
    
    console.log('🔄 Cache des données photo invalidé' + (marcheId ? ` pour marche ${marcheId}` : ''));
  };

  const refreshMarketData = async () => {
    try {
      toast.info('Actualisation des données en cours...');
      invalidateMarketData();
      
      // Attendre que les requêtes se relancent
      await queryClient.refetchQueries({ queryKey: ['marches-supabase'] });
      await queryClient.refetchQueries({ queryKey: ['marches-with-data'] });
      
      toast.success('Données actualisées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      toast.error('Erreur lors de l\'actualisation des données');
    }
  };

  return {
    invalidateMarketData,
    invalidateAudioData,
    invalidatePhotoData,
    refreshMarketData
  };
};