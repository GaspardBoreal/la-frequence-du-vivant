
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Eye, X, Edit3, Check, AlertCircle } from 'lucide-react';
import { formatFileSize, formatDimensions } from '../../utils/photoUtils';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

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
    isConverted?: boolean;
    originalFormat?: string;
  };
  onRemove: (id: string) => void;
  onUpload?: (id: string) => void;
  onUpdateMetadata?: (id: string, updates: { titre?: string; description?: string }) => void;
  isUploading?: boolean;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onRemove,
  onUpload,
  onUpdateMetadata,
  isUploading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(photo.titre || photo.name);
  const [editDescription, setEditDescription] = useState(photo.description || '');

  const handleSaveMetadata = () => {
    if (onUpdateMetadata) {
      onUpdateMetadata(photo.id, {
        titre: editTitle,
        description: editDescription
      });
    }
    setIsEditing(false);
  };

  const getFormatBadge = () => {
    if (photo.isConverted) {
      return (
        <Badge variant="secondary" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Converti {photo.originalFormat?.replace('image/', '').toUpperCase()} → JPEG
        </Badge>
      );
    }
    
    const format = photo.file?.type?.replace('image/', '').toUpperCase() || 'IMG';
    return <Badge variant="outline" className="text-xs">{format}</Badge>;
  };

  const getStatusBadge = () => {
    if (photo.isExisting) {
      return <Badge variant="default" className="text-xs">Sauvegardé</Badge>;
    }
    
    if (photo.uploaded) {
      return <Badge variant="default" className="text-xs">✓ Uploadé</Badge>;
    }
    
    return <Badge variant="secondary" className="text-xs">En attente</Badge>;
  };

  return (
    <Card className="p-4">
      <div className="aspect-video bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
        <img 
          src={photo.url} 
          alt={photo.name} 
          className="w-full h-full object-cover" 
        />
        
        <div className="absolute top-2 right-2 flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-white/90"
            onClick={() => window.open(photo.url, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-white/90 text-red-600 hover:text-red-700"
            onClick={() => onRemove(photo.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {getFormatBadge()}
          {getStatusBadge()}
        </div>
      </div>

      <div className="space-y-3">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titre de la photo"
              className="text-sm"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optionnelle)"
              className="text-sm min-h-[60px]"
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSaveMetadata}>
                <Check className="h-4 w-4 mr-1" />
                Sauver
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm truncate">{photo.titre || photo.name}</p>
              {photo.isExisting && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {photo.description && (
              <p className="text-xs text-gray-500 mt-1">{photo.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>{formatFileSize(photo.size)}</span>
              {photo.metadata && (
                <span>{formatDimensions(photo.metadata.width, photo.metadata.height)}</span>
              )}
            </div>
          </div>
        )}

        {!photo.uploaded && !photo.isExisting && onUpload && (
          <Button
            size="sm"
            onClick={() => onUpload(photo.id)}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? 'Upload...' : 'Uploader'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PhotoCard;
