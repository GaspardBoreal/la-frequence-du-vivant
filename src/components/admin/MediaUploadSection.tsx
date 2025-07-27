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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les photos existantes au montage
  useEffect(() => {
    if (marcheId && mediaType === 'photos') {
      loadExistingPhotos();
    }
  }, [marcheId, mediaType]);

  const loadExistingPhotos = async () => {
    if (!marcheId) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Chargement des photos existantes...');
      const existingPhotos = await fetchExistingPhotos(marcheId);
      
      const formattedPhotos: MediaItem[] = existingPhotos.map(photo => ({
        id: photo.id,
        url: photo.url_supabase,
        name: photo.nom_fichier,
        size: 0, // Taille non disponible pour les photos existantes
        uploaded: true,
        isExisting: true,
        metadata: photo.metadata,
        titre: photo.titre,
        description: photo.description
      }));

      setMediaItems(formattedPhotos);
      console.log(`✅ ${formattedPhotos.length} photos existantes chargées`);
    } catch (error) {
      console.error('❌ Erreur chargement photos:', error);
      toast.error('Erreur lors du chargement des photos existantes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newItems: MediaItem[] = [];
    
    for (const file of Array.from(files)) {
      try {
        if (mediaType === 'photos') {
          // Vérifier le format
          if (!isSupportedPhotoFormat(file)) {
            toast.error(`Format non supporté: ${file.name}`);
            continue;
          }

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
        console.error('❌ Erreur traitement fichier:', error);
        toast.error(`Erreur lors du traitement de ${file.name}`);
      }
    }

    setMediaItems(prev => [...prev, ...newItems]);
    
    if (newItems.length > 0) {
      toast.success(`${newItems.length} fichier(s) ajouté(s) avec succès`);
    }
  };

  const handleUpload = async (itemId: string) => {
    const item = mediaItems.find(m => m.id === itemId);
    if (!marcheId || !item || !item.file) {
      toast.error('Impossible d\'uploader: données manquantes');
      return;
    }

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

        await savePhoto(marcheId, photoData);
      } else {
        await uploadVideo(item.file, marcheId);
      }

      setMediaItems(prev => prev.map(media => 
        media.id === itemId ? { ...media, uploaded: true } : media
      ));

      toast.success('Fichier uploadé avec succès !');
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAll = async () => {
    if (!marcheId) {
      toast.error('Aucun ID de marche fourni');
      return;
    }

    const itemsToUpload = mediaItems.filter(item => !item.uploaded && item.file);
    if (itemsToUpload.length === 0) {
      toast.info('Aucun fichier à uploader');
      return;
    }

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

        await savePhotos(marcheId, photosData);
      } else {
        for (const item of itemsToUpload) {
          await uploadVideo(item.file!, marcheId);
        }
      }

      setMediaItems(prev => prev.map(media => ({ ...media, uploaded: true })));
      toast.success('Tous les fichiers ont été uploadés !');
    } catch (error) {
      console.error('❌ Erreur upload masse:', error);
      toast.error('Erreur lors de l\'upload en masse');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    const item = mediaItems.find(m => m.id === itemId);
    if (!item) return;

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
        console.error('❌ Erreur suppression:', error);
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

    try {
      await updatePhotoMetadata(itemId, updates);
      setMediaItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
      toast.success('Métadonnées mises à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const mediaTypeLabel = mediaType === 'photos' ? 'Photos' : 'Vidéos';
  const acceptedTypes = mediaType === 'photos' ? 'image/*,.heic,.heif' : 'video/*';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestion des {mediaTypeLabel}</h3>
        <div className="flex space-x-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter {mediaTypeLabel.toLowerCase()}
          </Button>
          {mediaItems.some(item => !item.uploaded) && (
            <Button
              onClick={handleUploadAll}
              disabled={isUploading || !marcheId}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Tout uploader
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
            variant="outline"
            onClick={() => setMediaItems([])}
            className="text-red-600 hover:text-red-700"
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
