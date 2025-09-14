import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  MapPin,
  Leaf,
  Users,
  Zap,
  FileText,
  TrendingUp,
  Eye,
  Trash2,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { getProcessedSpeciesCount } from '@/utils/speciesDataUtils';
import { getVocabularyTermsCount } from '@/utils/vocabularyDataUtils';
import { processTechnodiversiteData } from '@/utils/technodiversiteDataUtils';

interface ImportRecord {
  id: string;
  opus_id: string;
  marche_id: string;
  import_date: string;
  contexte_data: any;
  fables_data: any[];
  sources: any[];
  completude_score: number;
  marche_nom?: string;
  marche_ville?: string;
}

interface ModernImportCardProps {
  importRecord: ImportRecord;
  onClick: (importRecord: ImportRecord) => void;
  onDelete?: (importRecord: ImportRecord) => void;
  compact?: boolean;
}

export const ModernImportCard: React.FC<ModernImportCardProps> = ({
  importRecord,
  onClick,
  onDelete,
  compact = false
}) => {
  const getImportStatus = () => {
    const hasContexte = !!importRecord.contexte_data;
    const hasFables = !!importRecord.fables_data?.length;
    
    if (hasContexte && hasFables) {
      return { 
        status: 'complete', 
        label: 'Complet', 
        color: 'bg-green-500', 
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      };
    }
    if (hasContexte || hasFables) {
      return { 
        status: 'partial', 
        label: 'Partiel', 
        color: 'bg-yellow-500', 
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20'
      };
    }
    return { 
      status: 'empty', 
      label: 'Vide', 
      color: 'bg-red-500', 
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    };
  };

  const status = getImportStatus();
  
  // Extract key metrics from context
  const getMetrics = () => {
    const metrics = {
      species: 0,
      vocabulary: 0,
      technology: 0,
      fables: importRecord.fables_data?.length || 0
    };

    if (importRecord.contexte_data) {
      metrics.species = getProcessedSpeciesCount(importRecord.contexte_data?.especes_caracteristiques?.donnees || importRecord.contexte_data?.especes_caracteristiques);
      metrics.vocabulary = getVocabularyTermsCount(importRecord.contexte_data?.vocabulaire_local);
      
      const tech = importRecord.contexte_data.technodiversite;
      if (tech) {
        try {
          metrics.technology = processTechnodiversiteData(tech).totalCount;
        } catch {
          metrics.technology = 0;
        }
      }
    }

    return metrics;
  };

  const metrics = getMetrics();

  const handleCardClick = () => {
    onClick(importRecord);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(importRecord);
    }
  };

  return (
    <Card 
      className={`group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer border-border/50 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm hover:scale-[1.02] ${status.bgColor} ${status.borderColor}`}
      onClick={handleCardClick}
    >
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className={`flex items-center gap-3 ${compact ? 'text-base' : 'text-lg'}`}>
              <div className={`w-3 h-3 rounded-full ${status.color} animate-pulse`} />
              <span className="truncate">{importRecord.marche_nom}</span>
            </CardTitle>
            <CardDescription className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3" />
                {new Date(importRecord.import_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              {importRecord.marche_ville && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3" />
                  {importRecord.marche_ville}
                </div>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${status.color.replace('bg-', 'text-')} border-current`}>
              {status.label}
            </Badge>
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(importRecord); }}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les détails
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={compact ? "pt-0" : ""}>
        {/* Completeness Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Complétude</span>
            <span className="text-xs font-medium">{Math.min(importRecord.completude_score || 0, 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(importRecord.completude_score || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={`grid grid-cols-4 gap-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Leaf className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-green-500`} />
            </div>
            <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'} text-foreground`}>
              {metrics.species}
            </div>
            <div className="text-muted-foreground text-xs">
              Espèces
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-blue-500`} />
            </div>
            <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'} text-foreground`}>
              {metrics.vocabulary}
            </div>
            <div className="text-muted-foreground text-xs">
              Vocabulaire
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-purple-500`} />
            </div>
            <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'} text-foreground`}>
              {metrics.technology}
            </div>
            <div className="text-muted-foreground text-xs">
              Technodiversité
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FileText className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-orange-500`} />
            </div>
            <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'} text-foreground`}>
              {metrics.fables}
            </div>
            <div className="text-muted-foreground text-xs">
              Fables
            </div>
          </div>
        </div>

        {/* Sources count */}
        {importRecord.sources?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Sources référencées</span>
              <Badge variant="secondary" className="text-xs">
                {importRecord.sources.length}
              </Badge>
            </div>
          </div>
        )}

        {/* Interactive elements */}
        <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            Prêt à explorer
          </div>
          <div className="flex items-center gap-1 text-xs text-primary">
            <Eye className="w-3 h-3" />
            Voir détails
          </div>
        </div>
      </CardContent>
    </Card>
  );
};