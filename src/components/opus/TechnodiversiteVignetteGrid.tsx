import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InteractiveVignette } from './InteractiveVignette';
import { processTechnodiversiteData } from '@/utils/technodiversiteDataUtils';

interface TechnodiversiteVignetteGridProps {
  technodiversiteData: any;
  className?: string;
  importSources?: any[];
}

export const TechnodiversiteVignetteGrid: React.FC<TechnodiversiteVignetteGridProps> = ({ 
  technodiversiteData, 
  className = '',
  importSources = [] 
}) => {
  const processedData = React.useMemo(() => {
    return processTechnodiversiteData(technodiversiteData);
  }, [technodiversiteData]);

  const extraSections: { key: keyof typeof processedData; title: string; bgClasses: string; textClass: string; emoji: string }[] = [
    { key: 'innovations_locales' as any, title: 'Innovations Locales', bgClasses: 'from-primary/20 to-primary/10 border-primary/20', textClass: 'text-primary', emoji: '🛠️' },
    { key: 'technologies_vertes' as any, title: 'Technologies Vertes', bgClasses: 'from-success/20 to-success/10 border-success/20', textClass: 'text-success', emoji: '🌿' },
    { key: 'numerique' as any, title: 'Numérique sobre', bgClasses: 'from-info/20 to-info/10 border-info/20', textClass: 'text-info', emoji: '💾' },
    { key: 'recherche_developpement' as any, title: 'R&D', bgClasses: 'from-warning/20 to-warning/10 border-warning/20', textClass: 'text-warning', emoji: '🧪' },
  ];

  if (processedData.totalCount === 0) {
    return (
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50">🔧</div>
          <h3 className="text-lg font-medium mb-2">Aucune donnée de technodiversité</h3>
          <p className="text-muted-foreground">
            Aucune technologie identifiée dans cette exploration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Innovations */}
      {processedData.innovations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border/30">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">🚀</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary">Innovations Technologiques</h3>
              <Badge variant="secondary" className="ml-2 text-xs">
                {processedData.innovations.length} innovation{processedData.innovations.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.innovations.map((item, index) => (
              <InteractiveVignette
                key={`innovation-${index}`}
                data={item}
                variant="technology"
                importSources={importSources}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fabrication locale */}
      {processedData.fabrication_locale.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border/30">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 border border-warning/20 flex items-center justify-center">
              <span className="text-warning font-bold">🔧</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-warning">Fabrication Locale</h3>
              <Badge variant="secondary" className="ml-2 text-xs">
                {processedData.fabrication_locale.length} pratique{processedData.fabrication_locale.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.fabrication_locale.map((item, index) => (
              <InteractiveVignette
                key={`fabrication-${index}`}
                data={item}
                variant="technology"
                importSources={importSources}
              />
            ))}
          </div>
        </div>
      )}

      {/* Projets Open Source */}
      {processedData.projets_open_source.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-border/30">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-success/10 border border-success/20 flex items-center justify-center">
              <span className="text-success font-bold">🔓</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-success">Projets Open Source</h3>
              <Badge variant="secondary" className="ml-2 text-xs">
                {processedData.projets_open_source.length} projet{processedData.projets_open_source.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.projets_open_source.map((item, index) => (
              <InteractiveVignette
                key={`opensource-${index}`}
                data={item}
                variant="technology"
                importSources={importSources}
              />
            ))}
          </div>
        </div>
      )}
      {/* Sections supplémentaires détectées dynamiquement */}
      {extraSections.map(({ key, title, bgClasses, textClass, emoji }) => {
        const arr = (processedData as any)[key] as any[] | undefined;
        if (!arr || !arr.length) return null;
        return (
          <div key={String(key)} className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/30">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgClasses} border flex items-center justify-center`}>
                <span className={`${textClass} font-bold`}>{emoji}</span>
              </div>
              <div>
                <h3 className={`font-semibold text-lg ${textClass}`}>{title}</h3>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {arr.length} élément{arr.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arr.map((item, index) => (
                <InteractiveVignette
                  key={`${String(key)}-${index}`}
                  data={item}
                  variant="technology"
                  importSources={importSources}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};