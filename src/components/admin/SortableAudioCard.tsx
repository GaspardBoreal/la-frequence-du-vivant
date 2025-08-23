import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GripVertical, MoveUp, MoveDown } from 'lucide-react';
import AudioCard from './AudioCard';

interface SortableAudioCardProps {
  audio: {
    id: string;
    file?: File;
    url: string;
    name: string;
    size: number;
    duration: number | null;
    uploaded: boolean;
    isExisting?: boolean;
    titre?: string;
    description?: string;
    uploadProgress?: number;
    uploadStatus?: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
    uploadError?: string;
    created_at?: string;
  };
  index: number;
  onRemove: (id: string) => void;
  onUpload?: (id: string) => void;
  onUpdateMetadata?: (id: string, updates: { titre?: string; description?: string }) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isUploading?: boolean;
  totalItems: number;
}

const SortableAudioCard: React.FC<SortableAudioCardProps> = ({
  audio,
  index,
  onRemove,
  onUpload,
  onUpdateMetadata,
  onMoveUp,
  onMoveDown,
  isUploading = false,
  totalItems
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: audio.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Badge d'ordre - Mobile friendly */}
      <div className="absolute -top-2 -left-2 z-10">
        <Badge variant="default" className="bg-purple-600 text-white text-xs font-bold min-w-[28px] h-6 flex items-center justify-center">
          #{index + 1}
        </Badge>
      </div>

      {/* Poignée de drag - Plus large sur mobile */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-white/90 rounded-lg p-2 hover:bg-white transition-colors shadow-sm"
        title="Glisser pour réorganiser"
      >
        <GripVertical className="h-4 w-4 text-gray-600" />
      </div>

      {/* Boutons de déplacement - Stack vertical sur mobile, mieux espacés */}
      <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 shadow-sm"
          onClick={() => onMoveUp?.(audio.id)}
          disabled={index === 0}
          title="Monter dans l'ordre"
        >
          <MoveUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 shadow-sm"
          onClick={() => onMoveDown?.(audio.id)}
          disabled={index === totalItems - 1}
          title="Descendre dans l'ordre"
        >
          <MoveDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Carte audio normale avec padding supplémentaire pour les contrôles */}
      <div className="pt-2 pl-2 pr-2">
        <AudioCard
          audio={audio}
          onRemove={onRemove}
          onUpload={onUpload}
          onUpdateMetadata={onUpdateMetadata}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
};

export default SortableAudioCard;