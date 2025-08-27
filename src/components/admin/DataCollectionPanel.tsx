import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDataCollectionLogs, useTriggerBatchCollection } from '@/hooks/useSnapshotData';
import { useDeleteCollectionLog, useDeleteAllFailedLogs } from '@/hooks/useDeleteCollectionLog';
import { DataCollectionLog } from '@/types/snapshots';
import { PlayCircle, BarChart3, Clock, CheckCircle, XCircle, AlertCircle, Trash, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DebugCollectionProgressModal from './DebugCollectionProgressModal';
import SearchRadiusTooltip from './SearchRadiusTooltip';

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
  const [isLaunching, setIsLaunching] = useState(false);
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useDataCollectionLogs(10);
  const triggerCollection = useTriggerBatchCollection();
  const deleteLog = useDeleteCollectionLog();
  const deleteAllFailedLogs = useDeleteAllFailedLogs();

  const handleTriggerCollection = async (types: ('biodiversity' | 'weather' | 'real_estate')[]) => {
    try {
      setIsLaunching(true);
      setIsCollecting(true);
      setCurrentCollectionTypes(types);
      
      console.log('🚀 Démarrage de la collecte:', types);
      
      // Afficher la modal avec état de lancement IMMÉDIATEMENT
      setShowProgressModal(true);
      
      // Pré-lancer la recherche du logId pour commencer le polling le plus tôt possible
      let logId: string | null = null;
      
      // Déclencher la collecte avec le mode batch pour les performances
      const collectionPromise = triggerCollection({
        collectionTypes: types,
        mode: 'manual',
        batchMode: true // Enable batch optimizations for robustness
      });
      
      // En parallèle, chercher le logId dès que possible
      const logIdSearchPromise = (async () => {
        // Attendre 200ms pour que la collecte commence
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Polling agressif pour récupérer le logId rapidement
        for (let attempts = 0; attempts < 15; attempts++) {
          try {
            const { data: latestLogs } = await supabase
              .from('data_collection_logs')
              .select('id, started_at')
              .order('started_at', { ascending: false })
              .limit(1);
            
            if (latestLogs?.[0]) {
              const candidateLogId = latestLogs[0].id;
              // Vérifier que ce log n'était pas déjà là avant
              if (candidateLogId !== currentLogId) {
                return candidateLogId;
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du logId:', error);
          }
          
          // Polling très rapide au début (100ms)
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
      })();
      
      // Attendre les deux opérations
      const [result, searchedLogId] = await Promise.all([
        collectionPromise,
        logIdSearchPromise
      ]);
      
      console.log('📋 Résultat de la collecte:', result);
      
      // Utiliser le logId de la réponse ou celui trouvé par recherche
      logId = result?.logId || searchedLogId;
      
      if (logId) {
        console.log('✅ LogId trouvé, démarrage du polling temps réel:', logId);
        setCurrentLogId(logId);
        setIsLaunching(false);
        toast.success('Collecte lancée avec succès - Suivi temps réel activé');
      } else {
        throw new Error('Impossible de récupérer le logId de la collecte');
      }
      
      refetchLogs();
    } catch (error) {
      console.error('Collection error:', error);
      toast.error('Erreur lors du lancement de la collecte');
      setIsCollecting(false);
      setIsLaunching(false);
      setShowProgressModal(false);
    }
  };

  const handleProgressModalClose = () => {
    setShowProgressModal(false);
    setCurrentLogId(null);
    setCurrentCollectionTypes([]);
    setIsCollecting(false);
    setIsLaunching(false);
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

  // Ouvrir la modale de suivi pour un log donné
  const openProgressForLog = (log: DataCollectionLog) => {
    const types = log.collection_type
      ? log.collection_type.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    setCurrentCollectionTypes(types);
    setCurrentLogId(log.id);
    setShowProgressModal(true);
    setIsLaunching(false);
    setIsCollecting(log.status === 'running');
  };

  // Reprise automatique si une collecte est en cours
  useEffect(() => {
    if (!showProgressModal && logs && logs.length > 0) {
      const running = logs.find((l: DataCollectionLog) => l.status === 'running');
      if (running) {
        openProgressForLog(running);
        toast.info('Reprise du suivi de la collecte en cours');
      }
    }
  }, [logs, showProgressModal]);

  // Vérifier si une collecte est bloquée (>60s sans ping)
  const blockedLog = logs?.find((l: DataCollectionLog) => {
    if (l.status !== 'running') return false;
    const lastPing = (l as any).last_ping;
    if (!lastPing) return false;
    const ageSeconds = Math.floor((Date.now() - new Date(lastPing).getTime()) / 1000);
    return ageSeconds > 60;
  });

  const handleForceStopAndRestart = async () => {
    if (!logs || logs.length === 0) return;
    
    try {
      // Trouver le log en cours
      const runningLog = logs.find((l: DataCollectionLog) => l.status === 'running');
      if (!runningLog) {
        toast.error('Aucune collecte en cours à arrêter');
        return;
      }

      setIsLaunching(true);
      toast.info('Arrêt forcé et relance de la collecte...');

      // 1. Forcer l'arrêt du log en cours
      await supabase
        .from('data_collection_logs')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.floor((Date.now() - new Date(runningLog.started_at).getTime()) / 1000),
          summary_stats: {
            ...((runningLog.summary_stats as any) || {}),
            current_data_type: 'Arrêt forcé ❌',
            error: 'Arrêt forcé par l\'utilisateur'
          }
        })
        .eq('id', runningLog.id);

      // 2. Récupérer les types de collecte du log arrêté
      const collectionTypes = runningLog.collection_type
        ? runningLog.collection_type.split(',').map((t) => t.trim()).filter(Boolean)
        : ['biodiversity', 'weather', 'real_estate'];

      // 3. Relancer immédiatement une nouvelle collecte
      const { data: result, error: triggerError } = await supabase.functions.invoke('batch-data-collector', {
        body: {
          collectionTypes,
          mode: 'manual',
          batchMode: true
        }
      });

      if (triggerError || !result?.success) {
        throw new Error(triggerError?.message || result?.error || 'Erreur lors du redémarrage');
      }

      // 4. Ouvrir la modale de suivi pour le nouveau log
      setCurrentLogId(result.logId);
      setCurrentCollectionTypes(collectionTypes);
      setShowProgressModal(true);
      setIsCollecting(true);

      toast.success('Collecte relancée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du forçage arrêt/relance:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du forçage arrêt/relance');
    } finally {
      setIsLaunching(false);
    }
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
            <div className="flex items-center gap-2">
              <span className="font-medium">Biodiversité</span>
              <SearchRadiusTooltip dataType="biodiversity" />
            </div>
            <span className="text-xs text-muted-foreground">Rayon 500m • eBird + iNaturalist</span>
          </Button>

          <Button
            onClick={() => handleTriggerCollection(['weather'])}
            disabled={isCollecting}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <div className="text-blue-600 mb-2">🌤️</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Météo</span>
              <SearchRadiusTooltip dataType="weather" />
            </div>
            <span className="text-xs text-muted-foreground">Point exact • Open-Meteo</span>
          </Button>

          <Button
            onClick={() => handleTriggerCollection(['real_estate'])}
            disabled={isCollecting}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <div className="text-purple-600 mb-2">🏠</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Immobilier</span>
              <SearchRadiusTooltip dataType="realEstate" />
            </div>
            <span className="text-xs text-muted-foreground">Parcelle exacte • LEXICON</span>
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => handleTriggerCollection(['biodiversity', 'weather', 'real_estate'])}
              disabled={isCollecting || isLaunching}
              className="w-full"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lancement...
                </>
              ) : (
                'Lancer Collecte Complète'
              )}
            </Button>

            {/* Bouton Forcer Arrêt + Relancer si collecte bloquée */}
            {blockedLog && (
              <Button
                onClick={handleForceStopAndRestart}
                disabled={isLaunching}
                variant="destructive"
                className="w-full mt-2"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redémarrage...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Forcer Arrêt + Relancer
                  </>
                )}
              </Button>
            )}
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Historique des Collectes</h3>
          </div>
          <Button
            onClick={() => deleteAllFailedLogs.mutate()}
            disabled={deleteAllFailedLogs.isPending || !logs?.some(log => log.status === 'failed')}
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash className="w-4 h-4 mr-2" />
            Nettoyer les échecs
          </Button>
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

                <div className="flex items-center gap-2">
                  <Badge 
                    variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {log.status === 'completed' ? 'Terminé' : 
                     log.status === 'failed' ? 'Échec' : 
                     log.status === 'running' ? 'En cours' : log.status}
                  </Badge>

                  <Button
                    onClick={() => openProgressForLog(log)}
                    variant="secondary"
                    size="sm"
                  >
                    {log.status === 'running' ? 'Suivre en temps réel' : 'Voir'}
                  </Button>
                  
                  <Button
                    onClick={() => deleteLog.mutate(log.id)}
                    disabled={deleteLog.isPending}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Supprimer le log"
                    title="Supprimer ce log"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
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

      {/* Debug Progress Modal */}
      <DebugCollectionProgressModal
        isOpen={showProgressModal}
        onClose={handleProgressModalClose}
        logId={currentLogId}
        collectionTypes={currentCollectionTypes}
        isLaunching={isLaunching}
      />
    </div>
  );
};

export default DataCollectionPanel;