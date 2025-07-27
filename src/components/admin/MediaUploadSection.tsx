
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, X, Plus, Trash2, Zap, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { processPhoto, isSupportedPhotoFormat, formatFileSize } from '../../utils/photoUtils';
import { 
  fetchExistingPhotos, 
  deletePhoto, 
  updatePhotoMetadata,
  PhotoToUpload,
  ExistingPhoto
} from '../../utils/supabasePhotoOperations';
import { uploadVideo } from '../../utils/supabaseUpload';
import { ParallelUploadManager, UploadTask } from '../../utils/parallelUploadManager';
import { ImageOptimizer } from '../../utils/imageOptimizer';
import { UploadCache } from '../../utils/uploadCache';
import PhotoCard from './PhotoCard';
import OptimizedUploadProgress from './OptimizedUploadProgress';

interface MediaUploadSectionProps {
  marcheId: string | null;
  mediaType: 'photos' | 'videos';
}

interface MediaItem {
  id: string;
  file?: File;
  url: string;
  name: string;
  size: number;
  uploaded: boolean;
  isExisting?: boolean;
  metadata?: any;
  titre?: string;
  description?: string;
  isOptimized?: boolean;
  optimizationInfo?: {
    originalSize: number;
    compressionRatio: number;
    wasConverted: boolean;
  };
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  marcheId,
  mediaType
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [uploadManager] = useState(() => new ParallelUploadManager({
    maxConcurrent: 3,
    retryAttempts: 3,
    retryDelay: 1000
  }));
  const [imageOptimizer] = useState(() => new ImageOptimizer());
  const [uploadCache] = useState(() => new UploadCache());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les photos existantes au montage
  useEffect(() => {
    if (marcheId && mediaType === 'photos') {
      loadExistingPhotos();
    }
  }, [marcheId, mediaType]);

  // Nettoyer le cache au montage
  useEffect(() => {
    uploadCache.cleanExpiredEntries();
  }, [uploadCache]);

  // Configurer le gestionnaire de progression
  useEffect(() => {
    uploadManager.onProgress(setUploadTasks);
  }, [uploadManager]);

