import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  X, 
  Upload, 
  Edit, 
  Save, 
  Zap,
  FileImage,
  Repeat,
  Loader2
} from 'lucide-react';
import { formatFileSize } from '../../utils/photoUtils';

interface PhotoCardProps {
  photo: {
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
    uploadProgress?: number;
    uploadStatus?: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
    uploadError?: string;
  };
  onRemove: (id: string) => void;
  onUpload?: (id: string) => void;
  onUpdateMetadata?: (id: string, updates: { titre?: string; description?: string }) => void;
  isUploading?: boolean;
  showOptimizationInfo?: boolean;
  optimizationInfo?: {
    originalSize: number;
    compressionRatio: number;
    wasConverted: boolean;
  };
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onRemove,
  onUpload,
  onUpdateMetadata,
  isUploading = false,
  showOptimizationInfo = false,
  optimizationInfo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitre, setEditTitre] = useState(photo.titre || '');
  const [editDescription, setEditDescription] = useState(photo.description || '');

  const handleSave = () => {
    if (onUpdateMetadata) {
      onUpdateMetadata(photo.id, {
        titre: editTitre,
        description: editDescription
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitre(photo.titre || '');
    setEditDescription(photo.description || '');
    setIsEditing(false);
  };

  const getUploadStatusIcon = () => {
    if (isUploading || photo.uploadStatus === 'uploading' || photo.uploadStatus === 'processing') {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return <Upload className="h-4 w-4" />;
  };

  return (
    <Card className="p-4 space-y-3">
      {/* Image principale */}
      <div className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden">
        <img 
          src={photo.url} 
          alt={photo.name}
          className="w-full h-full object-cover"
        />
        
        {/* Badges d'optimisation */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {showOptimizationInfo && optimizationInfo && (
            <>
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                -{optimizationInfo.compressionRatio.toFixed(0)}%
              </Badge>
              {optimizationInfo.wasConverted && (
                <Badge variant="outline" className="text-xs">
                  <Repeat className="h-3 w-3 mr-1" />
                  HEIC→JPEG
                </Badge>
              )}
            </>
          )}
        </div>
        
        {/* Boutons d'action */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-white/80"
            onClick={() => window.open(photo.url, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-white/80 text-red-600 hover:text-red-700"
            onClick={() => onRemove(photo.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Informations du fichier */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileImage className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-sm truncate">{photo.name}</span>
          </div>
          {photo.uploaded && (
            <Badge variant="default" className="text-xs">
              ✓ Uploadé
            </Badge>
          )}
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Taille:</span>
            <span>{formatFileSize(photo.size)}</span>
          </div>
          {showOptimizationInfo && optimizationInfo && (
            <div className="flex justify-between">
              <span>Origine:</span>
              <span>{formatFileSize(optimizationInfo.originalSize)}</span>
            </div>
          )}
        </div>

        {/* Progression d'upload */}
        {(photo.uploadProgress !== undefined && photo.uploadProgress < 100) && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Upload: {photo.uploadProgress}%</span>
              <span className="capitalize">{photo.uploadStatus}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${photo.uploadProgress}%` }}
              />
            </div>
            {photo.uploadError && (
              <p className="text-xs text-red-500 truncate">{photo.uploadError}</p>
            )}
          </div>
        )}
      </div>

      {/* Métadonnées éditables */}
      {photo.isExisting && (
        <div className="space-y-2 pt-2 border-t">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editTitre}
                onChange={(e) => setEditTitre(e.target.value)}
                placeholder="Titre de la photo"
                className="text-sm"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description de la photo"
                className="text-sm"
                rows={2}
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  Sauver
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">{photo.titre || 'Sans titre'}</p>
                {photo.description && (
                  <p className="text-xs text-gray-600">{photo.description}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bouton d'upload pour les nouveaux fichiers */}
      {!photo.uploaded && onUpload && (
        <Button
          size="sm"
          onClick={() => onUpload(photo.id)}
          disabled={isUploading}
          className="w-full"
        >
          {getUploadStatusIcon()}
          <span className="ml-2">
            {isUploading ? 'Upload...' : 'Uploader'}
          </span>
        </Button>
      )}
    </Card>
  );
};

export default PhotoCard;
