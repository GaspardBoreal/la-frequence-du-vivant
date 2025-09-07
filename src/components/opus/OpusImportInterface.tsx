import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationMarches } from '@/hooks/useExplorations';
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
  BarChart3,
  Info,
  Copy
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImportData {
  exploration_id: string;
  marche_id: string;
  dimensions: Record<string, any>;
  fables?: Array<any>;
  sources: Array<any>;
  metadata?: {
    // Métadonnées optionnelles - seront générées automatiquement si manquantes
    [key: string]: any;
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
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jsonContent, setJsonContent] = useState('');
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'success'>('input');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedMarcheId, setSelectedMarcheId] = useState<string>(marcheId);
  const [selectedMarcheName, setSelectedMarcheName] = useState<string>(marcheName);

  // Get exploration marches when no specific marche is selected
  const { data: explorationMarches = [], isLoading: marchesLoading } = useExplorationMarches(explorationId || '');
  
  console.debug('🔍 OpusImportInterface loading states:', {
    marchesLoading,
    explorationMarchesLength: explorationMarches.length,
    marcheId,
    explorationId,
    hasExplorationMarches: explorationMarches.length > 0
  });
  
  // Determine current marche values
  const currentMarcheId = selectedMarcheId || marcheId;
  const currentMarcheName = selectedMarcheName || marcheName;

  // Generate complete JSON template for all OPUS dimensions
  const generateCompleteTemplate = useCallback(() => {
    return `{
  "dimensions": {
    "contexte_hydrologique": {
      "description": "Contexte hydrologique et caractéristiques du site d'étude",
      "donnees": {
        "bassin_versant": "Nom du bassin versant",
        "debit_moyen": "Débit moyen en m³/s",
        "regime_hydrologique": "Type de régime (pluvial, nival, mixte)",
        "qualite_eau": "Indices de qualité physicochimique et biologique",
        "sources": [
          {
            "titre": "Données hydrologiques officielles",
            "url": "https://www.hydro.eaufrance.fr",
            "type": "web",
            "date_acces": "${new Date().toISOString().split('T')[0]}",
            "fiabilite": 95
          }
        ]
      }
    },
    "especes_caracteristiques": {
      "description": "Espèces indicatrices de la biodiversité et qualité écologique",
      "donnees": {
        "poissons": ["Truite fario", "Chabot", "Lamproie de Planer"],
        "invertebres": ["Ephéméroptères", "Plécoptères", "Trichoptères"],
        "vegetation_aquatique": ["Renoncule flottante", "Potamot crépu"],
        "oiseaux_aquatiques": ["Martin-pêcheur", "Bergeronnette des ruisseaux"],
        "sources": [
          {
            "titre": "Inventaire biodiversité INPN",
            "url": "https://inpn.mnhn.fr",
            "type": "base_donnees",
            "date_acces": "${new Date().toISOString().split('T')[0]}",
            "fiabilite": 90
          }
        ]
      }
    },
    "vocabulaire_local": {
      "description": "Terminologie locale, dialectes et savoirs traditionnels",
      "donnees": {
        "termes_locaux": {
          "cours_eau": "Nom local du cours d'eau",
          "phenomenes": ["Crue locale", "Étiage saisonnier"],
          "pratiques": ["Techniques traditionnelles", "Usages ancestraux"]
        },
        "sources": [
          {
            "titre": "Lexique patrimonial local",
            "url": "https://patrimoine-local.fr",
            "type": "documentation",
            "date_acces": "${new Date().toISOString().split('T')[0]}",
            "fiabilite": 75
          }
        ]
      }
    },
    "infrastructures_techniques": {
      "description": "Infrastructures humaines et aménagements techniques",
      "donnees": {
        "ouvrages_hydrauliques": ["Barrage", "Seuil", "Écluse"],
        "reseaux": ["Assainissement", "AEP", "Pluvial"],
        "equipements": ["Station épuration", "Pompage", "Traitement"],
        "sources": [
          {
            "titre": "Base nationale des ouvrages",
            "url": "https://www.sandre.eaufrance.fr",
            "type": "base_donnees",
            "date_acces": "${new Date().toISOString().split('T')[0]}",
            "fiabilite": 95
          }
        ]
      }
    },
    "agroecologie": {
      "description": "Pratiques agricoles et écosystémiques du territoire",
      "donnees": {
        "pratiques_agricoles": ["Agriculture biologique", "Agroforesterie"],
        "cultures": ["Céréales", "Légumineuses", "Prairies permanentes"],
        "elevage": ["Bovin extensif", "Ovin transhumant"],
        "biodiversite_cultivee": ["Variétés locales", "Semences paysannes"],
        "sources": [
          {
            "titre": "Registre Parcellaire Graphique",
            "url": "https://www.telepac.agriculture.gouv.fr",
            "type": "base_donnees",
            "date_acces": "${new Date().toISOString().split('T')[0]}",
            "fiabilite": 85
          }
        ]
      }
    },
    "technodiversite": {
      "description": "Technologies émergentes et innovations territoriales",
      "donnees": {
        "technologies_vertes": ["Énergies renouvelables", "Efficacité énergétique"],
        "innovations_locales": ["Solutions techniques locales", "Brevets"],
        "numerique": ["IoT environnemental", "Capteurs intelligents"],
        "recherche_developpement": ["Projets R&D", "Partenariats académiques"],
        "sources": [
          {
            "titre": "Base brevets INPI",
            "url": "https://bases-brevets.inpi.fr",
            "type": "base_donnees",
            "date_acces": "${new Date().toISOString().split('T')[0]}",
            "fiabilite": 80
          }
        ]
      }
    }
  },
  "fables": [
    {
      "titre": "L'eau qui murmure les secrets du territoire",
      "contenu_principal": "Narration poétique intégrant les données scientifiques et les savoirs locaux...",
      "ordre": 1,
      "dimension": "contexte_hydrologique"
    },
    {
      "titre": "La danse des espèces au fil de l'eau",
      "contenu_principal": "Récit des interactions écosystémiques et de la biodiversité...",
      "ordre": 2,
      "dimension": "especes_caracteristiques"
    }
  ],
  "sources": [
    {
      "titre": "Portail technique de l'Office Français de la Biodiversité",
      "url": "https://professionnels.ofb.fr",
      "type": "web",
      "date_acces": "${new Date().toISOString().split('T')[0]}",
      "fiabilite": 95
    },
    {
      "titre": "Données ouvertes Eaufrance",
      "url": "https://www.eaufrance.fr",
      "type": "base_donnees", 
      "date_acces": "${new Date().toISOString().split('T')[0]}",
      "fiabilite": 98
    }
  ]
}
}`;
  }, [currentMarcheId, explorationId]);

  // Copy JSON format to clipboard
  const copyJsonFormat = useCallback(async () => {
    const jsonFormat = generateCompleteTemplate();
    try {
      await navigator.clipboard.writeText(jsonFormat);
      toast({
        title: "Format JSON copié",
        description: "Le format JSON complet a été copié dans le presse-papiers"
      });
    } catch (error) {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier dans le presse-papiers",
        variant: "destructive"
      });
    }
  }, [generateCompleteTemplate, toast]);

  // NO auto-fill - only manual template generation

  const parseAndValidateJson = useCallback(() => {
    const errors: string[] = [];
    
    try {
      if (!jsonContent.trim()) {
        errors.push("Aucune donnée JSON saisie");
        setValidationErrors(errors);
        return null;
      }

      const parsed = JSON.parse(jsonContent);
      
      // Validation automatique des IDs
      if (!currentMarcheId) {
        errors.push("⚠️ Marche non sélectionnée - impossible d'importer");
      }
      if (!explorationId) {
        errors.push("⚠️ Exploration non trouvée - impossible d'importer");
      }
      
      // Validation basique du contenu
      if (!parsed.dimensions || Object.keys(parsed.dimensions).length === 0) {
        errors.push("Au moins une dimension est requise dans 'dimensions'");
      }
      if (!parsed.sources || !Array.isArray(parsed.sources)) {
        errors.push("Le champ 'sources' est requis et doit être un tableau");
      }
      // Les métadonnées ne sont plus obligatoires - elles seront générées automatiquement

      // Injection automatique des IDs (ces champs sont automatiquement ajoutés)
      const completeData: ImportData = {
        ...parsed,
        exploration_id: explorationId || parsed.exploration_id,
        marche_id: currentMarcheId || parsed.marche_id
      };
      
      console.log('🔍 IDs injectés automatiquement:', {
        exploration_id: completeData.exploration_id,
        marche_id: completeData.marche_id,
        originalJson: !!parsed.exploration_id || !!parsed.marche_id
      });
      
      setValidationErrors(errors);
      setImportData(completeData);
      return errors.length === 0 ? completeData : null;
    } catch (error) {
      errors.push(`Format JSON invalide: ${error.message}`);
      setValidationErrors(errors);
      return null;
    }
  }, [jsonContent, currentMarcheId, explorationId]);

  const previewImport = async () => {
    console.log('🚀 Starting preview import...');
    
    const data = parseAndValidateJson();
    if (!data) {
      console.log('❌ No valid data to preview');
      return;
    }

    console.log('📊 Data to preview:', {
      exploration_id: data.exploration_id,
      marche_id: data.marche_id,
      has_dimensions: !!data.dimensions,
      dimensions_keys: data.dimensions ? Object.keys(data.dimensions) : []
    });

    setIsProcessing(true);
    try {
      console.log('🔄 Calling opus-import-ai function...');
      
      const { data: result, error } = await supabase.functions.invoke('opus-import-ai', {
        body: { data, preview: true }
      });

      console.log('📥 Function response:', { result, error });

      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      if (!result) {
        throw new Error('Aucune réponse de la fonction');
      }

      if (!result.validation) {
        console.error('❌ No validation in result:', result);
        throw new Error('Réponse invalide: validation manquante');
      }

      setValidation(result.validation);
      setPreview(result.preview);
      setStep('preview');

      console.log('✅ Preview successful:', {
        dimensions_count: result.preview?.dimensions_count,
        validation_score: result.validation?.score
      });

      toast({
        title: "Prévisualisation générée",
        description: `${result.preview?.dimensions_count || 0} dimensions détectées`
      });

    } catch (error) {
      console.error('💥 Preview error:', error);
      
      // Afficher les erreurs détaillées si disponibles
      if (error.message && error.message.includes('400')) {
        try {
          const errorBody = JSON.parse(error.message.split('\n').pop() || '{}');
          if (errorBody.errors && Array.isArray(errorBody.errors)) {
            setValidationErrors(errorBody.errors);
            toast({
              title: "Erreurs de validation",
              description: `${errorBody.errors.length} erreur(s) détectée(s)`,
              variant: "destructive"
            });
            return;
          }
        } catch {}
      }
      
      toast({
        title: "Erreur de prévisualisation",
        description: error.message || "Erreur inconnue",
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
        
        // SUCCESS LOGS pour debugging
        console.log('🎉 Import réussi - Callback onSuccess va être appelé');
        console.log('📊 Données importées:', result);
        
        toast({
          title: "✅ Import réussi",
          description: `Données IA importées pour ${currentMarcheName}. Rechargement automatique...`,
          variant: "default"
        });
        
        // Invalidate all relevant queries AVANT d'appeler onSuccess
        await queryClient.invalidateQueries({
          queryKey: ['marche-contextes'],
        });
        await queryClient.invalidateQueries({
          queryKey: ['opus-contextes'],
        });
        await queryClient.invalidateQueries({
          queryKey: ['imports-data'],
        });
        
        // Appeler le callback après invalidation des caches
        console.log('🔄 Appel du callback onSuccess pour recharger le dashboard');
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

  // Real-time JSON validation - useEffect MUST come before any conditional returns
  React.useEffect(() => {
    if (jsonContent.trim()) {
      parseAndValidateJson();
    } else {
      setValidationErrors([]);
    }
  }, [jsonContent, parseAndValidateJson]);

  // SUCCESS STEP - Conditional rendering instead of early return
  if (step === 'success') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">Import Réussi !</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Les données IA ont été importées avec succès pour <strong>{currentMarcheName}</strong></p>
          
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
            <Button 
              variant="secondary" 
              onClick={() => window.open(`/admin/marches/${currentMarcheId}`, '_blank')}
            >
              <Link className="h-4 w-4 mr-2" />
              Voir le contexte
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // MAIN COMPONENT RENDERING
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Import IA - Données OPUS
          </h2>
          <p className="text-muted-foreground">
            Importez les données sourcées par votre IA pour enrichir automatiquement toutes les dimensions
          </p>
          
          {/* Indicateurs contexte */}
          <div className="flex gap-4 mt-3 text-sm">
            <Badge variant="outline" className="font-mono">
              Marche: {currentMarcheName || 'Non sélectionnée'}
            </Badge>
            <Badge variant="outline" className="font-mono">
              ID: {currentMarcheId || 'N/A'}
            </Badge>
            {explorationId && (
              <Badge variant="outline" className="font-mono">
                Exploration: {explorationId}
              </Badge>
            )}
          </div>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {step === 'input' && (
        <div className="space-y-6">
          {/* Sélecteur de marche si pas de marche spécifique fournie */}
          {!marcheId && explorationId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sélection de la marche
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marchesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <div className="text-sm text-muted-foreground">Chargement des marches disponibles...</div>
                  </div>
                ) : (
                  <Select 
                    value={selectedMarcheId} 
                    onValueChange={(value) => {
                      setSelectedMarcheId(value);
                      const selectedMarche = explorationMarches.find(em => em.marche?.id === value);
                      setSelectedMarcheName(selectedMarche?.marche?.nom_marche || selectedMarche?.marche?.ville || 'Marche sélectionnée');
                      // Reset et pré-remplit quand on change de marche
                      setImportData(null);
                      setValidation(null);
                      setPreview(null);
                      setValidationErrors([]);
                      // Le useEffect se chargera du pré-remplissage automatique
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisissez une marche pour l'import..." />
                    </SelectTrigger>
                    <SelectContent>
                      {explorationMarches.map((explorationMarche) => (
                        <SelectItem key={explorationMarche.marche?.id} value={explorationMarche.marche?.id || ''}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {explorationMarche.marche?.nom_marche || explorationMarche.marche?.ville}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {explorationMarche.marche?.descriptif_court}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Données JSON IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Information IDs auto-injectés */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <strong>IDs automatiquement ajoutés :</strong>
                  <br />• Exploration: <code>{explorationId || 'Non trouvée'}</code>
                  <br />• Marche: <code>{currentMarcheName} ({currentMarcheId || 'Non sélectionnée'})</code>
                  <br />Vous n'avez pas besoin d'inclure exploration_id et marche_id dans votre JSON.
                </AlertDescription>
              </Alert>
              
            <Textarea
              placeholder="Collez ici votre JSON d'import IA ou utilisez le bouton 'Copier le format JSON' pour obtenir le modèle complet..."
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="min-h-[200px] max-h-[300px] font-mono text-sm resize-y"
            />
            
            {/* Affichage des erreurs de validation */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erreurs détectées:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={copyJsonFormat}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copier le format JSON
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const template = generateCompleteTemplate();
                    setJsonContent(template);
                    parseAndValidateJson();
                  }}
                  className="flex items-center gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  Charger le modèle
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={previewImport}
                  disabled={!jsonContent.trim() || isProcessing || (!marcheId && !currentMarcheId)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isProcessing ? 'Analyse...' : 'Prévisualiser'}
                </Button>
                
                <Button variant="outline" onClick={reset} disabled={isProcessing}>
                  Effacer
                </Button>
              </div>
            </div>

            {/* Message d'aide dynamique */}
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {!currentMarcheId ? (
                  <span className="text-amber-600 font-medium">⚠️ Sélectionnez une marche pour activer l'import</span>
                ) : !jsonContent.trim() ? (
                  <span className="text-blue-600">💡 Utilisez "Copier le format JSON" pour obtenir le modèle complet couvrant tous les onglets (Contexte, Espèces, Vocabulaire, Infrastructures, Agroécologie, Technodiversité).</span>
                ) : validationErrors.length > 0 ? (
                  <span className="text-red-600 font-medium">❌ Corrigez les erreurs JSON avant de continuer</span>
                ) : (
                  <span className="text-green-600 font-medium">✅ JSON valide - Vous pouvez maintenant prévisualiser ou valider l'import</span>
                )}
              </AlertDescription>
            </Alert>

            {/* Bouton de validation toujours visible avec tooltip */}
            <div className="border-t pt-4">
              <TooltipProvider>
                <div className="flex justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          onClick={() => {
                            const data = parseAndValidateJson();
                            if (data) {
                              executeImport();
                            }
                          }}
                          disabled={validationErrors.length > 0 || !jsonContent.trim() || isProcessing || (!marcheId && !currentMarcheId)}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Valider l'Import
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!jsonContent.trim() ? (
                        "Ajoutez des données JSON pour activer l'import"
                      ) : (!marcheId && !currentMarcheId) ? (
                        "Sélectionnez une marche avant d'importer"
                      ) : validationErrors.length > 0 ? (
                        "Corrigez les erreurs avant d'importer"
                      ) : (
                        "Importer directement (sans prévisualisation)"
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {step === 'preview' && validation && preview && (() => {
        // DEBUG LOGS pour diagnostiquer le bouton manquant
        console.log('🔍 DEBUG - État de la preview:', {
          step,
          validation: validation ? {
            isValid: validation.isValid,
            score: validation.score,
            errorsCount: validation.errors?.length || 0,
            warningsCount: validation.warnings?.length || 0
          } : 'null',
          preview: preview ? {
            dimensions_count: preview.dimensions_count,
            fables_count: preview.fables_count,
            sources_count: preview.sources_count,
            completude_score: preview.completude_score
          } : 'null',
          isProcessing,
          currentMarcheId,
          importData: !!importData
        });
        
        return (
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

              {/* Message informatif sur l'état du bouton */}
              {!validation.isValid && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>📋 Note importante:</strong> Malgré les erreurs de validation, vous pouvez toujours procéder à l'import. 
                    Les données seront traitées et les erreurs pourront être corrigées manuellement après import.
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

          {/* Actions - BOUTON TOUJOURS VISIBLE avec tooltip explicatif */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={reset}>
              Annuler
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      onClick={executeImport}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 ${!validation.isValid ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}`}
                      variant={!validation.isValid ? "default" : "default"}
                    >
                      <Upload className="h-4 w-4" />
                      {isProcessing ? 'Import...' : !validation.isValid ? 'Forcer l\'Import' : 'Valider l\'Import'}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isProcessing ? (
                    "Import en cours..."
                  ) : !validation.isValid ? (
                    "⚠️ Forcer l'import malgré les erreurs de validation. Les données seront importées et vous pourrez les corriger manuellement."
                  ) : (
                    "✅ Données validées - Procéder à l'import"
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )})()}

      {step === 'importing' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Import en cours...</h3>
            <p className="text-muted-foreground">
              Traitement des données IA pour {currentMarcheName}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};