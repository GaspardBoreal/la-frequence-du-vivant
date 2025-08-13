import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDataCollectionLogs, useTriggerBatchCollection } from '@/hooks/useSnapshotData';
import { DataCollectionLog } from '@/types/snapshots';
import { PlayCircle, BarChart3, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import CollectionProgressModal from './CollectionProgressModal';

interface DataCollectionPanelProps {
  marches?: Array<{
    id: string;
    nomMarche?: string;
    ville: string;
    region?: string;
    departement?: string;
  }>;
}

const DataCollectionPanel: React.FC<DataCollectionPanelProps> = ({ marches = [] }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [currentCollectionTypes, setCurrentCollectionTypes] = useState<string[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useDataCollectionLogs(10);
  const triggerCollection = useTriggerBatchCollection();

  const handleTriggerCollection = async (types: ('biodiversity' | 'weather' | 'real_estate')[]) => {
    try {
      setIsCollecting(true);
      setCurrentCollectionTypes(types);
      
      const result = await triggerCollection({
        collectionTypes: types,
        mode: 'manual'
      });

      if (result.success && result.logId) {
        setCurrentLogId(result.logId);
        setShowProgressModal(true);
        toast.success('Collecte lancée avec succès');
        refetchLogs();
      } else {
        toast.error('Erreur lors de la collecte');
        setIsCollecting(false);
      }
    } catch (error) {
      console.error('Collection error:', error);
      toast.error('Erreur lors du lancement de la collecte');
      setIsCollecting(false);
    }
  };

  const handleProgressModalClose = () => {
    setShowProgressModal(false);
    setCurrentLogId(null);
    setCurrentCollectionTypes([]);
    setIsCollecting(false);
    refetchLogs(); // Refresh logs when modal closes
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Collection Triggers */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <PlayCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Collecte de Données Manuelle</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleTriggerCollection(['biodiversity'])}
            disabled={isCollecting}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <div className="text-green-600 mb-2">🌿</div>
            <span className="font-medium">Biodiversité</span>
            <span className="text-xs text-muted-foreground">eBird + iNaturalist</span>
          </Button>

          <Button
            onClick={() => handleTriggerCollection(['weather'])}
            disabled={isCollecting}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <div className="text-blue-600 mb-2">🌤️</div>
            <span className="font-medium">Météo</span>
            <span className="text-xs text-muted-foreground">Open-Meteo</span>
          </Button>

          <Button
            onClick={() => handleTriggerCollection(['real_estate'])}
            disabled={isCollecting}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <div className="text-purple-600 mb-2">🏠</div>
            <span className="font-medium">Immobilier</span>
            <span className="text-xs text-muted-foreground">LEXICON</span>
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button
            onClick={() => handleTriggerCollection(['biodiversity', 'weather', 'real_estate'])}
            disabled={isCollecting}
            className="w-full"
          >
            {isCollecting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Collecte en cours...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Collecte Complète (Tout)
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Info:</strong> Les collectes automatiques ont lieu les 1er et 15 de chaque mois. 
            Utilisez les boutons ci-dessus pour forcer une collecte manuelle.
          </p>
        </div>
      </Card>

      {/* Collection Logs */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Historique des Collectes</h3>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {logs?.map((log: DataCollectionLog) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <div className="font-medium text-sm">
                      {log.collection_type.split(',').join(' + ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.started_at).toLocaleString('fr-FR')} • Mode: {log.collection_mode}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium">
                    {log.marches_processed}/{log.marches_total} marches
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDuration(log.duration_seconds)}
                    {log.errors_count > 0 && (
                      <span className="ml-2 text-red-600">
                        {log.errors_count} erreurs
                      </span>
                    )}
                  </div>
                </div>

                <Badge 
                  variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                >
                  {log.status === 'completed' ? 'Terminé' : 
                   log.status === 'failed' ? 'Échec' : 
                   log.status === 'running' ? 'En cours' : log.status}
                </Badge>
              </div>
            ))}

            {!logs || logs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune collecte dans l'historique
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Progress Modal */}
      <CollectionProgressModal
        isOpen={showProgressModal}
        onClose={handleProgressModalClose}
        logId={currentLogId}
        collectionTypes={currentCollectionTypes}
      />
    </div>
  );
};

export default DataCollectionPanel;