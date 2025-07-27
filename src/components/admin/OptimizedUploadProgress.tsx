
import React from 'react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { CheckCircle, AlertCircle, Loader2, Upload, Zap, FileImage, Repeat } from 'lucide-react';
import { UploadTask } from '../../utils/parallelUploadManager';

interface OptimizedUploadProgressProps {
  tasks: UploadTask[];
  globalStatus: {
    total: number;
    pending: number;
    uploading: number;
    success: number;
    error: number;
  };
}

const OptimizedUploadProgress: React.FC<OptimizedUploadProgressProps> = ({
  tasks,
  globalStatus
}) => {
  const getTaskIcon = (task: UploadTask) => {
    switch (task.status) {
      case 'pending':
        return <Upload className="h-4 w-4 text-gray-400" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (task: UploadTask) => {
    switch (task.status) {
      case 'pending':
        return 'En attente';
      case 'uploading':
        return 'Upload...';
      case 'success':
        return 'Terminé';
      case 'error':
        return `Erreur ${task.retryCount > 0 ? `(${task.retryCount} tentatives)` : ''}`;
      default:
        return '';
    }
  };

  const getGlobalProgress = () => {
    if (globalStatus.total === 0) return 0;
    return Math.round((globalStatus.success / globalStatus.total) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Progression globale */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <h4 className="font-medium">Upload Parallèle</h4>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {globalStatus.success}/{globalStatus.total}
            </Badge>
            <Badge variant={globalStatus.error > 0 ? 'destructive' : 'default'}>
              {getGlobalProgress()}%
            </Badge>
          </div>
        </div>
        
        <Progress value={getGlobalProgress()} className="h-3 mb-3" />
        
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>Attente: {globalStatus.pending}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Upload: {globalStatus.uploading}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Réussi: {globalStatus.success}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Erreur: {globalStatus.error}</span>
          </div>
        </div>
      </Card>

      {/* Détail des tâches */}
      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getTaskIcon(task)}
                <FileImage className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium truncate flex-1">
                  {task.photo.file.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {task.retryCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    {task.retryCount}
                  </Badge>
                )}
                <Badge 
                  variant={
                    task.status === 'success' ? 'default' : 
                    task.status === 'error' ? 'destructive' : 'secondary'
                  } 
                  className="text-xs"
                >
                  {getStatusText(task)}
                </Badge>
              </div>
            </div>
            
            <Progress value={task.progress} className="h-2 mb-2" />
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{task.progress}%</span>
              {task.error && (
                <span className="text-red-500 truncate ml-2">{task.error}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OptimizedUploadProgress;
