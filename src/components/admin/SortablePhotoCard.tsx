import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GripVertical, MoveUp, MoveDown } from 'lucide-react';
import PhotoCard from './PhotoCard';

interface SortablePhotoCardProps {
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
    ordre?: number;
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
  index: number;
  onRemove: (id: string) => void;
  onUpload?: (id: string) => void;
  onUpdateMetadata?: (id: string, updates: { titre?: string; description?: string }) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isUploading?: boolean;
  showOptimizationInfo?: boolean;
  totalItems: number;
}

const SortablePhotoCard: React.FC<SortablePhotoCardProps> = ({
  photo,
  index,
  onRemove,
  onUpload,
  onUpdateMetadata,
  onMoveUp,
  onMoveDown,
  isUploading = false,
  showOptimizationInfo = false,
  totalItems
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Badge d'ordre */}
      <div className="absolute -top-2 -left-2 z-10">
        <Badge variant="default" className="bg-blue-600 text-white text-xs font-bold">
          #{index + 1}
        </Badge>
      </div>

      {/* Poignée de drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-white/80 rounded p-1 hover:bg-white/90 transition-colors"
      >
        <GripVertical className="h-4 w-4 text-gray-600" />
      </div>

      {/* Boutons de déplacement */}
      <div className="absolute top-2 right-12 z-10 flex flex-col space-y-1">
        <Button
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0 bg-white/80"
          onClick={() => onMoveUp?.(photo.id)}
          disabled={index === 0}
          title="Monter"
        >
          <MoveUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0 bg-white/80"
          onClick={() => onMoveDown?.(photo.id)}
          disabled={index === totalItems - 1}
          title="Descendre"
        >
          <MoveDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Carte photo normale */}
      <PhotoCard
        photo={photo}
        onRemove={onRemove}
        onUpload={onUpload}
        onUpdateMetadata={onUpdateMetadata}
        isUploading={isUploading}
        showOptimizationInfo={showOptimizationInfo}
        optimizationInfo={photo.optimizationInfo}
      />
    </div>
  );
};

export default SortablePhotoCard;