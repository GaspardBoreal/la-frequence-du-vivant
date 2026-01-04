// Text Parcours View - Groups texts by marche with literary type badges
// Mirrors PlaylistParcoursView for consistency
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapPin, ChevronDown, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTextTypeInfo, TextType } from '@/types/textTypes';

interface TextItem {
  id: string;
  titre: string;
  type_texte: TextType;
  marche_id: string;
  marcheNomMarche?: string;
  marcheVille?: string;
}

interface TextParcoursViewProps {
  texts: TextItem[];
  currentTextIndex: number;
  onTextSelect: (index: number) => void;
}

interface MarcheGroup {
  marcheId: string;
  marcheName: string;
  marcheLocation?: string;
  marcheOrdre: number;
  texts: Array<TextItem & { globalIndex: number }>;
}

export default function TextParcoursView({
  texts,
  currentTextIndex,
  onTextSelect
}: TextParcoursViewProps) {
  // Group texts by marche
  const marcheGroups = useMemo((): MarcheGroup[] => {
    const groups: Map<string, MarcheGroup> = new Map();
    let marcheOrdre = 0;
    
    texts.forEach((text, globalIndex) => {
      const key = text.marche_id;
      
      if (!groups.has(key)) {
        marcheOrdre++;
        groups.set(key, {
          marcheId: key,
          marcheName: text.marcheNomMarche || text.marcheVille || `Marche ${marcheOrdre}`,
          marcheLocation: text.marcheVille,
          marcheOrdre,
          texts: []
        });
      }
      
      const group = groups.get(key)!;
      group.texts.push({ ...text, globalIndex });
    });
    
    // Sort by marche order
    return Array.from(groups.values()).sort((a, b) => a.marcheOrdre - b.marcheOrdre);
  }, [texts]);

  // Find which marche contains the current text
  const currentMarcheId = useMemo(() => {
    const currentText = texts[currentTextIndex];
    return currentText?.marche_id ?? '';
  }, [texts, currentTextIndex]);

  // Default open state: only current marche is open
  const [openMarches, setOpenMarches] = React.useState<Set<string>>(() => {
    return new Set(currentMarcheId ? [currentMarcheId] : marcheGroups.length > 0 ? [marcheGroups[0].marcheId] : []);
  });

  // Update open state when current text changes
  React.useEffect(() => {
    if (currentMarcheId) {
      setOpenMarches(prev => new Set([...prev, currentMarcheId]));
    }
  }, [currentMarcheId]);

  const toggleMarche = (marcheId: string) => {
    setOpenMarches(prev => {
      const next = new Set(prev);
      if (next.has(marcheId)) {
        next.delete(marcheId);
      } else {
        next.add(marcheId);
      }
      return next;
    });
  };

  if (marcheGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p>Aucun texte disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {marcheGroups.map((group) => {
        const isCurrentMarche = group.marcheId === currentMarcheId;
        const isOpen = openMarches.has(group.marcheId);
        
        return (
          <Collapsible
            key={group.marcheId}
            open={isOpen}
            onOpenChange={() => toggleMarche(group.marcheId)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
              className={cn(
                "w-full justify-between items-start p-4 h-auto rounded-xl transition-all",
                  isCurrentMarche 
                    ? "bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20" 
                    : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                )}
              >
                <div className="flex flex-col items-start gap-1 text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={isCurrentMarche ? "default" : "outline"} 
                      className={cn(
                        "text-xs px-2 py-0.5",
                        isCurrentMarche && "bg-emerald-600"
                      )}
                    >
                      Marche {group.marcheOrdre}
                    </Badge>
                    {isCurrentMarche && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                      />
                    )}
                  </div>
                  <span className="font-semibold text-foreground break-words whitespace-normal">
                    {group.marcheName}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {group.marcheLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {group.marcheLocation}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {group.texts.length} texte{group.texts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} 
                />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 pr-2 py-2 space-y-1"
                >
                  {group.texts.map((text, idx) => {
                    const isCurrentText = text.globalIndex === currentTextIndex;
                    const typeInfo = getTextTypeInfo(text.type_texte);
                    
                    return (
                      <motion.div
                        key={text.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={() => onTextSelect(text.globalIndex)}
                          className={cn(
                            "w-full justify-start text-left p-3 h-auto rounded-lg transition-all",
                            isCurrentText 
                              ? "bg-emerald-500/10 border border-emerald-500/20" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-start gap-3 w-full">
                            {/* Reading indicator or text number */}
                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                              {isCurrentText ? (
                                <BookOpen className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            
                            {/* Text info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "font-medium truncate text-sm",
                                  isCurrentText ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                                )}>
                                  {text.titre}
                                </span>
                              </div>
                              
                              {/* Literary type badge */}
                              {typeInfo && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-[10px] px-1.5 py-0 h-5 gap-1"
                                >
                                  <span>{typeInfo.icon}</span>
                                  <span className="hidden sm:inline">{typeInfo.label}</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
