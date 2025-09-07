import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InteractiveVignette } from './InteractiveVignette';
import { Database, ExternalLink } from 'lucide-react';
import { processVocabularyData } from '@/utils/vocabularyDataUtils';

interface VignetteGridProps {
  title: string;
  data: any;
  variant: 'vocabulary' | 'infrastructure' | 'agro' | 'technology';
  icon: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  specialProcessing?: 'vocabulary';
}

export const VignetteGrid: React.FC<VignetteGridProps> = ({ 
  title, 
  data, 
  variant, 
  icon, 
  className = '',
  emptyMessage = `Aucune donnée de ${title.toLowerCase()} disponible`,
  specialProcessing
}) => {
  // Process data into vignette format
  const processedData = React.useMemo(() => {
    if (!data) return [];
    
    // Traitement spécial pour le vocabulaire
    if (specialProcessing === 'vocabulary') {
      const processed = processVocabularyData(data);
      return [...processed.termes, ...processed.sources];
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

  if (!data || processedData.length === 0) {
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
      {/* En-tête avec statistiques */}
      <Card className={getVariantBorder()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className={`${getVariantColor()}`}>
              {icon}
            </div>
            <div>
              <span>{title}</span>
              <Badge variant="secondary" className="ml-2">
                {processedData.length} élément{processedData.length > 1 ? 's' : ''}
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

      {/* Grille de vignettes - Masquée pour le vocabulaire qui a un affichage spécialisé */}
      {specialProcessing !== 'vocabulary' && (
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

      {/* Groupement par catégorie si applicable */}
      {processedData.some(item => item.category && item.category !== 'Général') && (
        <div className="space-y-6">
          {specialProcessing === 'vocabulary' ? (
            // Affichage spécial pour le vocabulaire avec sections ordonnées
            <>
              {/* Section Termes */}
              {processedData.filter(item => item.category === 'termes').length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/30">
                    <h4 className="font-medium text-lg">termes</h4>
                    <Badge variant="outline" className="text-xs">
                      {processedData.filter(item => item.category === 'termes').length} élément{processedData.filter(item => item.category === 'termes').length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {processedData
                      .filter(item => item.category === 'termes')
                      .map((item, index) => (
                        <InteractiveVignette
                          key={`termes-${index}`}
                          data={item}
                          variant={variant}
                        />
                      ))
                    }
                  </div>
                </div>
              )}
              
              {/* Section Sources */}
              {processedData.filter(item => item.category === 'source_ids').length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/30">
                    <h4 className="font-medium text-lg flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      source_ids
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {processedData.filter(item => item.category === 'source_ids').length} source{processedData.filter(item => item.category === 'source_ids').length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {/* Affichage groupé des sources comme Source IDs */}
                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-accent" />
                        Sources détaillées ({processedData.filter(item => item.category === 'source_ids').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {processedData
                          .filter(item => item.category === 'source_ids')
                          .map((source, index) => (
                            <div key={`source-${index}`} className="bg-background/50 rounded-lg p-4 border border-border/30">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-sm">{source.titre}</h5>
                                <Badge variant="secondary" className="text-xs">
                                  {source.metadata?.type || 'source'}
                                </Badge>
                              </div>
                              
                              {source.description_courte && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {source.description_courte}
                                </p>
                              )}
                              
                              {source.details && (
                                <p className="text-xs text-muted-foreground">
                                  {source.details}
                                </p>
                              )}
                              
                              {source.metadata?.url && (
                                <a 
                                  href={source.metadata.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Consulter la source
                                </a>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            // Affichage standard pour les autres types
            Array.from(new Set(processedData.map(item => item.category))).map(category => {
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
            })
          )}
        </div>
      )}
    </div>
  );
};