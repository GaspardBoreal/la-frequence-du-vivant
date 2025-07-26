
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, X, Eye, Trash2, Plus } from 'lucide-react';

interface MediaUploadSectionProps {
  marcheId: string | null;
  mediaType: 'photos' | 'videos';
}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  size: number;
  uploaded: boolean;
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({ marcheId, mediaType }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newItems: MediaItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploaded: false
    }));

    setMediaItems(prev => [...prev, ...newItems]);
  };

  const handleUpload = async (item: MediaItem) => {
    setIsUploading(true);
    try {
      // TODO: Implémenter l'upload vers Supabase Storage
      console.log('Upload de:', item.name);
      
      // Simuler l'upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMediaItems(prev => 
        prev.map(media => 
          media.id === item.id ? { ...media, uploaded: true } : media
        )
      );
    } catch (error) {
      console.error('Erreur upload:', error);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestion des {mediaTypeLabel}</h3>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter {mediaTypeLabel.toLowerCase()}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      {mediaItems.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucune {mediaType === 'photos' ? 'photo' : 'vidéo'} ajoutée
          </h4>
          <p className="text-gray-600 mb-4">
            Cliquez sur "Ajouter {mediaTypeLabel.toLowerCase()}" pour commencer
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                {mediaType === 'photos' ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                )}
                
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
                    onClick={() => handleUpload(item)}
                    disabled={isUploading}
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
