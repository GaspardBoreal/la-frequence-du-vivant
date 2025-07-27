import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, X, Eye, Trash2, Plus } from 'lucide-react';
import { savePhotos, saveVideos } from '../../utils/supabaseMarcheOperations';
interface MediaUploadSectionProps {
  marcheId: string | null;
  mediaType: 'photos' | 'videos';
}
interface MediaItem {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  uploaded: boolean;
}
const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  marcheId,
  mediaType
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newItems: MediaItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploaded: false
    }));
    setMediaItems(prev => [...prev, ...newItems]);
  };
  const handleUpload = async (item: MediaItem) => {
    if (!marcheId) {
      console.error('❌ Aucun ID de marche fourni pour l\'upload');
      return;
    }
    setIsUploading(true);
    try {
      console.log('Upload de:', item.name);
      if (mediaType === 'photos') {
        await savePhotos(marcheId, [{
          ...item,
          uploaded: false
        }]);
      } else if (mediaType === 'videos') {
        await saveVideos(marcheId, [{
          ...item,
          uploaded: false
        }]);
      }
      setMediaItems(prev => prev.map(media => media.id === item.id ? {
        ...media,
        uploaded: true
      } : media));
      console.log('✅ Upload terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur upload:', error);
    } finally {
      setIsUploading(false);
    }
  };
  const handleUploadAll = async () => {
    if (!marcheId) {
      console.error('❌ Aucun ID de marche fourni pour l\'upload');
      return;
    }
    const itemsToUpload = mediaItems.filter(item => !item.uploaded);
    if (itemsToUpload.length === 0) return;
    setIsUploading(true);
    try {
      console.log(`🔄 Upload de ${itemsToUpload.length} fichiers...`);
      if (mediaType === 'photos') {
        await savePhotos(marcheId, itemsToUpload);
      } else if (mediaType === 'videos') {
        await saveVideos(marcheId, itemsToUpload);
      }
      setMediaItems(prev => prev.map(media => ({
        ...media,
        uploaded: true
      })));
      console.log('✅ Tous les fichiers ont été uploadés');
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload en masse:', error);
    } finally {
      setIsUploading(false);
    }
  };
  const handleRemove = (itemId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== itemId));
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const mediaTypeLabel = mediaType === 'photos' ? 'Photos' : 'Vidéos';
  const acceptedTypes = mediaType === 'photos' ? 'image/*' : 'video/*';
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestion des {mediaTypeLabel}</h3>
        <div className="flex space-x-2">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter {mediaTypeLabel.toLowerCase()}
          </Button>
          {mediaItems.some(item => !item.uploaded) && <Button onClick={handleUploadAll} disabled={isUploading || !marcheId} className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Tout uploader
            </Button>}
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple accept={acceptedTypes} onChange={handleFileSelect} className="hidden" />

      {!marcheId && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Sauvegardez d'abord les informations de base de la marche pour pouvoir ajouter des {mediaTypeLabel.toLowerCase()}.
          </p>
        </div>}

      {mediaItems.length === 0 ? <Card className="p-8 text-center border-dashed">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucune {mediaType === 'photos' ? 'photo' : 'vidéo'} ajoutée
          </h4>
          <p className="mb-4 text-slate-200">
            Cliquez sur "Ajouter {mediaTypeLabel.toLowerCase()}" pour commencer
          </p>
        </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaItems.map(item => <Card key={item.id} className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                {mediaType === 'photos' ? <img src={item.url} alt={item.name} className="w-full h-full object-cover" /> : <video src={item.url} className="w-full h-full object-cover" controls={false} />}
                
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white/80" onClick={() => window.open(item.url, '_blank')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white/80 text-red-600 hover:text-red-700" onClick={() => handleRemove(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                </div>

                {!item.uploaded ? <Button size="sm" onClick={() => handleUpload(item)} disabled={isUploading || !marcheId} className="w-full">
                    {isUploading ? 'Upload...' : 'Uploader'}
                  </Button> : <div className="flex items-center text-green-600 text-sm">
                    <span>✓ Uploadé</span>
                  </div>}
              </div>
            </Card>)}
        </div>}

      {mediaItems.length > 0 && <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-600">
            {mediaItems.length} {mediaType === 'photos' ? 'photo(s)' : 'vidéo(s)'} • {mediaItems.filter(item => item.uploaded).length} uploadée(s)
          </span>
          <Button variant="outline" onClick={() => setMediaItems([])} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Tout supprimer
          </Button>
        </div>}
    </div>;
};
export default MediaUploadSection;