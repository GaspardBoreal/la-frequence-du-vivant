
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, X, Plus, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { processPhoto, isSupportedPhotoFormat, formatFileSize } from '../../utils/photoUtils';
import { 
  fetchExistingPhotos, 
  savePhoto, 
  savePhotos, 
  deletePhoto, 
  updatePhotoMetadata,
  PhotoToUpload 
} from '../../utils/supabasePhotoOperations';
import { uploadVideo } from '../../utils/supabaseUpload';
import PhotoCard from './PhotoCard';

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
  isConverted?: boolean;
  originalFormat?: string;
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  marcheId,
  mediaType
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les photos existantes au montage
  useEffect(() => {
    if (marcheId && mediaType === 'photos') {
      loadExistingPhotos();
    }
  }, [marcheId, mediaType]);

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

  // Fonction pour ouvrir le sélecteur de fichiers
  const handleAddFiles = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🎯 [MediaUploadSection] Ouverture du sélecteur de fichiers');
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessing(true);
    console.log(`📁 [MediaUploadSection] Traitement de ${files.length} fichier(s)`);

    const newItems: MediaItem[] = [];
    
    for (const file of Array.from(files)) {
      try {
        if (mediaType === 'photos') {
          // Vérifier le format
          if (!isSupportedPhotoFormat(file)) {
            console.error('❌ [MediaUploadSection] Format non supporté:', file.name);
            toast.error(`Format non supporté: ${file.name}`);
            continue;
          }

          console.log(`🔄 [MediaUploadSection] Traitement de la photo: ${file.name}`);
          
          // Traiter la photo
          const processedPhoto = await processPhoto(file);
          
          const newItem: MediaItem = {
            id: Math.random().toString(36).substr(2, 9),
            file: processedPhoto.file,
            url: processedPhoto.preview,
            name: file.name,
            size: processedPhoto.file.size,
            uploaded: false,
            metadata: processedPhoto.metadata,
            isConverted: processedPhoto.metadata.isConverted,
            originalFormat: processedPhoto.metadata.originalFormat
          };

          newItems.push(newItem);
          console.log(`✅ [MediaUploadSection] Photo traitée: ${file.name}`);
        } else {
          // Pour les vidéos, traitement simple
          const newItem: MediaItem = {
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            uploaded: false
          };

          newItems.push(newItem);
        }
      } catch (error) {
        console.error('❌ [MediaUploadSection] Erreur traitement fichier:', error);
        toast.error(`Erreur lors du traitement de ${file.name}`);
      }
    }

    setMediaItems(prev => [...prev, ...newItems]);
    
    if (newItems.length > 0) {
      toast.success(`${newItems.length} fichier(s) ajouté(s) avec succès`);
    }
    
    // Réinitialiser l'input file
    event.target.value = '';
    setIsProcessing(false);
  };

  const handleUpload = async (itemId: string) => {
    const item = mediaItems.find(m => m.id === itemId);
    if (!marcheId || !item || !item.file) {
      console.error('❌ [MediaUploadSection] Données manquantes pour upload:', { marcheId, item: !!item, file: !!item?.file });
      toast.error('Impossible d\'uploader: données manquantes');
      return;
    }

    console.log('📤 [MediaUploadSection] Début upload:', item.name);
    setIsUploading(true);
    
    try {
      if (mediaType === 'photos') {
        const photoData: PhotoToUpload = {
          id: item.id,
          file: item.file,
          metadata: item.metadata,
          thumbnail: item.url,
          preview: item.url,
          uploaded: false,
          titre: item.titre,
          description: item.description
        };

        console.log('📋 [MediaUploadSection] Données photo préparées:', photoData);
        const photoId = await savePhoto(marcheId, photoData);
        console.log('✅ [MediaUploadSection] Photo sauvegardée avec ID:', photoId);
      } else {
        await uploadVideo(item.file, marcheId);
      }

      // Marquer comme uploadé
      setMediaItems(prev => prev.map(media => 
        media.id === itemId ? { ...media, uploaded: true } : media
      ));

      toast.success('Fichier uploadé avec succès !');
    } catch (error) {
      console.error('❌ [MediaUploadSection] Erreur upload:', error);
      toast.error('Erreur lors de l\'upload: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAll = async () => {
    if (!marcheId) {
      console.error('❌ [MediaUploadSection] Aucun ID de marche fourni');
      toast.error('Aucun ID de marche fourni');
      return;
    }

    const itemsToUpload = mediaItems.filter(item => !item.uploaded && item.file);
    if (itemsToUpload.length === 0) {
      toast.info('Aucun fichier à uploader');
      return;
    }

    console.log(`📤 [MediaUploadSection] Upload en masse de ${itemsToUpload.length} fichiers`);
    setIsUploading(true);
    
    try {
      if (mediaType === 'photos') {
        const photosData: PhotoToUpload[] = itemsToUpload.map(item => ({
          id: item.id,
          file: item.file!,
          metadata: item.metadata,
          thumbnail: item.url,
          preview: item.url,
          uploaded: false,
          titre: item.titre,
          description: item.description
        }));

        console.log('📋 [MediaUploadSection] Données photos préparées:', photosData);
        const photoIds = await savePhotos(marcheId, photosData);
        console.log('✅ [MediaUploadSection] Photos sauvegardées avec IDs:', photoIds);
      } else {
        for (const item of itemsToUpload) {
          await uploadVideo(item.file!, marcheId);
        }
      }

      setMediaItems(prev => prev.map(media => ({ ...media, uploaded: true })));
      toast.success('Tous les fichiers ont été uploadés !');
    } catch (error) {
      console.error('❌ [MediaUploadSection] Erreur upload masse:', error);
      toast.error('Erreur lors de l\'upload en masse: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    const item = mediaItems.find(m => m.id === itemId);
    if (!item) return;

    console.log('🗑️ [MediaUploadSection] Suppression item:', itemId, item.isExisting);

    if (item.isExisting) {
      // Confirmation pour suppression définitive
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette photo ?')) {
        return;
      }

      try {
        await deletePhoto(itemId);
        setMediaItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Photo supprimée avec succès');
      } catch (error) {
        console.error('❌ [MediaUploadSection] Erreur suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    } else {
      // Suppression locale
      setMediaItems(prev => prev.filter(item => item.id !== itemId));
      toast.info('Fichier retiré de la liste');
    }
  };

  const handleUpdateMetadata = async (itemId: string, updates: { titre?: string; description?: string }) => {
    const item = mediaItems.find(m => m.id === itemId);
    if (!item?.isExisting) return;

    console.log('📝 [MediaUploadSection] Mise à jour métadonnées:', itemId, updates);

    try {
      await updatePhotoMetadata(itemId, updates);
      setMediaItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
      toast.success('Métadonnées mises à jour');
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
    toast.info('Tous les fichiers ont été supprimés de la liste');
  };

  const mediaTypeLabel = mediaType === 'photos' ? 'Photos' : 'Vidéos';
  const acceptedTypes = mediaType === 'photos' ? 'image/*,.heic,.heif' : 'video/*';

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
        <h3 className="text-lg font-medium">Gestion des {mediaTypeLabel}</h3>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={handleAddFiles}
            variant="outline"
            className="flex items-center"
            disabled={isProcessing}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isProcessing ? 'Traitement...' : `Ajouter ${mediaTypeLabel.toLowerCase()}`}
          </Button>
          {mediaItems.some(item => !item.uploaded) && (
            <Button
              type="button"
              onClick={handleUploadAll}
              disabled={isUploading || !marcheId || isProcessing}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Upload...' : 'Tout uploader'}
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
            <p className="text-blue-800">Traitement des fichiers en cours...</p>
          </div>
        </div>
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
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaItems.map(item => (
            mediaType === 'photos' ? (
              <PhotoCard
                key={item.id}
                photo={item}
                onRemove={handleRemove}
                onUpload={item.uploaded ? undefined : handleUpload}
                onUpdateMetadata={item.isExisting ? handleUpdateMetadata : undefined}
                isUploading={isUploading}
              />
            ) : (
              <Card key={item.id} className="p-4">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                  <video src={item.url} className="w-full h-full object-cover" controls={false} />
                  
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-white/80"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-white/80 text-red-600 hover:text-red-700"
                      onClick={() => handleRemove(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                  </div>

                  {!item.uploaded ? (
                    <Button
                      size="sm"
                      onClick={() => handleUpload(item.id)}
                      disabled={isUploading || !marcheId}
                      className="w-full"
                    >
                      {isUploading ? 'Upload...' : 'Uploader'}
                    </Button>
                  ) : (
                    <div className="flex items-center text-green-600 text-sm">
                      <span>✓ Uploadé</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          ))}
        </div>
      )}

      {mediaItems.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-600">
            {mediaItems.length} {mediaType === 'photos' ? 'photo(s)' : 'vidéo(s)'} • {mediaItems.filter(item => item.uploaded).length} uploadée(s)
          </span>
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
      )}
    </div>
  );
};

export default MediaUploadSection;
