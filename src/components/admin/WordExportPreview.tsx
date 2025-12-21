import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp, FileText, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TexteExport {
  id: string;
  titre: string;
  contenu: string;
  type_texte: string;
  marche_nom?: string;
  marche_ville?: string;
  marche_region?: string;
  marche_date?: string;
}

interface WordExportPreviewProps {
  textes: TexteExport[];
  organizationMode: 'type' | 'marche';
  includeMetadata: boolean;
  includeCoverPage: boolean;
}

const TEXT_TYPE_LABELS: Record<string, string> = {
  haiku: 'Haïkus',
  poeme: 'Poèmes',
  senryu: 'Senryūs',
  haibun: 'Haïbuns',
  'texte-libre': 'Textes libres',
  fable: 'Fables',
  prose: 'Proses',
  recit: 'Récits',
};

/**
 * Parse HTML content to React elements with proper formatting
 */
const parseHtmlToReact = (html: string): React.ReactNode[] => {
  if (!html) return [];

  // Normalize HTML entities
  let content = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '\"')
    .replace(/&#39;/g, "'");

  // Convert block elements to paragraph markers
  const PARA_MARKER = '§§PARA§§';
  content = content
    .replace(/<\/?div>/gi, PARA_MARKER)
    .replace(/<\/?p>/gi, PARA_MARKER)
    .replace(/<br\s*\/?>/gi, PARA_MARKER)
    .replace(/<div[^>]*>/gi, '')
    .replace(/<p[^>]*>/gi, '')
    .replace(/\n/g, PARA_MARKER);

  // Strip span tags but keep content
  content = content.replace(/<\/?span[^>]*>/gi, '');

  // Split into paragraphs
  const rawParagraphs = content.split(PARA_MARKER).filter(p => p.trim());

  return rawParagraphs.map((para, paraIndex) => {
    // Parse inline formatting
    const elements = parseInlineFormatting(para.trim(), paraIndex);
    return (
      <p key={paraIndex} className="mb-2 last:mb-0">
        {elements}
      </p>
    );
  });
};

/**
 * Parse inline formatting (bold, italic) within a paragraph
 */
const parseInlineFormatting = (text: string, paraIndex: number): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let elementKey = 0;

  // Combined regex for em/i (italic) and strong/b (bold)
  const formatRegex = /<(em|i|strong|b)>([\s\S]*?)<\/\1>/gi;
  
  let match;
  while ((match = formatRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      const beforeText = stripTags(text.substring(currentIndex, match.index));
      if (beforeText) {
        elements.push(<span key={`${paraIndex}-${elementKey++}`}>{beforeText}</span>);
      }
    }

    const tag = match[1].toLowerCase();
    const content = stripTags(match[2]);
    
    if (tag === 'em' || tag === 'i') {
      elements.push(
        <em key={`${paraIndex}-${elementKey++}`} className="italic text-muted-foreground">
          {content}
        </em>
      );
    } else if (tag === 'strong' || tag === 'b') {
      elements.push(
        <strong key={`${paraIndex}-${elementKey++}`} className="font-semibold">
          {content}
        </strong>
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remaining = stripTags(text.substring(currentIndex));
    if (remaining) {
      elements.push(<span key={`${paraIndex}-${elementKey++}`}>{remaining}</span>);
    }
  }

  // If no formatting was found, return the whole text stripped of tags
  if (elements.length === 0) {
    return [<span key={`${paraIndex}-0`}>{stripTags(text)}</span>];
  }

  return elements;
};

const stripTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, '').trim();
};

/**
 * Group textes by type
 */
const groupByType = (textes: TexteExport[]): Map<string, TexteExport[]> => {
  const groups = new Map<string, TexteExport[]>();
  const typeOrder = ['haiku', 'senryu', 'poeme', 'haibun', 'texte-libre', 'fable', 'prose', 'recit'];
  
  textes.forEach(texte => {
    const type = texte.type_texte.toLowerCase();
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(texte);
  });

  // Sort by predefined order
  const sortedMap = new Map<string, TexteExport[]>();
  typeOrder.forEach(type => {
    if (groups.has(type)) {
      sortedMap.set(type, groups.get(type)!);
    }
  });
  // Add any remaining types not in the predefined order
  groups.forEach((value, key) => {
    if (!sortedMap.has(key)) {
      sortedMap.set(key, value);
    }
  });

  return sortedMap;
};

/**
 * Group textes by marche (chronologically)
 */
