import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  RefreshCw 
} from 'lucide-react';
import { useOpusExploration, useOpusContextes } from '@/hooks/useOpus';
import { useExplorations } from '@/hooks/useExplorations';

interface OpusDebugInterfaceProps {
  opusSlug: string;
}

export const OpusDebugInterface: React.FC<OpusDebugInterfaceProps> = ({ opusSlug }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Récupérer les données
  const { data: opusExploration, isLoading: opusLoading, error: opusError } = useOpusExploration(opusSlug);
  const { data: explorations, isLoading: explorationLoading } = useExplorations();
  const { data: contextes, isLoading: contextesLoading } = useOpusContextes(opusExploration?.id || '');
  
  const exploration = explorations?.find(e => e.slug === opusSlug);

  const getDiagnostic = () => {
    const issues = [];
    const warnings = [];
    const infos = [];

    // Vérifier la cohérence des IDs
    if (opusExploration && exploration) {
      if (opusExploration.id !== exploration.id) {
        issues.push({
          type: 'error',
          title: 'Incohérence des IDs',
          description: `L'ID de l'exploration OPUS (${opusExploration.id}) ne correspond pas à l'ID de l'exploration normale (${exploration.id})`
        });
      } else {
        infos.push({
          type: 'success',
          title: 'IDs cohérents',
          description: 'Les IDs des explorations correspondent'
        });
      }
    }

    // Vérifier l'existence de l'exploration OPUS
    if (!opusExploration) {
      issues.push({
        type: 'error',
        title: 'Exploration OPUS manquante',
        description: `Aucune entrée trouvée dans opus_explorations pour le slug "${opusSlug}"`
      });
    }

    // Vérifier l'existence de l'exploration normale
    if (!exploration) {
      warnings.push({
        type: 'warning',
        title: 'Exploration normale manquante',
        description: `Aucune entrée trouvée dans explorations pour le slug "${opusSlug}"`
      });
    }

    // Vérifier les contextes
    if (contextes) {
      if (contextes.length === 0) {
        warnings.push({
          type: 'warning',
          title: 'Aucun contexte importé',
          description: 'Aucune donnée n\'a été importée via l\'interface IA'
        });
      } else {
        infos.push({
          type: 'success',
          title: `${contextes.length} contexte(s) trouvé(s)`,
          description: 'Des données ont été importées avec succès'
        });
      }
    }

    return { issues, warnings, infos };
  };

  const diagnostic = getDiagnostic();
  const hasIssues = diagnostic.issues.length > 0;
  const hasWarnings = diagnostic.warnings.length > 0;

  const getStatusColor = () => {
    if (hasIssues) return 'text-red-600';
    if (hasWarnings) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (hasIssues) return <XCircle className="w-4 h-4" />;
    if (hasWarnings) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const reload = () => {
    window.location.reload();
  };

  if (opusLoading || explorationLoading || contextesLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Chargement des informations de debug...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <CardTitle className="text-lg">Debug OPUS</CardTitle>
                <div className={`flex items-center gap-1 ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="text-sm font-medium">
                    {hasIssues ? 'Problèmes détectés' : hasWarnings ? 'Avertissements' : 'Tout fonctionne'}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <CardDescription>
              Diagnostic technique pour {opusSlug}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Erreurs critiques */}
            {diagnostic.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Erreurs critiques ({diagnostic.issues.length})
                </h4>
                {diagnostic.issues.map((issue, index) => (
                  <div key={index} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-800">{issue.title}</div>
                    <div className="text-sm text-red-600 mt-1">{issue.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Avertissements */}
            {diagnostic.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Avertissements ({diagnostic.warnings.length})
                </h4>
                {diagnostic.warnings.map((warning, index) => (
                  <div key={index} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">{warning.title}</div>
                    <div className="text-sm text-yellow-600 mt-1">{warning.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Informations */}
            {diagnostic.infos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Statut OK ({diagnostic.infos.length})
                </h4>
                {diagnostic.infos.map((info, index) => (
                  <div key={index} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">{info.title}</div>
                    <div className="text-sm text-green-600 mt-1">{info.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Détails techniques */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                Détails techniques
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Slug recherché:</span>
                    <code className="ml-2 px-1 py-0.5 bg-muted rounded">{opusSlug}</code>
                  </div>
                  
                  {opusExploration && (
                    <div>
                      <span className="font-medium">ID OPUS:</span>
                      <code className="ml-2 px-1 py-0.5 bg-muted rounded font-mono">
                        {opusExploration.id}
                      </code>
                    </div>
                  )}

                  {exploration && (
                    <div>
                      <span className="font-medium">ID Exploration:</span>
                      <code className="ml-2 px-1 py-0.5 bg-muted rounded font-mono">
                        {exploration.id}
                      </code>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Contextes chargés:</span>
                    <Badge variant="outline" className="ml-2">
                      {contextes?.length || 0}
                    </Badge>
                  </div>

                  <div>
                    <span className="font-medium">État OPUS:</span>
                    <Badge variant={opusExploration ? "default" : "destructive"} className="ml-2">
                      {opusExploration ? 'Trouvé' : 'Manquant'}
                    </Badge>
                  </div>

                  <div>
                    <span className="font-medium">État Exploration:</span>
                    <Badge variant={exploration ? "default" : "destructive"} className="ml-2">
                      {exploration ? 'Trouvé' : 'Manquant'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={reload}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recharger la page
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};