import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { 
  Download, 
  Upload, 
  Database, 
  Image, 
  Music, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  RefreshCw,
  PlayCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationResult {
  ville?: string;
  marche?: string;
  status: 'success' | 'error' | 'processing';
  error?: string;
  marcheId?: string;
  filesProcessed?: number;
  files?: Array<{
    name: string;
    type: 'photo' | 'audio';
    status: 'success' | 'error';
    error?: string;
  }>;
}

interface MigrationStats {
  totalRows?: number;
  successCount: number;
  errorCount: number;
  totalFiles?: number;
  marchesProcessed?: number;
}

const MigrationAdminPanel: React.FC = () => {
  const [isDataMigrating, setIsDataMigrating] = useState(false);
  const [isMediaMigrating, setIsMediaMigrating] = useState(false);
  const [dataResults, setDataResults] = useState<MigrationResult[]>([]);
  const [mediaResults, setMediaResults] = useState<MigrationResult[]>([]);
  const [dataStats, setDataStats] = useState<MigrationStats | null>(null);
  const [mediaStats, setMediaStats] = useState<MigrationStats | null>(null);

  const handleDataMigration = async () => {
    setIsDataMigrating(true);
    setDataResults([]);
    setDataStats(null);

    try {
      console.log('🚀 Starting data migration...');
      toast.info('Migration des données démarrée...');

      const { data, error } = await supabase.functions.invoke('migrate-google-sheets');

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setDataResults(data.results || []);
        setDataStats({
          totalRows: data.totalRows,
          successCount: data.successCount,
          errorCount: data.errorCount
        });

        toast.success(`Migration terminée : ${data.successCount} succès, ${data.errorCount} erreurs`);
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Migration error:', error);
      toast.error(`Erreur de migration : ${error.message}`);
    } finally {
      setIsDataMigrating(false);
    }
  };

  const handleMediaMigration = async () => {
    setIsMediaMigrating(true);
    setMediaResults([]);
    setMediaStats(null);

    try {
      console.log('🚀 Starting media migration...');
      toast.info('Migration des médias démarrée...');

      const { data, error } = await supabase.functions.invoke('migrate-google-drive-media');

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setMediaResults(data.results || []);
        setMediaStats({
          marchesProcessed: data.marchesProcessed,
          successCount: data.successCount,
          errorCount: data.errorCount,
          totalFiles: data.totalFiles
        });

        toast.success(`Migration médias terminée : ${data.totalFiles} fichiers traités`);
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Media migration error:', error);
      toast.error(`Erreur de migration médias : ${error.message}`);
    } finally {
      setIsMediaMigrating(false);
    }
  };

  const resetMigration = () => {
    setDataResults([]);
    setMediaResults([]);
    setDataStats(null);
    setMediaStats(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-crimson font-bold text-gray-800">
          Migration Supabase V1
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Configuration et préparation de la migration vers Supabase
        </p>
      </div>

      {/* Nouveau bouton pour l'exécution complète */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <PlayCircle className="h-5 w-5" />
            Migration Complète Automatisée
          </CardTitle>
          <CardDescription>
            Exécuter la migration complète des données et médias avec suivi en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = '/admin/migration/execute'}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Lancer la Migration Complète
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Migration des données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Migration des Données
            </CardTitle>
            <CardDescription>
              Importer toutes les marches depuis Google Sheets vers Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleDataMigration}
              disabled={isDataMigrating}
              className="w-full"
              size="lg"
            >
              {isDataMigrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migration en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Migrer les données
                </>
              )}
            </Button>

            {dataStats && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total lignes traitées :</span>
                  <Badge variant="outline">{dataStats.totalRows}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Succès :</span>
                  <Badge variant="default" className="bg-green-500">{dataStats.successCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Erreurs :</span>
                  <Badge variant="destructive">{dataStats.errorCount}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migration des médias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" />
              Migration des Médias
            </CardTitle>
            <CardDescription>
              Télécharger et uploader tous les médias depuis Google Drive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleMediaMigration}
              disabled={isMediaMigrating}
              className="w-full"
              size="lg"
            >
              {isMediaMigrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migration en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Migrer les médias
                </>
              )}
            </Button>

            {mediaStats && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Marches traitées :</span>
                  <Badge variant="outline">{mediaStats.marchesProcessed}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fichiers migrés :</span>
                  <Badge variant="default" className="bg-blue-500">{mediaStats.totalFiles}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Succès :</span>
                  <Badge variant="default" className="bg-green-500">{mediaStats.successCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Erreurs :</span>
                  <Badge variant="destructive">{mediaStats.errorCount}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions utilitaires */}
      <div className="flex justify-center">
        <Button 
          onClick={resetMigration}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>

      <Separator />

      {/* Résultats détaillés */}
      {(dataResults.length > 0 || mediaResults.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Résultats migration données */}
          {dataResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résultats - Migration Données</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {dataResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">{result.ville}</span>
                        </div>
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                          {result.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Résultats migration médias */}
          {mediaResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résultats - Migration Médias</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {mediaResults.map((result, index) => (
                      <div key={index} className="p-2 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {result.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium">{result.marche}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.filesProcessed && (
                              <Badge variant="outline" className="text-xs">
                                {result.filesProcessed} fichiers
                              </Badge>
                            )}
                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {result.files && result.files.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {result.files.map((file, fileIndex) => (
                              <Badge 
                                key={fileIndex} 
                                variant="secondary" 
                                className={`text-xs ${file.type === 'photo' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}
                              >
                                {file.type === 'photo' ? (
                                  <Image className="h-3 w-3 mr-1" />
                                ) : (
                                  <Music className="h-3 w-3 mr-1" />
                                )}
                                {file.name.substring(0, 20)}...
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrationAdminPanel;
