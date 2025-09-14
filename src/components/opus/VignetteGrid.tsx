import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InteractiveVignette } from './InteractiveVignette';
import { Database, ExternalLink } from 'lucide-react';
import { processVocabularyData } from '@/utils/vocabularyDataUtils';
import { processTechnodiversiteData } from '@/utils/technodiversiteDataUtils';
import { processIaFonctionnalitesData } from '@/utils/iaFonctionnalitesDataUtils';
import { TechnodiversiteVignetteGrid } from './TechnodiversiteVignetteGrid';
import { VocabularySourcesCard } from './VocabularySourcesCard';
import VocabularyVignetteGrid from './VocabularyVignetteGrid';
import { IaFonctionnalitesVignetteGrid } from './IaFonctionnalitesVignetteGrid';
import { useToast } from '@/components/ui/use-toast';

interface VignetteGridProps {
  title: string;
  data: any;
  variant: 'vocabulary' | 'infrastructure' | 'agro' | 'technology' | 'ia';
  icon: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  specialProcessing?: 'vocabulary' | 'technodiversite' | 'ia_fonctionnalites';
  importSources?: any[]; // Import sources to enrich vocabulary sources
}

export const VignetteGrid: React.FC<VignetteGridProps> = ({ 
  title, 
  data, 
  variant, 
  icon, 
  className = '',
  emptyMessage = `Aucune donnée de ${title.toLowerCase()} disponible`,
  specialProcessing,
  importSources = []
}) => {
  // Process data into vignette format
  const processedData = React.useMemo(() => {
    if (!data) return [];
    
    // Traitement spécial pour le vocabulaire
    if (specialProcessing === 'vocabulary') {
      return processVocabularyData(data);
    }
    
    // Traitement spécial pour la technodiversité
    if (specialProcessing === 'technodiversite') {
      return processTechnodiversiteData(data);
    }
    
    // Traitement spécial pour les fonctionnalités IA
    if (specialProcessing === 'ia_fonctionnalites') {
      return processIaFonctionnalitesData(data);
    }
    
    const items: any[] = [];
    
    if (Array.isArray(data)) {
      items.push(...data.map((item, index) => ({
        titre: item.nom || item.terme || item.titre || item.name || `Élément ${index + 1}`,
        description_courte: item.description || item.definition || item.explication || '',
        type: item.type || item.categorie || '',
        details: item.details || item.usage || item.application || '',
        category: item.domaine || item.secteur || '',
        metadata: item
      })));
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          items.push(...value.map((item: any, index) => ({
            titre: item?.nom || item?.terme || item?.titre || item?.name || key,
            description_courte: item?.description || item?.definition || item?.explication || '',
            type: item?.type || item?.categorie || key,
            details: item?.details || item?.usage || item?.application || '',
            category: key,
            metadata: item
          })));
        } else if (typeof value === 'object' && value !== null) {
          const objValue = value as any;
          items.push({
            titre: objValue?.nom || objValue?.terme || objValue?.titre || key,
            description_courte: objValue?.description || objValue?.definition || objValue?.explication || '',
            type: objValue?.type || objValue?.categorie || key,
            details: objValue?.details || objValue?.usage || objValue?.application || '',
            category: key,
            metadata: objValue
          });
        } else if (typeof value === 'string') {
          items.push({
            titre: key,
            description_courte: value,
            type: 'Information',
            category: 'Général',
            metadata: { [key]: value }
          });
        }
      });
    }
    
    return items.filter(item => item.titre && item.titre.trim() !== '');
  }, [data, specialProcessing]);

  // Source resolution and quality check for vocabulary terms
  const { toast } = useToast();
  const sourceIndex = React.useMemo(() => {
    const map = new Map<string, any>();
    (importSources || []).forEach((s: any) => {
      const possibleIds = [
        s?.id,
        s?.source_id, 
        s?.key,
        s?.nom,
        s?.name,
        s?.url?.split('/').pop(), // Last part of URL as potential ID
      ].filter(Boolean);
      
      possibleIds.forEach(id => {
        if (id) map.set(String(id), s);
      });
    });
    return map;
  }, [importSources]);

  const termsWithResolved = React.useMemo(() => {
    if (specialProcessing !== 'vocabulary' || !processedData || !('termes' in processedData)) return [] as any[];
    const terms = (processedData as any).termes || [];
    return terms.map((t: any) => {
      const meta = t.metadata || {};
      const ids: any[] = meta.source_ids || meta.sources || meta.sources_ids || [];
      const normalizedIds: string[] = Array.isArray(ids)
        ? ids.map((x: any) => typeof x === 'string' ? x : (x?.id || x?.key)).filter(Boolean)
        : [];
      const resolved = normalizedIds.map((id: string) => sourceIndex.get(String(id))).filter(Boolean);
      const firstUrlSource = resolved.find((s: any) => s?.url || s?.lien || s?.link);
      return {
        ...t,
        url: firstUrlSource?.url || firstUrlSource?.lien || firstUrlSource?.link || t.url,
        metadata: { ...meta, resolved_sources: resolved, resolved_source_ids: normalizedIds }
      };
    });
  }, [specialProcessing, processedData, sourceIndex]);

  // Collect all referenced source IDs from vocabulary terms
  const referencedSourceIds = React.useMemo(() => {
    if (specialProcessing !== 'vocabulary' || !termsWithResolved.length) return [];
    
    const allIds = new Set<string>();
    termsWithResolved.forEach((term: any) => {
      const ids = term.metadata?.resolved_source_ids || [];
      ids.forEach((id: string) => allIds.add(id));
    });
    
    return Array.from(allIds);
  }, [specialProcessing, termsWithResolved]);

  // Alerte qualité: termes sans sources
  React.useEffect(() => {
    if (specialProcessing !== 'vocabulary' || !termsWithResolved.length) return;
    const missingCount = termsWithResolved.filter((t: any) => !(t.metadata?.resolved_sources?.length)).length;
    if (missingCount > 0) {
      toast('Sources manquantes', {
        description: `${missingCount} terme${missingCount > 1 ? 's' : ''} sans source. Cliquez pour compléter.`,
      });
    }
  }, [specialProcessing, termsWithResolved, toast]);
  const getVariantColor = () => {
    switch (variant) {
      case 'vocabulary': return 'text-info';
      case 'infrastructure': return 'text-warning';
      case 'agro': return 'text-accent';
      case 'technology': return 'text-primary';
      default: return 'text-foreground';
    }
  };

  const getVariantBorder = () => {
    switch (variant) {
      case 'vocabulary': return 'border-info/20 bg-gradient-to-br from-info/10 to-info/5';
      case 'infrastructure': return 'border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5';
      case 'agro': return 'border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5';
      case 'technology': return 'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5';
      default: return 'border-border/30 bg-background/50';
    }
  };

  // Always render specialized components, they handle empty states internally
  if (specialProcessing === 'vocabulary' || specialProcessing === 'technodiversite' || specialProcessing === 'ia_fonctionnalites') {
    // Let specialized components handle their own empty states
  } else if (!data || (Array.isArray(processedData) ? !processedData.length : true)) {
    return (
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardContent className="p-12 text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
          <p className="text-muted-foreground">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques - Masqué pour le vocabulaire, technodiversité et IA */}
      {specialProcessing !== 'vocabulary' && specialProcessing !== 'technodiversite' && specialProcessing !== 'ia_fonctionnalites' && (
        <Card className={getVariantBorder()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`${getVariantColor()}`}>
                {icon}
              </div>
              <div>
                <span>{title}</span>
                <Badge variant="secondary" className="ml-2">
                  {Array.isArray(processedData) ? processedData.length : 0} élément{Array.isArray(processedData) && processedData.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Exploration interactive des éléments de {title.toLowerCase()} identifiés lors de l'analyse du marché. 
              Cliquez sur chaque vignette pour découvrir les détails et définitions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grille de vignettes - Masquée pour le vocabulaire, technodiversité et IA qui ont un affichage spécialisé */}
      {specialProcessing !== 'vocabulary' && specialProcessing !== 'technodiversite' && specialProcessing !== 'ia_fonctionnalites' && Array.isArray(processedData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {processedData.map((item, index) => (
            <InteractiveVignette
              key={`${variant}-${index}`}
              data={item}
              variant={variant}
            />
          ))}
        </div>
      )}

      {/* Affichage spécialisé pour le vocabulaire */}
      {specialProcessing === 'vocabulary' && (
        <VocabularyVignetteGrid
          vocabularyData={data}
          importSources={importSources}
          className="w-full"
        />
      )}

      {/* Affichage spécialisé pour la technodiversité */}
      {specialProcessing === 'technodiversite' && typeof processedData === 'object' && 'totalCount' in processedData && (
        <TechnodiversiteVignetteGrid
          technodiversiteData={data}
          importSources={importSources}
          className="w-full"
        />
      )}

      {/* Affichage spécialisé pour les fonctionnalités IA */}
      {specialProcessing === 'ia_fonctionnalites' && (
        <IaFonctionnalitesVignetteGrid
          data={data}
          importSources={importSources}
          className="w-full"
        />
      )}

      {/* Groupement par catégorie pour les autres types */}
      {!specialProcessing && Array.isArray(processedData) && processedData.some(item => item.category && item.category !== 'Général') && (
        <div className="space-y-6">
          {/* Affichage standard pour les autres types */}
          {Array.from(new Set(processedData.map(item => item.category))).map(category => {
            const categoryItems = processedData.filter(item => item.category === category);
            
            if (categoryItems.length === 0 || !category || category === 'Général') return null;
            
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-border/30">
                  <h4 className="font-medium text-lg">{category}</h4>
                  <Badge variant="outline" className="text-xs">
                    {categoryItems.length} élément{categoryItems.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryItems.map((item, index) => (
                    <InteractiveVignette
                      key={`${category}-${index}`}
                      data={item}
                      variant={variant}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};