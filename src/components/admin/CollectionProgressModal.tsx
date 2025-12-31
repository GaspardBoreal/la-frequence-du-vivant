import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollectionProgress } from '@/hooks/useCollectionProgress';
import { Clock, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react';

interface CollectionProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  logId: string | null;
  collectionTypes: string[];
  isLaunching?: boolean;
}

const CollectionProgressModal: React.FC<CollectionProgressModalProps> = ({
  isOpen,
  onClose,
  logId,
  collectionTypes,
  isLaunching = false,
}) => {
  const { 
    log, 
    progress, 
    currentMarcheName,
    currentDataType,
    estimatedTimeRemaining,
    initialEstimate,
    isCompleted, 
    error,
    lastPingAgeSeconds
  } = useCollectionProgress(logId, collectionTypes);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'Calcul en cours...';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            Collecte de Données
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Collection Types */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Types de données :</p>
            <div className="flex flex-wrap gap-2">
              {collectionTypes.map((type) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type === 'biodiversity' ? '🌿 Biodiversité' :
                   type === 'weather' ? '🌤️ Météo' :
                   type === 'real_estate' ? '🏠 Immobilier' : type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Status */}
          {isLaunching ? (
            <div className="p-3 rounded-lg border bg-blue-50 text-blue-700 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="font-medium text-sm">Initialisation</span>
              </div>
              <p className="text-xs">
                Préparation de la collecte...
              </p>
            </div>
          ) : log ? (
            <div className={`p-3 rounded-lg border ${getStatusColor(log.status)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(log.status)}
                <span className="font-medium text-sm">
                  {log.status === 'completed' ? 'Terminé' :
                   log.status === 'failed' ? 'Échec' :
                   log.status === 'running' ? 'En cours' : log.status}
                </span>
              </div>

              {log.status === 'running' && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">
                    {currentDataType || 'Collecte en cours...'}
                  </p>
                  <p className="text-xs opacity-75">
                    Marche : {currentMarcheName}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm items-center">
              <span>Progression</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{progress}%</span>
                {typeof lastPingAgeSeconds === 'number' && lastPingAgeSeconds > 10 && (
                  <span className="text-xs text-muted-foreground">Aucune mise à jour depuis {lastPingAgeSeconds}s</span>
                )}
              </div>
            </div>
            <Progress value={progress} className="w-full h-2" />
            
            {/* Detailed Progress Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Traitement:</span>
                <div className="font-medium">
                  {log?.marches_processed || 0} / {log?.marches_total || 0} marches
                </div>
              </div>
              
              {log?.status === 'running' && (
                <div>
                  <span className="text-muted-foreground">Temps restant:</span>
                  <div className="font-medium">
                    {estimatedTimeRemaining ? 
                      formatTime(estimatedTimeRemaining) : 
                      'Calcul en cours...'}
                  </div>
                </div>
              )}
            </div>

            {/* Initial Estimate Display */}
            {initialEstimate && log?.status === 'running' && (
              <div className="p-2 bg-blue-50 rounded text-xs">
                <span className="text-blue-600">
                  💡 Durée estimée : {formatTime(initialEstimate)}
                </span>
              </div>
            )}
          </div>

          {/* Timing Info */}
          {log && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Démarré à</p>
                <p className="font-medium">
                  {new Date(log.started_at).toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Durée</p>
                <p className="font-medium">
                  {log.duration_seconds ? 
                    formatTime(log.duration_seconds) : 
                    'En cours...'}
                </p>
              </div>
            </div>
          )}

          {/* Errors */}
          {log?.errors_count > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                {log.errors_count} erreur(s) détectée(s)
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              variant={isCompleted ? "default" : "outline"}
              disabled={!isCompleted && !error}
            >
              {isCompleted || error ? 'Fermer' : 'Minimiser'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionProgressModal;