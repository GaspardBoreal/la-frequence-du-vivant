import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationMarches } from '@/hooks/useExplorations';
import { OpusImportValidationPanel } from './OpusImportValidationPanel';
import { 
  Upload, 
  FileJson, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Eye, 
  Database,
  Bot,
  Copy,
  Zap,
  Target,
  Wand2,
  BookOpen,
  Info
} from 'lucide-react';

interface ImportData {
  exploration_id: string;
  marche_id: string;
  dimensions: Record<string, any>;
  fables?: Array<any>;
  sources: Array<any>;
  metadata?: {
    [key: string]: any;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  completenessScore?: number;
  dimensionCount?: number;
  sourceCount?: number;
  fableCount?: number;
}

interface PreviewData {
  dimensions_count: number;
  fables_count: number;
  sources_count: number;
  completude_score: number;
  quality_score: number;
}

interface SanitizationCorrection {
  type: 'python_token' | 'unquoted_placeholder' | 'single_quotes' | 'trailing_comma' | 'unquoted_date' | 'smart_quotes';
  before: string;
  after: string;
  position: string;
}

interface OptimizedOpusImportInterfaceProps {
  marcheId: string;
  marcheName: string;
  explorationId?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const OptimizedOpusImportInterface: React.FC<OptimizedOpusImportInterfaceProps> = ({
  marcheId,
  marcheName,
  explorationId,
  onSuccess,
  onClose
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jsonContent, setJsonContent] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'success'>('input');
  const [selectedMarcheId, setSelectedMarcheId] = useState<string>(marcheId);
  const [selectedMarcheName, setSelectedMarcheName] = useState<string>(marcheName);
  const [sanitizationCorrections, setSanitizationCorrections] = useState<SanitizationCorrection[]>([]);
  const [showCorrections, setShowCorrections] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);

  const { data: explorationMarches = [] } = useExplorationMarches(explorationId || '');
  
  const currentMarcheId = selectedMarcheId || marcheId;
  const currentMarcheName = selectedMarcheName || marcheName;

  // Données de test Dordogne optimisées
  const loadDordogneTestData = useCallback(() => {
    const testData = {
      "dimensions": {
        "hydrologie": {
          "description": "Caractéristiques hydrologiques de l'estuaire de la Gironde et de la confluence Dordogne-Garonne",
          "donnees": {
            "regime_hydrologique": {
              "intitule": "Estuaire hypersynchrone avec marées semi-diurnes",
              "source_ids": ["S01"]
            },
            "debit_moyen": "450 m³/s (étiage critique < 200 m³/s)",
            "qualite_eau": {
              "resume": "Intrusion saline accrue lors d'étiages, hypoxies estivales récurrentes",
              "source_ids": ["S01", "S02"]
            }
          }
        },
        "biodiversite": {
          "description": "Espèces aquatiques et terrestres caractéristiques de l'estuaire gironder",
          "donnees": {
            "especes_aquatiques": [
              {
                "nom_scientifique": "Alosa alosa",
                "nom_commun": "Grande alose",
                "statut": "Vulnérable",
                "source_ids": ["S03"]
              }
            ]
          }
        },
        "vocabulaire": {
          "description": "Terminologie technique et locale liée aux milieux estuariens",
          "donnees": {
            "termes_techniques": [
              {
                "terme": "Hypersynchronisme",
                "definition": "Amplification du marnage vers l'amont dans un estuaire en entonnoir",
                "source_ids": ["S01"]
              }
            ]
          }
        },
        "technodiversite": {
          "description": "Technologies et innovations pour la gestion estuarienne",
          "donnees": {
            "technologies_observation": [
              {
                "nom": "Réseau MAGEST",
                "description": "Mesures automatisées qualité eau estuaire", 
                "operateur": "EP Garonne",
                "source_ids": ["S07"]
              }
            ]
          }
        },
        "empreintes_humaines": {
          "description": "Infrastructures et aménagements anthropiques sur l'estuaire",
          "donnees": {
            "industrielles": [
              {
                "nom": "Terminal conteneurs Bassens",
                "type": "Infrastructure portuaire",
                "impact": "Dragage permanent, trafic maritime",
                "source_ids": ["S10"]
              }
            ]
          }
        }
      },
      "fables": [
        {
          "titre": "Le Dialogue des Marées",
          "contenu_principal": "Dans l'estuaire de la Gironde, deux voix se répondent éternellement : celle du Flot qui remonte fièrement vers les terres, porteur de sel et de mystères océaniques, et celle du Jusant qui redescend, chargé de terres et d'histoires continentales.",
          "ordre": 1,
          "dimension": "hydrologie",
          "tags": ["marées", "estuaire", "dialogue"]
        }
      ],
      "sources": [
        {
          "titre": "Marées estuaire Gironde - Traversée Bordeaux",
          "url": "https://traverseedebordeaux.com/spip.php?article9",
          "type": "web",
          "auteur": "Association Traversée de Bordeaux",
          "date_publication": "2023-05-15",
          "date_acces": "2025-09-08",
          "fiabilite": 85,
          "references": ["S01"]
        },
        {
          "titre": "Qualité eau estuaire - Réseau MAGEST",
          "url": "https://www.ep-garonne.fr/mesure-de-la-qualite-de-leau-de-lestuaire.html", 
          "type": "institutionnel",
          "auteur": "EP Garonne",
          "fiabilite": 95,
          "references": ["S02", "S07"]
        }
      ],
      "metadata": {
        "sourcing_date": "2025-09-08",
        "ai_model": "Claude-3.5-Sonnet",
        "notes": "Données d'exemple optimisées pour test système d'import"
      }
    };
    
    setJsonContent(JSON.stringify(testData, null, 2));
    toast({
      title: "🧪 Test Dordogne chargé",
      description: "5 dimensions + fables + sources prêtes à importer",
    });
  }, [toast]);

const sanitizeJson = useCallback((jsonString: string): { sanitized: string; corrections: SanitizationCorrection[] } => {
    if (!jsonString) return jsonString;

    const replacePythonTokensOutsideStrings = (input: string) => {
      let out = '';
      let inDouble = false;
      let inSingle = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '"' && !inSingle && input[i - 1] !== '\\') { inDouble = !inDouble; out += ch; continue; }
        if (ch === '\'' && !inDouble && input[i - 1] !== '\\') { inSingle = !inSingle; out += ch; continue; }
        if (!inDouble && !inSingle) {
          if (input.startsWith('None', i)) { out += 'null'; i += 3; continue; }
          if (input.startsWith('True', i)) { out += 'true'; i += 3; continue; }
          if (input.startsWith('False', i)) { out += 'false'; i += 4; continue; }
        }
        out += ch;
      }
      return out;
    };
    
    let sanitized = replacePythonTokensOutsideStrings(jsonString)
      // Remove markdown comments (lines starting with #)
      .replace(/^[ \t]*#.*$/gm, '')
      // Remove parentheses around string values: "key": ("value") → "key": "value"
      .replace(/:\s*\(\s*"/g, ': "')
      .replace(/"\s*\)/g, '"')
      // Convert common single-quoted values to double quotes
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/,\s*'([^']*)'/g, ', "$1"')
      .replace(/\[\s*'([^']*)'/g, '["$1"')
      .replace(/'([^']*)'\s*\]/g, '"$1"]')
      // Merge adjacent string values on separate lines: "text1"\n"text2" → "text1 text2"
      .replace(/"([^"]*?)"\s*[\r\n]+\s*"([^"]*?)"/g, '"$1 $2"')
      .replace(/"([^"]*?)"\s*[\r\n]+\s*"([^"]*?)"/g, '"$1 $2"')
      .replace(/"([^"]*?)"\s*[\r\n]+\s*"([^"]*?)"/g, '"$1 $2"')
      // Normalize smart quotes
      .replace(/[”|“]/g, '"')
      .replace(/[’|‘]/g, "'")
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Remove invalid escape sequences
      .replace(/\\(\[|\]|\(|\)|~)/g, '$1')
      .replace(/\\(_)/g, '$1')
      .replace(/\\\\/g, '\\')
      // Clean up multiple empty lines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    return sanitized;
  }, []);

  const handleCleanPythonJson = useCallback(() => {
    if (!jsonContent.trim()) {
      toast({ title: 'Rien à nettoyer', description: 'Ajoutez d\'abord du JSON', variant: 'destructive' });
      return;
    }
    try {
      const result = sanitizeJson(jsonContent);
      setJsonContent(result.sanitized);
      setSanitizationCorrections(result.corrections);
      
      if (result.corrections.length > 0) {
        setShowCorrections(true);
        toast({ 
          title: 'Nettoyage effectué', 
          description: `${result.corrections.length} correction(s) automatique(s) appliquée(s)` 
        });
      } else {
        toast({ 
          title: 'JSON déjà propre', 
          description: 'Aucune correction nécessaire' 
        });
      }
      
      JSON.parse(result.sanitized);
    } catch (e) {
      toast({ 
        title: 'Nettoyage partiel', 
        description: 'Certaines erreurs persistent. Vérifiez manuellement.', 
        variant: 'destructive' 
      });
    }
  }, [jsonContent, sanitizeJson, toast]);

  const parseAndValidateJson = useCallback(() => {
    const errors: string[] = [];
    
    try {
      if (!jsonContent.trim()) {
        errors.push("Aucune donnée JSON saisie");
        return { errors, data: null };
      }

      const sanitizedResult = sanitizeJson(jsonContent);
      const parsed = JSON.parse(sanitizedResult.sanitized);
      
      if (!currentMarcheId) {
        errors.push("⚠️ Marché non sélectionné");
      }
      if (!explorationId) {
        errors.push("⚠️ Exploration non trouvée");
      }
      
      if (!parsed.dimensions || Object.keys(parsed.dimensions).length === 0) {
        errors.push("Au moins une dimension est requise");
      }
      if (!parsed.sources || !Array.isArray(parsed.sources)) {
        errors.push("Le champ 'sources' est requis et doit être un tableau");
      }

      const completeData: ImportData = {
        ...parsed,
        exploration_id: explorationId || parsed.exploration_id,
        marche_id: currentMarcheId || parsed.marche_id
      };
      
      return { errors, data: completeData };
    } catch (parseError) {
      const error = parseError as Error;
      let errorMessage = error.message;
      
      // Provide more helpful error messages
      if (errorMessage.includes("Unexpected token")) {
        if (errorMessage.includes("'('")) {
          errorMessage += " - Vérifiez les parenthèses autour des valeurs";
        } else if (errorMessage.includes('"#"') || errorMessage.includes("'#'")) {
          errorMessage += " - Supprimez les commentaires markdown (#)";
        } else if (errorMessage.includes('","')) {
          errorMessage += " - Vérifiez les virgules en trop";
        }
      }
      
      errors.push(`Format JSON invalide: ${errorMessage}`);
      return { errors, data: null };
    }
  }, [jsonContent, sanitizeJson, currentMarcheId, explorationId]);

  const handlePreview = useCallback(async () => {
    const { errors, data } = parseAndValidateJson();
    
    if (errors.length > 0 || !data) {
      setValidation({
        isValid: false,
        errors,
        warnings: [],
        score: 0,
        completenessScore: 0,
        dimensionCount: 0,
        sourceCount: 0,
        fableCount: 0
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('opus-import-ai', {
        body: {
          mode: 'preview',
          data
        }
      });

      if (error) throw error;

      if (result?.validation && result?.preview) {
        setValidation({
          isValid: result.validation.isValid,
          errors: result.validation.errors || [],
          warnings: result.validation.warnings || [],
          score: result.validation.score || 0,
          completenessScore: result.preview.completude_score || 0,
          dimensionCount: result.preview.dimensions_count || 0,
          sourceCount: result.preview.sources_count || 0,
          fableCount: result.preview.fables_count || 0
        });
        setPreview(result.preview);
        setStep('preview');
        
        toast({
          title: result.validation.isValid ? "✅ Validation réussie" : "⚠️ Erreurs détectées",
          description: `Score: ${result.validation.score}% • ${result.preview.dimensions_count} dimensions`
        });
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      toast({
        title: "Erreur de validation",
        description: "Impossible de valider les données",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [parseAndValidateJson, toast]);

  const handleImport = useCallback(async () => {
    if (!validation?.isValid) return;

    const { errors, data } = parseAndValidateJson();
    if (errors.length > 0 || !data) return;

    setIsProcessing(true);
    setStep('importing');

    try {
      const { data: result, error } = await supabase.functions.invoke('opus-import-ai', {
        body: {
          mode: 'import',
          data
        }
      });

      if (error) throw error;

      if (result?.success) {
        setStep('success');
        
        await queryClient.invalidateQueries({ 
          queryKey: ['marche-contextes'] 
        });
        await queryClient.invalidateQueries({ 
          queryKey: ['opus-contextes'] 
        });
        
        toast({
          title: "🎉 Import réussi !",
          description: `Données importées avec succès • Score: ${result.completude_score}%`
        });
        
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les données",
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [validation, parseAndValidateJson, queryClient, toast, onSuccess]);

  if (step === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import réussi !</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Les données ont été importées et sont disponibles dans le dashboard
            </p>
            <Progress value={100} className="mb-4" />
            <Badge className="bg-green-100 text-green-800">
              Complété • Score: {preview?.completude_score || 0}%
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex gap-4 p-6 overflow-hidden">
      {/* Panel gauche - Interface d'import optimisée */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header compact */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import OPUS Finalisé</h2>
              <p className="text-xs text-muted-foreground">
                Interface robuste • Validation automatique • Monitoring temps réel
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sélecteur de marché */}
        {(!marcheId || explorationMarches.length > 0) && (
          <div className="mb-4">
            <Select 
              value={currentMarcheId} 
              onValueChange={(value) => {
                setSelectedMarcheId(value);
                const selectedMarche = explorationMarches.find(m => m.id === value);
                setSelectedMarcheName(selectedMarche ? `${selectedMarche.marche?.nom_marche} - ${selectedMarche.marche?.ville}` : '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un marché" />
              </SelectTrigger>
              <SelectContent>
                {explorationMarches.map((marche) => (
                  <SelectItem key={marche.id} value={marche.id}>
                    {marche.marche?.nom_marche} - {marche.marche?.ville}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Workflow visuel */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/5 rounded-lg">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
            step === 'input' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <FileJson className="h-4 w-4" />
            JSON
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
            step === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Eye className="h-4 w-4" />
            Validation
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
            step === 'importing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Database className="h-4 w-4" />
            Import
          </div>
        </div>

        {step === 'input' && (
          <>
            {/* Outils JSON */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={loadDordogneTestData}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Test Dordogne
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(JSON.stringify({
                  dimensions: {},
                  fables: [],
                  sources: []
                }, null, 2))}
                className="gap-2"
              >
                <FileJson className="h-4 w-4" />
                Template vide
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCleanPythonJson}
                disabled={!jsonContent.trim() || isProcessing}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Nettoyer Python → JSON
              </Button>
              
              <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Prompt COMPLET
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Prompt DeepSearch Phase B - Complet
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] w-full">
                    <div className="space-y-4 pr-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Prompt complet pour les équipes DeepSearch (transformation PDF → JSON OPUS)
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch('/prompt-deepsearch-phase-b-complet.md');
                              const content = await response.text();
                              await navigator.clipboard.writeText(content);
                              toast({
                                title: "Copié !",
                                description: "Prompt copié dans le presse-papiers",
                              });
                            } catch (error) {
                              toast({
                                title: "Erreur",
                                description: "Impossible de copier le prompt",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copier
                        </Button>
                      </div>
                      <iframe
                        src="/prompt-deepsearch-phase-b-complet.md"
                        className="w-full h-96 border rounded-md"
                        title="Prompt DeepSearch Complet"
                      />
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            {/* Alert pour les corrections automatiques */}
            {showCorrections && sanitizationCorrections.length > 0 && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    {sanitizationCorrections.length} correction(s) automatique(s) appliquée(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const correctionsList = sanitizationCorrections
                          .map(c => `${c.type}: ${c.before} → ${c.after}`)
                          .join('\n');
                        toast({
                          title: "Corrections appliquées",
                          description: correctionsList
                        });
                      }}
                    >
                      Voir corrections
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCorrections(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Zone d'édition JSON optimisée */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Données JSON</label>
                <Badge variant="outline" className="text-xs">
                  {jsonContent.length.toLocaleString()} caractères
                </Badge>
              </div>
              <Textarea
                placeholder="Collez vos données JSON ici ou utilisez 'Test Dordogne' pour un exemple complet..."
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="flex-1 font-mono text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handlePreview}
                disabled={!jsonContent.trim() || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Validation...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    Prévisualiser/Valider
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5" />
                  Prêt à importer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-primary/5 p-3 rounded">
                    <div className="font-bold text-primary text-xl">{preview?.dimensions_count}</div>
                    <div className="text-muted-foreground">Dimensions</div>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded">
                    <div className="font-bold text-xl">{preview?.sources_count}</div>
                    <div className="text-muted-foreground">Sources</div>
                  </div>
                </div>
                
                <Progress value={validation?.score || 0} className="h-2" />
                
                <div className="space-y-2">
                  <Button 
                    onClick={handleImport} 
                    disabled={!validation?.isValid || isProcessing}
                    className="w-full gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Importer maintenant
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('input')}
                    className="w-full"
                    size="sm"
                  >
                    ← Retour édition
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-8">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Import en cours...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Traitement et validation des données
                </p>
                <Progress value={undefined} className="mb-4" />
                <Badge variant="outline">
                  Normalisation automatique active
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Panel droit - Validation */}
      <div className="w-96 flex-shrink-0">
        <OpusImportValidationPanel 
          validation={validation}
          isProcessing={isProcessing}
          showDetailed={step === 'input'}
        />
      </div>
    </div>
  );
};