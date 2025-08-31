import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileJson, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Eye, 
  Database,
  Bot,
  Link,
  BookOpen,
  BarChart3
} from 'lucide-react';

interface ImportData {
  exploration_id: string;
  marche_id: string;
  dimensions: Record<string, any>;
  fables?: Array<any>;
  sources: Array<any>;
  metadata: {
    ai_model: string;
    sourcing_date: string;
    validation_level: string;
    quality_score: number;
    completeness_score: number;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

interface PreviewData {
  dimensions_count: number;
  fables_count: number;
  sources_count: number;
  completude_score: number;
  quality_score: number;
}

interface OpusImportInterfaceProps {
  marcheId: string;
  marcheName: string;
  explorationId?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const OpusImportInterface: React.FC<OpusImportInterfaceProps> = ({
  marcheId,
  marcheName,
  explorationId,
  onSuccess,
  onClose
}) => {
  const { toast } = useToast();
  const [jsonContent, setJsonContent] = useState('');
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'success'>('input');

  const parseAndValidateJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonContent);
      
      // Compléter avec les IDs requis
      const completeData: ImportData = {
        ...parsed,
        marche_id: marcheId,
        exploration_id: explorationId || parsed.exploration_id
      };
      
      setImportData(completeData);
      return completeData;
    } catch (error) {
      toast({
        title: "Erreur JSON",
        description: "Format JSON invalide",
        variant: "destructive"
      });
      return null;
    }
  }, [jsonContent, marcheId, explorationId, toast]);

  const previewImport = async () => {
    const data = parseAndValidateJson();
    if (!data) return;

    setIsProcessing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('opus-import-ai', {
        body: { data, preview: true }
      });

      if (error) throw error;

      setValidation(result.validation);
      setPreview(result.preview);
      setStep('preview');

      toast({
        title: "Prévisualisation générée",
        description: `${result.preview.dimensions_count} dimensions détectées`
      });

    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Erreur de prévisualisation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeImport = async () => {
    if (!importData) return;

    setIsProcessing(true);
    setStep('importing');

    try {
      const { data: result, error } = await supabase.functions.invoke('opus-import-ai', {
        body: { data: importData, preview: false }
      });

      if (error) throw error;

      if (result.success) {
        setStep('success');
        toast({
          title: "Import réussi",
          description: `Données IA importées pour ${marcheName}`
        });
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Erreur d\'import');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setJsonContent('');
    setImportData(null);
    setValidation(null);
    setPreview(null);
    setStep('input');
  };

  if (step === 'success') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">Import Réussi !</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Les données IA ont été importées avec succès pour <strong>{marcheName}</strong></p>
          
          {preview && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{preview.dimensions_count}</div>
                <div className="text-sm text-muted-foreground">Dimensions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{preview.fables_count}</div>
                <div className="text-sm text-muted-foreground">Fables</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{preview.sources_count}</div>
                <div className="text-sm text-muted-foreground">Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{preview.completude_score}%</div>
                <div className="text-sm text-muted-foreground">Complétude</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center pt-4">
            <Button onClick={reset}>Nouvel Import</Button>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Import IA - {marcheName}
          </h2>
          <p className="text-muted-foreground">
            Importez les données sourcées par votre IA pour enrichir automatiquement toutes les dimensions
          </p>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Données JSON IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`{
  "dimensions": {
    "contexte_hydrologique": { ... },
    "especes_caracteristiques": { ... },
    ...
  },
  "fables": [ ... ],
  "sources": [ ... ],
  "metadata": { ... }
}`}
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={previewImport}
                disabled={!jsonContent.trim() || isProcessing}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {isProcessing ? 'Analyse...' : 'Prévisualiser'}
              </Button>
              
              <Button variant="outline" onClick={reset} disabled={isProcessing}>
                Effacer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && validation && preview && (
        <div className="space-y-4">
          {/* Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validation.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                Validation ({validation.score}/100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={validation.score} className="mb-4" />
              
              {validation.errors.length > 0 && (
                <Alert variant="destructive" className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erreurs:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {validation.warnings.length > 0 && (
                <Alert className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Avertissements:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Aperçu des données */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.dimensions_count}</div>
                <div className="text-sm text-muted-foreground">Dimensions</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.fables_count}</div>
                <div className="text-sm text-muted-foreground">Fables</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Link className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.sources_count}</div>
                <div className="text-sm text-muted-foreground">Sources</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.completude_score}%</div>
                <div className="text-sm text-muted-foreground">Complétude</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={reset}>
              Annuler
            </Button>
            <Button 
              onClick={executeImport}
              disabled={!validation.isValid || isProcessing}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isProcessing ? 'Import...' : 'Importer'}
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Import en cours...</h3>
            <p className="text-muted-foreground">
              Traitement des données IA pour {marcheName}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};