
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  PlayCircle, 
  PauseCircle,
  Database, 
  Image, 
  Music, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Clock,
  BarChart3,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
  details?: any;
  logs: string[];
}

const MigrationControlPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<MigrationStep[]>([
    {
      id: 'data-migration',
      name: 'Migration des Données',
      description: 'Import des marches depuis Google Sheets',
      status: 'pending',
      progress: 0,
      logs: []
    },
    {
      id: 'media-migration', 
      name: 'Migration des Médias',
      description: 'Téléchargement et upload des photos/audio',
      status: 'pending',
      progress: 0,
      logs: []
    }
  ]);

  const [globalStats, setGlobalStats] = useState({
    totalMarches: 0,
    processedMarches: 0,
    totalFiles: 0,
    processedFiles: 0,
    errors: 0
  });

  const updateStepStatus = (stepId: string, updates: Partial<MigrationStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, ...updates, logs: [...step.logs, ...(updates.logs || [])] }
        : step
    ));
  };

  const addLog = (stepId: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    updateStepStatus(stepId, { 
      logs: [`[${timestamp}] ${message}`] 
    });
  };

  const startMigration = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    toast.info('🚀 Démarrage de la migration complète...');
    
    try {
      // Phase 1: Migration des données
      await executeDataMigration();
      
      // Phase 2: Migration des médias  
      await executeMediaMigration();
      
      toast.success('🎉 Migration complète terminée avec succès !');
      
    } catch (error) {
      console.error('Erreur globale de migration:', error);
      toast.error(`❌ Erreur de migration: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const executeDataMigration = async () => {
    setCurrentStep(0);
    updateStepStatus('data-migration', {
      status: 'running',
      startTime: Date.now(),
      progress: 10
    });

    addLog('data-migration', '🔄 Connexion à Google Sheets...');

    try {
      const { data, error } = await supabase.functions.invoke('migrate-google-sheets');

      if (error) {
        throw new Error(error.message);
      }

      updateStepStatus('data-migration', { progress: 50 });
      addLog('data-migration', `📊 ${data.totalRows} lignes trouvées dans Google Sheets`);

      if (data.success) {
        updateStepStatus('data-migration', { progress: 100 });
        addLog('data-migration', `✅ ${data.successCount} marches migrées avec succès`);
        
        if (data.errorCount > 0) {
          addLog('data-migration', `⚠️ ${data.errorCount} erreurs rencontrées`);
        }

        setGlobalStats(prev => ({
          ...prev,
          totalMarches: data.totalRows,
          processedMarches: data.successCount,
          errors: prev.errors + data.errorCount
        }));

        updateStepStatus('data-migration', {
          status: 'completed',
          endTime: Date.now(),
          details: {
            totalRows: data.totalRows,
            successCount: data.successCount,
            errorCount: data.errorCount,
            results: data.results
          }
        });

        addLog('data-migration', '🎯 Migration des données terminée');

      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      updateStepStatus('data-migration', {
        status: 'error',
        endTime: Date.now()
      });
      addLog('data-migration', `❌ Erreur: ${error.message}`);
      throw error;
    }
  };

  const executeMediaMigration = async () => {
    setCurrentStep(1);
    updateStepStatus('media-migration', {
      status: 'running',
      startTime: Date.now(),
      progress: 10
    });

    addLog('media-migration', '🔄 Démarrage de la migration des médias...');

    try {
      const { data, error } = await supabase.functions.invoke('migrate-google-drive-media');

      if (error) {
        throw new Error(error.message);
      }

      updateStepStatus('media-migration', { progress: 50 });
      addLog('media-migration', `📁 ${data.marchesProcessed} dossiers Google Drive à traiter`);

      if (data.success) {
        updateStepStatus('media-migration', { progress: 100 });
        addLog('media-migration', `📸 ${data.totalFiles} fichiers médias migrés`);
        
        if (data.errorCount > 0) {
          addLog('media-migration', `⚠️ ${data.errorCount} erreurs sur les médias`);
        }

        setGlobalStats(prev => ({
          ...prev,
          totalFiles: data.totalFiles,
          processedFiles: data.totalFiles,
          errors: prev.errors + data.errorCount
        }));

        updateStepStatus('media-migration', {
          status: 'completed',
          endTime: Date.now(),
          details: {
            marchesProcessed: data.marchesProcessed,
            successCount: data.successCount,
            errorCount: data.errorCount,
            totalFiles: data.totalFiles,
            results: data.results
          }
        });

        addLog('media-migration', '🎯 Migration des médias terminée');

      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      updateStepStatus('media-migration', {
        status: 'error',
        endTime: Date.now()
      });
      addLog('media-migration', `❌ Erreur: ${error.message}`);
      throw error;
    }
  };

  const getStepIcon = (step: MigrationStep) => {
    switch (step.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDuration = (startTime?: number, endTime?: number) => {
    if (!startTime) return '-';
    const duration = (endTime || Date.now()) - startTime;
    return `${Math.round(duration / 1000)}s`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header avec statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Marches</p>
                <p className="text-xl font-bold">{globalStats.processedMarches}/{globalStats.totalMarches}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Médias</p>
                <p className="text-xl font-bold">{globalStats.processedFiles}/{globalStats.totalFiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Progression</p>
                <p className="text-xl font-bold">
                  {Math.round(((globalStats.processedMarches + globalStats.processedFiles) / 
                    (globalStats.totalMarches + globalStats.totalFiles)) * 100) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Erreurs</p>
                <p className="text-xl font-bold">{globalStats.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles principaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            Contrôle de Migration
          </CardTitle>
          <CardDescription>
            Exécution automatisée de la migration complète depuis Google Sheets et Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={startMigration}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migration en cours...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Démarrer la Migration Complète
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Timeline des étapes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <Card key={step.id} className={currentStep === index && isRunning ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStepIcon(step)}
                  <span>{step.name}</span>
                </div>
                <Badge variant={
                  step.status === 'completed' ? 'default' :
                  step.status === 'error' ? 'destructive' :
                  step.status === 'running' ? 'secondary' : 'outline'
                }>
                  {step.status === 'pending' ? 'En attente' :
                   step.status === 'running' ? 'En cours' :
                   step.status === 'completed' ? 'Terminé' : 'Erreur'}
                </Badge>
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {step.progress > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression</span>
                    <span>{step.progress}%</span>
                  </div>
                  <Progress value={step.progress} className="h-2" />
                </div>
              )}

              {(step.startTime || step.endTime) && (
                <div className="text-sm text-gray-600">
                  <p>Durée: {formatDuration(step.startTime, step.endTime)}</p>
                </div>
              )}

              {step.logs.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Logs temps réel
                  </p>
                  <ScrollArea className="h-32 bg-gray-50 p-2 rounded text-xs font-mono">
                    {step.logs.map((log, logIndex) => (
                      <div key={logIndex} className="mb-1">{log}</div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MigrationControlPanel;
