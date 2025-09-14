import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InteractiveVignette } from './InteractiveVignette';
import { processEmpreintesHumainesData } from '@/utils/empreintesHumainesDataUtils';
import { mapInfrastructureVariant } from '@/utils/vignetteStyleUtils';

interface InfrastructureVignetteGridProps {
  empreintesHumainesData: any;
  className?: string;
  importSources?: any[];
}

export const InfrastructureVignetteGrid: React.FC<InfrastructureVignetteGridProps> = ({ 
  empreintesHumainesData, 
  className = '',
  importSources = [] 
}) => {
  const processedData = React.useMemo(() => {
    return processEmpreintesHumainesData(empreintesHumainesData);
  }, [empreintesHumainesData]);

  const sections = [
    { 
      key: 'industrielles', 
      title: 'Infrastructures Industrielles', 
      bgClasses: 'from-amber/8 to-white border-amber/15', 
      textClass: 'text-amber-700', 
      emoji: '🏭' 
    },
    { 
      key: 'patrimoniales', 
      title: 'Patrimoine & Architecture', 
      bgClasses: 'from-rose/8 to-white border-rose/15', 
      textClass: 'text-rose-700', 
      emoji: '🏛️' 
    },
    { 
      key: 'transport', 
      title: 'Infrastructures de Transport', 
      bgClasses: 'from-blue/8 to-white border-blue/15', 
      textClass: 'text-blue-700', 
      emoji: '🛤️' 
    },
    { 
      key: 'urbaines', 
      title: 'Développements Urbains', 
      bgClasses: 'from-teal/8 to-white border-teal/15', 
      textClass: 'text-teal-700', 
      emoji: '🏘️' 
    },
  ];

  if (processedData.totalCount === 0) {
    return (
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50">🏗️</div>
          <h3 className="text-lg font-medium mb-2">Aucune empreinte humaine identifiée</h3>
          <p className="text-muted-foreground">
            Aucune infrastructure ou aménagement humain recensé dans cette exploration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Vue d'ensemble */}
      <div className="mb-6">
        <h3 className="font-bold text-xl text-foreground tracking-wide mb-2">
          Empreintes Humaines sur le Territoire
        </h3>
        <p className="text-sm text-muted-foreground">
          {processedData.totalCount} infrastructure{processedData.totalCount > 1 ? 's' : ''} et aménagement{processedData.totalCount > 1 ? 's' : ''} identifié{processedData.totalCount > 1 ? 's' : ''}
        </p>
      </div>

      {/* Sections par catégorie */}
      {sections.map(({ key, title, bgClasses, textClass, emoji }) => {
        const arr = (processedData as any)[key] as any[] | undefined;
        if (!arr || !arr.length) return null;
        
        return (
          <div key={key} className="space-y-6">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${bgClasses} border shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bgClasses} border shadow-sm flex items-center justify-center`}>
                  <span className="text-2xl">{emoji}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-white tracking-wide">{title}</h3>
                  <Badge variant="secondary" className="mt-1 font-bold px-3 py-1 bg-slate/10 text-white italic border-slate/20">
                    {arr.length} infrastructure{arr.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {arr.map((item, index) => (
                <InteractiveVignette
                  key={`${key}-${index}`}
                  data={item}
                  variant={mapInfrastructureVariant(item)}
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