  const loadExistingPhotos = async () => {
    if (!marcheId) return;
    
    console.log('🔄 [MediaUploadSection] Chargement des photos existantes...');
    setIsLoading(true);
    try {
      const existingPhotos = await fetchExistingPhotos(marcheId);
      
      const formattedPhotos: MediaItem[] = existingPhotos.map(photo => ({
        id: photo.id,
        url: photo.url_supabase,
        name: photo.nom_fichier,
        size: 0,
        uploaded: true,
        isExisting: true,
        metadata: photo.metadata,
        titre: photo.titre,
        description: photo.description
      }));

      setMediaItems(formattedPhotos);
      console.log(`✅ [MediaUploadSection] ${formattedPhotos.length} photos existantes chargées`);
    } catch (error) {
      console.error('❌ [MediaUploadSection] Erreur chargement photos:', error);
      toast.error('Erreur lors du chargement des photos existantes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFiles = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessing(true);
    console.log(`📁 [MediaUploadSection] Traitement optimisé de ${files.length} fichier(s)`);

    try {
      if (mediaType === 'photos') {
        // Filtrer les fichiers supportés
        const supportedFiles = Array.from(files).filter(file => {
          if (!isSupportedPhotoFormat(file)) {
            toast.error(`Format non supporté: ${file.name}`);
            return false;
          }
          return true;
        });

        if (supportedFiles.length === 0) {
          toast.error('Aucun fichier supporté trouvé');
          return;
        }

        // Vérifier le cache pour éviter les doublons
        const newFilesToProcess: File[] = [];
        const cachedItems: MediaItem[] = [];

        for (const file of supportedFiles) {
          if (marcheId) {
            const cached = await uploadCache.checkCache(file, marcheId);
            if (cached) {
              console.log(`💾 [MediaUploadSection] Fichier trouvé dans le cache: ${file.name}`);
              cachedItems.push({
                id: cached.photoId,
                url: cached.uploadedUrl,
                name: cached.fileName,
                size: cached.fileSize,
                uploaded: true,
                isExisting: true
              });
              continue;
            }
          }
          newFilesToProcess.push(file);
        }

        // Optimiser les nouvelles images
        let optimizedImages: any[] = [];
        if (newFilesToProcess.length > 0) {
          console.log(`🔧 [MediaUploadSection] Optimisation de ${newFilesToProcess.length} images...`);
          optimizedImages = await imageOptimizer.optimizeImages(newFilesToProcess);
        }

        // Créer les items pour les nouvelles images
        const newItems: MediaItem[] = [];
        
        for (const optimized of optimizedImages) {
          const processedPhoto = await processPhoto(optimized.file);
          
          const newItem: MediaItem = {
            id: Math.random().toString(36).substr(2, 9),
            file: processedPhoto.file,
            url: processedPhoto.preview,
            name: optimized.file.name,
            size: optimized.file.size,
            uploaded: false,
            metadata: processedPhoto.metadata,
            isOptimized: true,
            titre: '',
            description: '',
            optimizationInfo: {
              originalSize: optimized.originalSize,
              compressionRatio: optimized.compressionRatio,
              wasConverted: optimized.wasConverted
            }
          };
          
          newItems.push(newItem);
        }

        // Mettre à jour la liste avec les nouveaux items et les items cachés
        setMediaItems(prev => [...prev, ...newItems, ...cachedItems]);
        
        const totalAdded = newItems.length + cachedItems.length;
        if (totalAdded > 0) {
          toast.success(`${totalAdded} fichier(s) ajouté(s) (${cachedItems.length} depuis le cache)`);
        }

      } else {
        // Traitement simple pour les vidéos
        const newItems: MediaItem[] = [];
        
        for (const file of Array.from(files)) {
          const newItem: MediaItem = {
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            uploaded: false,
            titre: '',
            description: ''
          };
          newItems.push(newItem);
        }

        setMediaItems(prev => [...prev, ...newItems]);
        toast.success(`${newItems.length} vidéo(s) ajoutée(s)`);
      }
    } catch (error) {
      console.error('❌ [MediaUploadSection] Erreur traitement fichiers:', error);
      toast.error('Erreur lors du traitement des fichiers');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleOptimizedUpload = async () => {
    if (!marcheId) {
      toast.error('Aucun ID de marche fourni');
      return;
    }

    const itemsToUpload = mediaItems.filter(item => !item.uploaded && item.file);
    if (itemsToUpload.length === 0) {
      toast.info('Aucun fichier à uploader');
      return;
    }

    console.log(`🚀 [MediaUploadSection] Upload parallèle de ${itemsToUpload.length} fichiers`);
    
    try {
      if (mediaType === 'photos') {
        // Préparer les photos pour l'upload parallèle avec métadonnées
        const photosData: PhotoToUpload[] = itemsToUpload.map(item => ({
          id: item.id,
          file: item.file!,
          metadata: item.metadata,
          thumbnail: item.url,
          preview: item.url,
          uploaded: false,
          titre: item.titre || '',
          description: item.description || ''
        }));

        // Nettoyer et ajouter les tâches
        uploadManager.clear();
        uploadManager.addPhotos(marcheId, photosData);
        
        // Démarrer l'upload parallèle
        const uploadedIds = await uploadManager.startUpload();
        
        // Mettre à jour le cache pour les uploads réussis
        for (const item of itemsToUpload) {
          const wasUploaded = uploadedIds.length > 0;
          if (wasUploaded && item.file) {
            await uploadCache.addToCache(item.file, marcheId, item.url, item.id);
          }
        }

        // Marquer les photos comme uploadées
        setMediaItems(prev => prev.map(media => 
          itemsToUpload.find(item => item.id === media.id) ? { 
            ...media, 
            uploaded: true 
          } : media
        ));
        
        toast.success(`${uploadedIds.length} photo(s) uploadée(s) avec succès !`);
      } else {
        // Upload séquentiel pour les vidéos
        for (const item of itemsToUpload) {
          await uploadVideo(item.file!, marcheId);
        }
        
        setMediaItems(prev => prev.map(media => ({ ...media, uploaded: true })));
        toast.success('Toutes les vidéos ont été uploadées !');
      }
    } catch (error) {
      console.error('❌ [MediaUploadSection] Erreur upload optimisé:', error);
      toast.error('Erreur lors de l\'upload: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  const handleRemove = async (itemId: string) => {
    const item = mediaItems.find(m => m.id === itemId);
    if (!item) return;

    if (item.isExisting) {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette photo ?')) {
        return;
      }

      console.log('🗑️ [MediaUploadSection] Suppression photo existante:', itemId);
      
      try {
        const loadingToast = toast.loading('Suppression en cours...');
        
        await deletePhoto(itemId);
        
        toast.dismiss(loadingToast);
        setMediaItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Photo supprimée avec succès');
        console.log('✅ [MediaUploadSection] Photo supprimée de la liste');
      } catch (error) {
        console.error('❌ [MediaUploadSection] Erreur suppression:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`Erreur lors de la suppression: ${errorMessage}`);
      }
    } else {
      // Suppression simple pour les fichiers non uploadés
      setMediaItems(prev => prev.filter(item => item.id !== itemId));
      toast.info('Fichier retiré de la liste');
    }
  };

  const handleUpdateMetadata = async (itemId: string, updates: { titre?: string; description?: string }) => {
    const item = mediaItems.find(m => m.id === itemId);
    if (!item) return;

    console.log(`📝 [MediaUploadSection] Mise à jour métadonnées pour ${itemId}:`, updates);

    try {
      // Si c'est une photo existante, la mettre à jour dans Supabase
      if (item.isExisting) {
        await updatePhotoMetadata(itemId, updates);
        toast.success('Métadonnées mises à jour');
      } else {
        // Si c'est une nouvelle photo, juste mettre à jour localement
        console.log('📝 [MediaUploadSection] Mise à jour locale pour nouvelle photo');
      }
      
      // Mettre à jour localement dans tous les cas
      setMediaItems(prev => prev.map(media => 
        media.id === itemId ? { ...media, ...updates } : media
      ));
      
      if (!item.isExisting) {
        toast.success('Métadonnées ajoutées (seront sauvegardées lors de l\'upload)');
      }
    } catch (error) {
      console.error('❌ [MediaUploadSection] Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleClearAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (mediaItems.length === 0) return;
    
    const hasUnsavedFiles = mediaItems.some(item => !item.uploaded && !item.isExisting);
    
    if (hasUnsavedFiles) {
      if (!window.confirm('Vous avez des fichiers non sauvegardés. Êtes-vous sûr de vouloir tout supprimer ?')) {
        return;
      }
    }
    
    setMediaItems([]);
    uploadManager.clear();
    toast.info('Tous les fichiers ont été supprimés de la liste');
  };

  const getGlobalStatus = () => {
    if (uploadTasks.length === 0) {
      return { total: 0, pending: 0, uploading: 0, success: 0, error: 0 };
    }
    return uploadManager.getStatus();
  };

  const getCacheStats = () => {
    return uploadCache.getStats();
  };

  const mediaTypeLabel = mediaType === 'photos' ? 'Photos' : 'Vidéos';
  const acceptedTypes = mediaType === 'photos' ? 'image/*,.heic,.heif' : 'video/*';
  const hasUnsavedFiles = mediaItems.some(item => !item.uploaded);
  const cacheStats = getCacheStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2">Chargement des {mediaTypeLabel.toLowerCase()}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium">Gestion Optimisée des {mediaTypeLabel}</h3>
          <Zap className="h-5 w-5 text-blue-500" />
          {cacheStats.total > 0 && (
            <span className="text-sm text-gray-500">
              ({cacheStats.total} en cache)
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={handleAddFiles}
            variant="outline"
            className="flex items-center"
            disabled={isProcessing}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isProcessing ? 'Optimisation...' : `Ajouter ${mediaTypeLabel.toLowerCase()}`}
          </Button>
          {hasUnsavedFiles && (
            <Button
              type="button"
              onClick={handleOptimizedUpload}
              disabled={!marcheId || isProcessing}
              className="flex items-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              Upload Parallèle
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!marcheId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Sauvegardez d'abord les informations de base de la marche pour pouvoir ajouter des {mediaTypeLabel.toLowerCase()}.
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
            <p className="text-blue-800">Optimisation des fichiers en cours...</p>
          </div>
        </div>
      )}

      {/* Affichage de la progression d'upload */}
      {uploadTasks.length > 0 && (
        <OptimizedUploadProgress
          tasks={uploadTasks}
          globalStatus={getGlobalStatus()}
        />
      )}

      {mediaItems.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-white mb-2">
            Aucune {mediaType === 'photos' ? 'photo' : 'vidéo'} ajoutée
          </h4>
          <p className="mb-4 text-slate-200">
            Cliquez sur "Ajouter {mediaTypeLabel.toLowerCase()}" pour commencer
          </p>
          <p className="text-sm text-slate-300">
            ⚡ Upload parallèle • 🗜️ Compression automatique • 💾 Cache intelligent
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Grille des photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map(item => (
              <PhotoCard
                key={item.id}
                photo={item}
                onRemove={handleRemove}
                onUpdateMetadata={handleUpdateMetadata}
                showOptimizationInfo={item.isOptimized}
                optimizationInfo={item.optimizationInfo}
              />
            ))}
          </div>
        </div>
      )}

      {mediaItems.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-600">
            {mediaItems.length} {mediaType === 'photos' ? 'photo(s)' : 'vidéo(s)'} • {mediaItems.filter(item => item.uploaded).length} uploadée(s)
            {mediaItems.some(item => item.isOptimized) && ' • Optimisées'}
          </span>
          <div className="flex space-x-2">
            {cacheStats.total > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  uploadCache.clear();
                  toast.info('Cache vidé');
                }}
                className="text-gray-600 hover:text-gray-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Vider le cache
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700"
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Tout supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploadSection;
