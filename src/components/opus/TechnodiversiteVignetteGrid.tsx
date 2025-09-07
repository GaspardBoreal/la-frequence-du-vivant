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
    { key: 'innovations_locales' as any, title: 'Innovations Locales', bgClasses: 'from-tech-biomimicry-bg to-paper border-tech-biomimicry/20', textClass: 'text-tech-biomimicry', emoji: '🛠️' },
    { key: 'technologies_vertes' as any, title: 'Technologies Vertes', bgClasses: 'from-success/10 to-paper border-success/20', textClass: 'text-success', emoji: '🌿' },
    { key: 'numerique' as any, title: 'Numérique sobre', bgClasses: 'from-tech-openhardware-bg to-paper border-tech-openhardware/20', textClass: 'text-tech-openhardware', emoji: '💾' },
    { key: 'recherche_developpement' as any, title: 'R&D', bgClasses: 'from-tech-lowtech-bg to-paper border-tech-lowtech/20', textClass: 'text-tech-lowtech', emoji: '🧪' },
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
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-tech-generic-bg to-paper border border-tech-generic/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tech-generic/20 to-tech-generic/10 border border-tech-generic/30 flex items-center justify-center shadow-sm">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-tech-generic tracking-wide">Innovations Technologiques</h3>
                <Badge variant="secondary" className="mt-1 bg-tech-generic-bg text-tech-generic border-tech-generic/30 font-bold px-3 py-1">
                  {processedData.innovations.length} innovation{processedData.innovations.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-tech-lowtech-bg to-paper border border-tech-lowtech/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tech-lowtech/20 to-tech-lowtech/10 border border-tech-lowtech/30 flex items-center justify-center shadow-sm">
                <span className="text-2xl">🔧</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-tech-lowtech tracking-wide">Fabrication Locale</h3>
                <Badge variant="secondary" className="mt-1 bg-tech-lowtech-bg text-tech-lowtech border-tech-lowtech/30 font-bold px-3 py-1">
                  {processedData.fabrication_locale.length} pratique{processedData.fabrication_locale.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-success/10 to-paper border border-success/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 border border-success/30 flex items-center justify-center shadow-sm">
                <span className="text-2xl">🔓</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-success tracking-wide">Projets Open Source</h3>
                <Badge variant="secondary" className="mt-1 bg-success/10 text-success border-success/30 font-bold px-3 py-1">
                  {processedData.projets_open_source.length} projet{processedData.projets_open_source.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div key={String(key)} className="space-y-6">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${bgClasses} border shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bgClasses} border shadow-sm flex items-center justify-center`}>
                  <span className="text-2xl">{emoji}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-xl ${textClass} tracking-wide`}>{title}</h3>
                  <Badge variant="secondary" className={`mt-1 font-bold px-3 py-1 ${textClass.replace('text-', 'bg-').replace('-', '-')}/10 ${textClass} border-current/30`}>
                    {arr.length} élément{arr.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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