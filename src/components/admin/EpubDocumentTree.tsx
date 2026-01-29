import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, MapPin, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { groupTextesByPartie } from '@/utils/epubExportUtils';
import type { TexteExport, EpubExportOptions } from '@/utils/epubExportUtils';

interface EpubDocumentTreeProps {
  textes: TexteExport[];
  options: EpubExportOptions;
}

const EpubDocumentTree: React.FC<EpubDocumentTreeProps> = ({ textes, options }) => {
  const { colorScheme } = options;
  const [expandedParties, setExpandedParties] = useState<Set<string>>(new Set());
  const [expandedMarches, setExpandedMarches] = useState<Set<string>>(new Set());

  // Group textes by partie using existing utility
  const groupedData = useMemo(() => groupTextesByPartie(textes), [textes]);

  // Total counts
  const totalTextes = textes.length;
  const totalMarches = useMemo(() => {
    let count = 0;
    groupedData.forEach(group => {
      count += group.marches.size;
    });
    return count;
  }, [groupedData]);

  const togglePartie = (partieId: string) => {
    setExpandedParties(prev => {
      const next = new Set(prev);
      if (next.has(partieId)) {
        next.delete(partieId);
      } else {
        next.add(partieId);
      }
      return next;
    });
  };

  const toggleMarche = (marcheKey: string) => {
    setExpandedMarches(prev => {
      const next = new Set(prev);
      if (next.has(marcheKey)) {
        next.delete(marcheKey);
      } else {
        next.add(marcheKey);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'haiku': 'Haïku',
      'senryu': 'Senryū',
      'poeme': 'Poème',
      'fable': 'Fable',
      'manifeste': 'Manifeste',
    };
    return labels[type.toLowerCase()] || type;
  };

  return (
    <div 
      className="h-[400px] flex flex-col"
      style={{ 
        backgroundColor: colorScheme.background,
        color: colorScheme.text,
      }}
    >
      {/* Header with stats */}
      <div 
        className="px-4 py-2 border-b flex items-center justify-between"
        style={{ borderColor: colorScheme.secondary + '30' }}
      >
        <span 
          className="text-xs font-medium"
          style={{ color: colorScheme.primary }}
        >
          Structure du document
        </span>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {groupedData.filter(g => g.partie).length} parties
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {totalMarches} marches
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {totalTextes} textes
          </Badge>
        </div>
      </div>

      {/* Scrollable tree */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          {groupedData.map((partieGroup, partieIndex) => {
            const partieId = partieGroup.partie?.id || `unassigned-${partieIndex}`;
            const isPartieExpanded = expandedParties.has(partieId);
            const partieTexteCount = Array.from(partieGroup.marches.values())
              .reduce((sum, m) => sum + m.textes.length, 0);

            return (
              <Collapsible
                key={partieId}
                open={isPartieExpanded}
                onOpenChange={() => togglePartie(partieId)}
              >
                <CollapsibleTrigger 
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/10 transition-colors"
                >
                  {isPartieExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" style={{ color: colorScheme.primary }} />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: colorScheme.primary }} />
                  )}
                  <BookOpen className="h-4 w-4 shrink-0" style={{ color: colorScheme.primary }} />
                  
                  {partieGroup.partie ? (
                    <span className="flex-1 text-left text-sm font-medium truncate">
                      <span style={{ color: colorScheme.primary }}>
                        {partieGroup.partie.numeroRomain}.
                      </span>{' '}
                      {partieGroup.partie.titre}
                    </span>
                  ) : (
                    <span 
                      className="flex-1 text-left text-sm italic"
                      style={{ color: colorScheme.secondary }}
                    >
                      Textes sans partie assignée
                    </span>
                  )}
                  
                  <Badge 
                    variant="outline" 
                    className="text-xs shrink-0"
                    style={{ 
                      borderColor: colorScheme.accent,
                      color: colorScheme.accent,
                    }}
                  >
                    {partieTexteCount}
                  </Badge>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="ml-6 mt-1 space-y-1">
                    {Array.from(partieGroup.marches.entries()).map(([marcheName, marcheData]) => {
                      const marcheKey = `${partieId}-${marcheName}`;
                      const isMarcheExpanded = expandedMarches.has(marcheKey);

                      return (
                        <Collapsible
                          key={marcheKey}
                          open={isMarcheExpanded}
                          onOpenChange={() => toggleMarche(marcheKey)}
                        >
                          <CollapsibleTrigger 
                            className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/10 transition-colors"
                          >
                            {isMarcheExpanded ? (
                              <ChevronDown className="h-3 w-3 shrink-0" style={{ color: colorScheme.secondary }} />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0" style={{ color: colorScheme.secondary }} />
                            )}
                            <MapPin className="h-3 w-3 shrink-0" style={{ color: colorScheme.secondary }} />
                            
                            <span className="flex-1 text-left text-xs truncate">
                              {marcheName}
                              {marcheData.date && (
                                <span 
                                  className="ml-1"
                                  style={{ color: colorScheme.secondary }}
                                >
                                  ({formatDate(marcheData.date)})
                                </span>
                              )}
                            </span>
                            
                            <span 
                              className="text-xs shrink-0"
                              style={{ color: colorScheme.secondary }}
                            >
                              {marcheData.textes.length}
                            </span>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="ml-5 mt-0.5 space-y-0.5">
                              {marcheData.textes.map((texte, texteIndex) => (
                                <div
                                  key={texte.id}
                                  className="flex items-center gap-2 px-2 py-0.5 text-xs rounded hover:bg-secondary/5"
                                >
                                  <FileText 
                                    className="h-3 w-3 shrink-0" 
                                    style={{ color: colorScheme.accent + '80' }} 
                                  />
                                  <span className="flex-1 truncate">
                                    {texte.titre}
                                  </span>
                                  <span 
                                    className="text-[10px] italic shrink-0"
                                    style={{ color: colorScheme.secondary }}
                                  >
                                    {getTypeLabel(texte.type_texte)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {groupedData.length === 0 && (
            <div 
              className="text-center py-8 text-sm italic"
              style={{ color: colorScheme.secondary }}
            >
              Aucun texte sélectionné
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EpubDocumentTree;