const groupByMarche = (textes: TexteExport[]): Map<string, { date: string | null; textes: TexteExport[] }> => {
  const groups = new Map<string, { date: string | null; textes: TexteExport[] }>();
  
  textes.forEach(texte => {
    const key = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    if (!groups.has(key)) {
      groups.set(key, { date: texte.marche_date || null, textes: [] });
    }
    groups.get(key)!.textes.push(texte);
  });

  // Sort by date
  const sortedEntries = Array.from(groups.entries())
    .sort((a, b) => {
      const dateA = a[1].date || '9999-12-31';
      const dateB = b[1].date || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

  const sortedMap = new Map<string, { date: string | null; textes: TexteExport[] }>();
  sortedEntries.forEach(([key, value]) => {
    sortedMap.set(key, value);
  });

  return sortedMap;
};

const formatDate = (date: string): string => {
  const formatted = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const TextePreviewCard: React.FC<{
  texte: TexteExport;
  includeMetadata: boolean;
}> = ({ texte, includeMetadata }) => {
  return (
    <div className="border-l-2 border-accent/30 pl-4 py-2">
      {/* Title */}
      <h4 className="font-semibold text-foreground mb-1">{texte.titre}</h4>
      
      {/* Metadata */}
      {includeMetadata && (texte.marche_nom || texte.marche_ville) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3" />
          <span className="italic">
            {[texte.marche_nom, texte.marche_ville !== texte.marche_nom && texte.marche_ville]
              .filter(Boolean)
              .join(' – ')}
          </span>
          {texte.marche_region && (
            <span className="text-muted-foreground/70 ml-1">• {texte.marche_region}</span>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="text-sm text-foreground/90 font-serif leading-relaxed">
        {parseHtmlToReact(texte.contenu)}
      </div>
    </div>
  );
};

const WordExportPreview: React.FC<WordExportPreviewProps> = ({
  textes,
  organizationMode,
  includeMetadata,
  includeCoverPage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const groupedTextes = useMemo(() => {
    if (organizationMode === 'type') {
      return { type: 'type' as const, groups: groupByType(textes) };
    } else {
      return { type: 'marche' as const, groups: groupByMarche(textes) };
    }
  }, [textes, organizationMode]);

  const toggleSection = (key: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedSections(newSet);
  };

  if (textes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun texte sélectionné pour l'aperçu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-accent" />
            Aperçu du document
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1"
          >
            {isExpanded ? (
              <>
                <EyeOff className="h-4 w-4" />
                Réduire
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Voir l'aperçu
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <ScrollArea className="h-[500px] rounded-lg border bg-card">
            <div className="p-6 space-y-6">
              {/* Simulated Cover Page */}
              {includeCoverPage && (
                <div className="text-center py-8 border-b border-border/50 mb-6">
                  <p className="text-sm text-muted-foreground tracking-wider mb-4">GASPARD BORÉAL</p>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Textes Littéraires
                  </h1>
                  <p className="text-muted-foreground italic">{textes.length} textes</p>
                </div>
              )}

              {/* Grouped Sections */}
              {organizationMode === 'type' ? (
                // Group by type
                Array.from((groupedTextes.groups as Map<string, TexteExport[]>).entries()).map(([type, groupTextes]) => (
                  <Collapsible
                    key={type}
                    open={expandedSections.has(type)}
                    onOpenChange={() => toggleSection(type)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-foreground">
                            {TEXT_TYPE_LABELS[type] || type}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {groupTextes.length}
                          </Badge>
                        </div>
                        {expandedSections.has(type) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-4 mt-4 ml-2">
                        {groupTextes.slice(0, 5).map(texte => (
                          <TextePreviewCard
                            key={texte.id}
                            texte={texte}
                            includeMetadata={includeMetadata}
                          />
                        ))}
                        {groupTextes.length > 5 && (
                          <p className="text-sm text-muted-foreground italic text-center py-2">
                            ... et {groupTextes.length - 5} autres textes
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              ) : (
                // Group by marche
                Array.from((groupedTextes.groups as Map<string, { date: string | null; textes: TexteExport[] }>).entries()).map(([marcheName, { date, textes: groupTextes }]) => (
                  <Collapsible
                    key={marcheName}
                    open={expandedSections.has(marcheName)}
                    onOpenChange={() => toggleSection(marcheName)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-foreground">
                              {marcheName}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {groupTextes.length}
                            </Badge>
                          </div>
                          {date && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              {formatDate(date)}
                            </p>
                          )}
                        </div>
                        {expandedSections.has(marcheName) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-4 mt-4 ml-2">
                        {groupTextes.slice(0, 5).map(texte => (
                          <TextePreviewCard
                            key={texte.id}
                            texte={texte}
                            includeMetadata={includeMetadata}
                          />
                        ))}
                        {groupTextes.length > 5 && (
                          <p className="text-sm text-muted-foreground italic text-center py-2">
                            ... et {groupTextes.length - 5} autres textes
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          </ScrollArea>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Aperçu simplifié — Le document Word final aura une mise en forme plus élaborée
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default WordExportPreview;
