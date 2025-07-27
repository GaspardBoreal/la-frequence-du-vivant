
import React from 'react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';

interface PhotoUploadProgressProps {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  isConverted?: boolean;
  originalFormat?: string;
}

const PhotoUploadProgress: React.FC<PhotoUploadProgressProps> = ({
  fileName,
  progress,
  status,
  error,
  isConverted,
  originalFormat
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4 text-gray-400" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'uploading':
        return 'Upload en cours...';
      case 'processing':
        return 'Traitement...';
      case 'success':
        return 'Terminé';
      case 'error':
        return 'Erreur';
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium truncate flex-1">{fileName}</span>
        </div>
        <div className="flex items-center space-x-2">
          {isConverted && (
            <Badge variant="secondary" className="text-xs">
              Converti {originalFormat?.replace('image/', '').toUpperCase()} → JPEG
            </Badge>
          )}
          <Badge variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
            {getStatusText()}
          </Badge>
        </div>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2 mb-2"
      />
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{progress}%</span>
        {error && (
          <span className="text-red-500 truncate ml-2">{error}</span>
        )}
      </div>
    </div>
  );
};

export default PhotoUploadProgress;
