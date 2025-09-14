import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Save,
  Cloud,
  CloudOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  History,
  RotateCcw
} from 'lucide-react';

interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSaved: Date | null;
  changes: number;
  message?: string;
}

interface SaveVersion {
  id: string;
  timestamp: Date;
  data: any;
  label: string;
  changes: string[];
}

interface OpusProgressiveSaveProps {
  data: any;
  marcheId: string;
  explorationId?: string;
  onSave?: (data: any) => Promise<void>;
  autoSaveInterval?: number; // en millisecondes
  maxVersions?: number;
}

export const OpusProgressiveSave: React.FC<OpusProgressiveSaveProps> = ({
  data,
  marcheId,
  explorationId,
  onSave,
  autoSaveInterval = 30000, // 30 secondes par défaut
  maxVersions = 10
}) => {
  const { toast } = useToast();
  const [saveState, setSaveState] = useState<SaveState>({
    status: 'idle',
    lastSaved: null,
    changes: 0
  });
  const [versions, setVersions] = useState<SaveVersion[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showVersions, setShowVersions] = useState(false);

  // Clé pour le localStorage
  const storageKey = `opus_draft_${marcheId}_${explorationId || 'default'}`;
  const versionsKey = `opus_versions_${marcheId}_${explorationId || 'default'}`;

  // Surveiller la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sauvegarder localement
  const saveLocally = useCallback((dataToSave: any, label?: string) => {
    try {
      const saveData = {
        data: dataToSave,
        timestamp: new Date().toISOString(),
        marcheId,
        explorationId,
        label: label || 'Sauvegarde automatique'
      };

      // Sauvegarder en localStorage
      localStorage.setItem(storageKey, JSON.stringify(saveData));

      // Créer une nouvelle version
      const newVersion: SaveVersion = {
        id: Date.now().toString(),
        timestamp: new Date(),
        data: dataToSave,
        label: label || `Auto-save ${new Date().toLocaleTimeString()}`,
        changes: [] // TODO: calculer les changements
      };

      // Gérer les versions (garder les N plus récentes)
      setVersions(prev => {
        const updated = [newVersion, ...prev].slice(0, maxVersions);
        localStorage.setItem(versionsKey, JSON.stringify(updated));
        return updated;
      });

      return true;
    } catch (error) {
      console.error('Erreur sauvegarde locale:', error);
      return false;
    }
  }, [storageKey, versionsKey, marcheId, explorationId, maxVersions]);

  // Sauvegarder sur le serveur
  const saveRemotely = useCallback(async (dataToSave: any) => {
    if (!isOnline || !onSave) return false;

    try {
      await onSave(dataToSave);
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde serveur:', error);
      return false;
    }
  }, [isOnline, onSave]);

  // Sauvegarde complète (locale + serveur)
  const performSave = useCallback(async (dataToSave: any, label?: string, forceRemote = false) => {
    setSaveState(prev => ({ ...prev, status: 'saving' }));

    try {
      // Toujours sauvegarder localement
      const localSuccess = saveLocally(dataToSave, label);
      
      if (!localSuccess) {
        throw new Error('Échec sauvegarde locale');
      }

      // Tenter la sauvegarde serveur si en ligne
      let remoteSuccess = true;
      if (isOnline && onSave) {
        remoteSuccess = await saveRemotely(dataToSave);
      }

      const now = new Date();
      
      if (remoteSuccess && isOnline) {
        setSaveState({
          status: 'saved',
          lastSaved: now,
          changes: 0,
          message: 'Sauvegardé sur le serveur'
        });
        
        if (forceRemote) {
          toast({
            title: "✅ Sauvegardé",
            description: "Vos données ont été sauvegardées sur le serveur",
          });
        }
      } else if (localSuccess) {
        setSaveState({
          status: isOnline ? 'error' : 'offline',
          lastSaved: now,
          changes: 0,
          message: isOnline ? 'Sauvegardé localement (erreur serveur)' : 'Sauvegardé localement (hors ligne)'
        });
        
        if (forceRemote) {
          toast({
            title: isOnline ? "⚠️ Sauvegarde partielle" : "📱 Sauvegarde hors ligne",
            description: isOnline ? 
              "Sauvegardé localement, erreur serveur" : 
              "Sauvegardé localement, sera synchronisé quand vous serez en ligne",
            variant: isOnline ? "destructive" : "default"
          });
        }
      }
    } catch (error) {
      setSaveState({
        status: 'error',
        lastSaved: saveState.lastSaved,
        changes: saveState.changes,
        message: 'Erreur de sauvegarde'
      });
      
      toast({
        title: "❌ Erreur de sauvegarde",
        description: "Impossible de sauvegarder vos données",
        variant: "destructive"
      });
    }
  }, [saveLocally, saveRemotely, isOnline, onSave, saveState.lastSaved, saveState.changes, toast]);

  // Auto-save
  useEffect(() => {
    if (!data || saveState.status === 'saving') return;

    const timer = setTimeout(() => {
      performSave(data);
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [data, autoSaveInterval, performSave, saveState.status]);

  // Détecter les changements
  useEffect(() => {
    setSaveState(prev => ({
      ...prev,
      changes: prev.changes + 1
    }));
  }, [data]);

  // Charger les versions au démarrage
  useEffect(() => {
    try {
      const savedVersions = localStorage.getItem(versionsKey);
      if (savedVersions) {
        const parsedVersions = JSON.parse(savedVersions).map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
        setVersions(parsedVersions);
      }
    } catch (error) {
      console.error('Erreur chargement versions:', error);
    }
  }, [versionsKey]);

  // Restaurer une version
  const restoreVersion = (version: SaveVersion) => {
    // Implémenter la restauration selon votre logique
    console.log('Restaurer version:', version);
    toast({
      title: "🔄 Version restaurée",
      description: `Données restaurées de ${version.label}`,
    });
  };

  // Sauvegarde manuelle
  const handleManualSave = () => {
    performSave(data, `Sauvegarde manuelle ${new Date().toLocaleTimeString()}`, true);
  };

  // Synchroniser quand on revient en ligne
  useEffect(() => {
    if (isOnline && saveState.status === 'offline') {
      performSave(data, 'Synchronisation auto');
    }
  }, [isOnline, saveState.status, performSave, data]);

  const getStatusIcon = () => {
    switch (saveState.status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'saved':
        return isOnline ? <Cloud className="w-4 h-4 text-success" /> : <Save className="w-4 h-4 text-info" />;
      case 'offline':
        return <CloudOff className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Save className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (saveState.status) {
      case 'saved':
        return 'border-success/30 bg-success/10';
      case 'saving':
        return 'border-info/30 bg-info/10';
      case 'offline':
        return 'border-warning/30 bg-warning/10';
      case 'error':
        return 'border-destructive/30 bg-destructive/10';
      default:
        return 'border-border bg-background';
    }
  };

  return (
    <div className="space-y-3">
      {/* Status principal */}
      <Alert className={`${getStatusColor()} transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <AlertDescription className="mb-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {saveState.status === 'saving' && 'Sauvegarde en cours...'}
                  {saveState.status === 'saved' && (isOnline ? 'Sauvegardé sur le serveur' : 'Sauvegardé localement')}
                  {saveState.status === 'offline' && 'Sauvegardé hors ligne'}
                  {saveState.status === 'error' && 'Erreur de sauvegarde'}
                  {saveState.status === 'idle' && 'Prêt à sauvegarder'}
                </span>
                {saveState.lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    • {saveState.lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
              {saveState.message && (
                <div className="text-xs text-muted-foreground mt-1">
                  {saveState.message}
                </div>
              )}
            </AlertDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {versions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersions(!showVersions)}
              >
                <History className="w-4 h-4 mr-1" />
                {versions.length}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={saveState.status === 'saving'}
            >
              {saveState.status === 'saving' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Sauvegarder
            </Button>
          </div>
        </div>
      </Alert>

      {/* Liste des versions */}
      {showVersions && versions.length > 0 && (
        <Alert>
          <History className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Versions sauvegardées :</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {versions.map(version => (
                  <div 
                    key={version.id} 
                    className="flex items-center justify-between p-2 rounded border text-sm"
                  >
                    <div>
                      <div className="font-medium">{version.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {version.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreVersion(version)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restaurer
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};