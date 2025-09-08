// Phase 1 - Panel de validation en temps réel pour les imports OPUS
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Info, Zap, Target } from 'lucide-react';

interface ValidationInfo {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  completenessScore?: number;
  dimensionCount?: number;
  sourceCount?: number;
  fableCount?: number;
}

interface OpusImportValidationPanelProps {
  validation: ValidationInfo | null;
  isProcessing?: boolean;
  showDetailed?: boolean;
}

export const OpusImportValidationPanel: React.FC<OpusImportValidationPanelProps> = ({
  validation,
  isProcessing = false,
  showDetailed = true
}) => {
  if (isProcessing) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5 animate-pulse" />
            Phase 1 - Validation en cours...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={undefined} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Analyse multi-niveaux : syntaxe, sémantique, cohérence des données
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validation) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-5 w-5" />
            Validation OPUS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Saisissez des données JSON pour commencer la validation automatique
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-4">
      {/* Status général */}
      <Card className={validation.isValid ? 'border-green-200' : 'border-red-200'}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Phase 1 - Validation OPUS</span>
            </div>
            <Badge variant={getScoreBadgeVariant(validation.score)}>
              Score: {validation.score}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress 
              value={validation.score} 
              className="w-full"
            />
            
            {/* Métriques clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-primary/5 p-2 rounded">
                <div className="font-semibold text-primary">
                  {validation.dimensionCount || 0}
                </div>
                <div className="text-muted-foreground">Dimensions</div>
              </div>
              <div className="bg-secondary/10 p-2 rounded">
                <div className="font-semibold">
                  {validation.sourceCount || 0}
                </div>
                <div className="text-muted-foreground">Sources</div>
              </div>
              <div className="bg-accent/10 p-2 rounded">
                <div className="font-semibold">
                  {validation.fableCount || 0}
                </div>
                <div className="text-muted-foreground">Fables</div>
              </div>
              <div className="bg-warning/10 p-2 rounded">
                <div className={`font-semibold ${getScoreColor(validation.completenessScore || 0)}`}>
                  {validation.completenessScore || 0}%
                </div>
                <div className="text-muted-foreground">Complétude</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreurs */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">
              {validation.errors.length} erreur(s) critique(s) détectée(s):
            </div>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">• {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Avertissements */}
      {validation.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">
              {validation.warnings.length} avertissement(s):
            </div>
            <ul className="space-y-1">
              {validation.warnings.slice(0, showDetailed ? validation.warnings.length : 3).map((warning, index) => (
                <li key={index} className="text-sm">• {warning}</li>
              ))}
              {!showDetailed && validation.warnings.length > 3 && (
                <li className="text-sm text-muted-foreground">
                  ... et {validation.warnings.length - 3} autre(s)
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Phase 1 */}
      {validation.isValid && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Phase 1 activée:</strong> Normalisation automatique, validation multi-niveaux, 
            et correction intelligente des données appliquées avec succès. 
            Prêt pour import robuste.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};