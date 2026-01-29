import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp, ChevronRight, FileText, MapPin, BookOpen } from 'lucide-react';
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
  partie_id?: string;
  partie_numero_romain?: string;
  partie_titre?: string;
  partie_sous_titre?: string;
  partie_ordre?: number;
  marche_ordre?: number;
}

interface WordExportPreviewProps {
  textes: TexteExport[];
  organizationMode: 'type' | 'marche';
  includeMetadata: boolean;
  includeCoverPage: boolean;
}

interface PartieGroup {
  id: string | null;
  numeroRomain: string | null;
  titre: string | null;
  sousTitre: string | null;
  ordre: number;
  marches: Map<string, { date: string | null; textes: TexteExport[]; marche_ordre: number }>;
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

/**
 * Group textes by Partie > Marche hierarchy
 */
const groupByPartie = (textes: TexteExport[]): PartieGroup[] => {
  const partieMap = new Map<string, PartieGroup>();
  
  textes.forEach(texte => {
    const partieKey = texte.partie_id || 'sans-partie';
    
    if (!partieMap.has(partieKey)) {
      partieMap.set(partieKey, {
        id: texte.partie_id || null,
        numeroRomain: texte.partie_numero_romain || null,
        titre: texte.partie_titre || null,
        sousTitre: texte.partie_sous_titre || null,
        ordre: texte.partie_ordre ?? 999,
        marches: new Map(),
      });
    }
    
    const partie = partieMap.get(partieKey)!;
    const marcheKey = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    
    if (!partie.marches.has(marcheKey)) {
      partie.marches.set(marcheKey, { 
        date: texte.marche_date || null, 
        textes: [],
        marche_ordre: texte.marche_ordre ?? 999,
      });
    }
    partie.marches.get(marcheKey)!.textes.push(texte);
  });

  // Sort parties by ordre
  const sortedParties = Array.from(partieMap.values())
    .sort((a, b) => a.ordre - b.ordre);

  // Sort marches within each partie by marche_ordre (not by date)
  sortedParties.forEach(partie => {
    const sortedMarches = new Map(
      Array.from(partie.marches.entries())
        .sort((a, b) => a[1].marche_ordre - b[1].marche_ordre)
    );
    partie.marches = sortedMarches;
  });

  return sortedParties;
};

/**
 * Check if any textes have partie assignments
 */
const hasPartieAssignments = (textes: TexteExport[]): boolean => {
  return textes.some(t => t.partie_id && t.partie_titre);
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

const MarcheSection: React.FC<{
  marcheName: string;
  date: string | null;
  textes: TexteExport[];
  includeMetadata: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  indented?: boolean;
}> = ({ marcheName, date, textes, includeMetadata, isExpanded, onToggle, indented = false }) => {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={`flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors ${indented ? 'ml-4' : ''}`}>
          <div>
            <div className="flex items-center gap-3">
              <h3 className={`font-semibold text-foreground ${indented ? 'text-base' : 'text-lg'}`}>
                {marcheName}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {textes.length}
              </Badge>
            </div>
            {date && (
              <p className="text-sm text-muted-foreground italic mt-1">
                {formatDate(date)}
              </p>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`space-y-4 mt-4 ${indented ? 'ml-6' : 'ml-2'}`}>
          {textes.slice(0, 5).map(texte => (
            <TextePreviewCard
              key={texte.id}
              texte={texte}
              includeMetadata={includeMetadata}
            />
          ))}
          {textes.length > 5 && (
            <p className="text-sm text-muted-foreground italic text-center py-2">
              ... et {textes.length - 5} autres textes
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const PartieSection: React.FC<{
  partie: PartieGroup;
  includeMetadata: boolean;
  expandedParties: Set<string>;
  expandedMarches: Set<string>;
  onTogglePartie: (key: string) => void;
  onToggleMarche: (key: string) => void;
}> = ({ partie, includeMetadata, expandedParties, expandedMarches, onTogglePartie, onToggleMarche }) => {
  const partieKey = partie.id || 'sans-partie';
  const isPartieExpanded = expandedParties.has(partieKey);
  const totalTextes = Array.from(partie.marches.values()).reduce((sum, m) => sum + m.textes.length, 0);
  const marchesCount = partie.marches.size;

  // If no partie assignment, render marches directly
  if (!partie.titre) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm italic">Marches non assignées à une partie</span>
        </div>
        {Array.from(partie.marches.entries()).map(([marcheName, { date, textes }]) => (
          <MarcheSection
            key={marcheName}
            marcheName={marcheName}
            date={date}
            textes={textes}
            includeMetadata={includeMetadata}
            isExpanded={expandedMarches.has(marcheName)}
            onToggle={() => onToggleMarche(marcheName)}
          />
        ))}
      </div>
    );
  }

  return (
    <Collapsible open={isPartieExpanded} onOpenChange={() => onTogglePartie(partieKey)}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer hover:bg-primary/10 p-3 rounded-lg transition-colors border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <ChevronRight className={`h-5 w-5 text-primary transition-transform ${isPartieExpanded ? 'rotate-90' : ''}`} />
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">{partie.numeroRomain}.</span>
                <h2 className="font-bold text-lg text-foreground uppercase tracking-wide">
                  {partie.titre}
                </h2>
              </div>
              {partie.sousTitre && (
                <p className="text-sm text-muted-foreground italic mt-0.5 ml-8">
                  {partie.sousTitre}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {marchesCount} marche{marchesCount > 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalTextes} texte{totalTextes > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 mt-3 pl-2 border-l-2 border-primary/30 ml-4">
          {Array.from(partie.marches.entries()).map(([marcheName, { date, textes }]) => (
            <MarcheSection
              key={`${partieKey}-${marcheName}`}
              marcheName={marcheName}
              date={date}
              textes={textes}
              includeMetadata={includeMetadata}
              isExpanded={expandedMarches.has(`${partieKey}-${marcheName}`)}
              onToggle={() => onToggleMarche(`${partieKey}-${marcheName}`)}
              indented
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const WordExportPreview: React.FC<WordExportPreviewProps> = ({
  textes,
  organizationMode,
  includeMetadata,
  includeCoverPage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedParties, setExpandedParties] = useState<Set<string>>(new Set());
  const [expandedMarches, setExpandedMarches] = useState<Set<string>>(new Set());

  const hasParties = useMemo(() => {
    return organizationMode === 'marche' && hasPartieAssignments(textes);
  }, [textes, organizationMode]);

  const partieGroups = useMemo(() => {
    if (organizationMode === 'marche' && hasParties) {
      return groupByPartie(textes);
    }
    return null;
  }, [textes, organizationMode, hasParties]);

  const groupedTextes = useMemo(() => {
    if (organizationMode === 'type') {
      return { type: 'type' as const, groups: groupByType(textes) };
    } else if (!hasParties) {
      return { type: 'marche' as const, groups: groupByMarche(textes) };
    }
    return null;
  }, [textes, organizationMode, hasParties]);

  const togglePartie = (key: string) => {
    const newSet = new Set(expandedParties);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedParties(newSet);
  };

  const toggleMarche = (key: string) => {
    const newSet = new Set(expandedMarches);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedMarches(newSet);
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
              {organizationMode === 'type' && groupedTextes ? (
                // Group by type
                Array.from((groupedTextes.groups as Map<string, TexteExport[]>).entries()).map(([type, groupTextes]) => (
                  <Collapsible
                    key={type}
                    open={expandedMarches.has(type)}
                    onOpenChange={() => toggleMarche(type)}
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
                        {expandedMarches.has(type) ? (
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
              ) : hasParties && partieGroups ? (
                // Group by Partie > Marche hierarchy
                partieGroups.map((partie) => (
                  <PartieSection
                    key={partie.id || 'sans-partie'}
                    partie={partie}
                    includeMetadata={includeMetadata}
                    expandedParties={expandedParties}
                    expandedMarches={expandedMarches}
                    onTogglePartie={togglePartie}
                    onToggleMarche={toggleMarche}
                  />
                ))
              ) : groupedTextes ? (
                // Group by marche only (no parties)
                Array.from((groupedTextes.groups as Map<string, { date: string | null; textes: TexteExport[] }>).entries()).map(([marcheName, { date, textes: groupTextes }]) => (
                  <MarcheSection
                    key={marcheName}
                    marcheName={marcheName}
                    date={date}
                    textes={groupTextes}
                    includeMetadata={includeMetadata}
                    isExpanded={expandedMarches.has(marcheName)}
                    onToggle={() => toggleMarche(marcheName)}
                  />
                ))
              ) : null}
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
