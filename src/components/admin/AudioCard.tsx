
import React, { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Play, 
  Pause, 
  X, 
  Upload, 
  Edit, 
  Save, 
  Music,
  FileAudio,
  Volume2,
  Loader2
} from 'lucide-react';
import { formatFileSize } from '../../utils/photoUtils';

interface AudioCardProps {
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
  };
  onRemove: (id: string) => void;
  onUpload?: (id: string) => void;
  onUpdateMetadata?: (id: string, updates: { titre?: string; description?: string }) => void;
  isUploading?: boolean;
}

const AudioCard: React.FC<AudioCardProps> = ({
  audio,
  onRemove,
  onUpload,
  onUpdateMetadata,
  isUploading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitre, setEditTitre] = useState(audio.titre || '');
  const [editDescription, setEditDescription] = useState(audio.description || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSave = () => {
    if (onUpdateMetadata) {
      onUpdateMetadata(audio.id, {
        titre: editTitre,
        description: editDescription
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitre(audio.titre || '');
    setEditDescription(audio.description || '');
    setIsEditing(false);
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Durée inconnue';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUploadStatusIcon = () => {
    if (isUploading || audio.uploadStatus === 'uploading' || audio.uploadStatus === 'processing') {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return <Upload className="h-4 w-4" />;
  };

  return (
    <Card className="p-4 space-y-3">
      {/* Audio Player Section */}
      <div className="bg-gray-50 rounded-lg p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
              className="h-10 w-10 p-0 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Music className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">{audio.name}</span>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            onClick={() => onRemove(audio.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audio.url}
          onEnded={handleAudioEnded}
          className="hidden"
          preload="metadata"
        />

        {/* Upload Status */}
        {audio.uploaded && (
          <div className="absolute top-2 right-12">
            <Badge variant="default" className="text-xs">
              ✓ Uploadé
            </Badge>
          </div>
        )}
      </div>

      {/* File Information */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileAudio className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-sm truncate">{audio.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Volume2 className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {formatDuration(audio.duration)}
            </span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Taille:</span>
            <span>{formatFileSize(audio.size)}</span>
          </div>
        </div>

        {/* Upload Progress */}
        {(audio.uploadProgress !== undefined && audio.uploadProgress < 100) && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Upload: {audio.uploadProgress}%</span>
              <span className="capitalize">{audio.uploadStatus}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${audio.uploadProgress}%` }}
              />
            </div>
            {audio.uploadError && (
              <p className="text-xs text-red-500 truncate">{audio.uploadError}</p>
            )}
          </div>
        )}
      </div>

      {/* Metadata Section */}
      <div className="space-y-2 pt-2 border-t">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editTitre}
              onChange={(e) => setEditTitre(e.target.value)}
              placeholder="Titre de l'audio"
              className="text-sm"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description de l'audio"
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
              <p className="text-sm font-medium">{audio.titre || 'Sans titre'}</p>
              {audio.description && (
                <p className="text-xs text-gray-600">{audio.description}</p>
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

      {/* Upload Button for new files */}
      {!audio.uploaded && onUpload && (
        <Button
          size="sm"
          onClick={() => onUpload(audio.id)}
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

export default AudioCard;
