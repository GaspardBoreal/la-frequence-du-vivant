// Text Anthologie View - Filter texts by literary type with shareable URLs
// Mirrors PlaylistSelectionView for consistency
import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Share2, Check, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getTextTypeInfo, TextType, TEXT_TYPES_REGISTRY } from '@/types/textTypes';

interface TextItem {
  id: string;
  titre: string;
  type_texte: TextType;
  marche_id: string;
  marcheNomMarche?: string;
  marcheVille?: string;
}

interface TextAnthologieViewProps {
  texts: TextItem[];
  selectedTypes: Set<TextType>;
  onTypesChange: (types: Set<TextType>) => void;
  onReadSelection: () => void;
  onTextSelect: (index: number) => void;
  currentTextIndex: number;
  explorationSlug: string;
}

interface AvailableType {
  type: TextType;
  info: { label: string; icon: string };
  count: number;
}

export default function TextAnthologieView({
  texts,
  selectedTypes,
  onTypesChange,
  onReadSelection,
  onTextSelect,
  currentTextIndex,
  explorationSlug
}: TextAnthologieViewProps) {
  // Get available types from texts
  const availableTypes = useMemo((): AvailableType[] => {
    const typeCount: Map<TextType, number> = new Map();
    
    texts.forEach(text => {
      if (text.type_texte) {
        typeCount.set(text.type_texte, (typeCount.get(text.type_texte) || 0) + 1);
      }
    });
    
    return Array.from(typeCount.entries())
      .map(([type, count]) => {
        const info = TEXT_TYPES_REGISTRY[type];
        return {
          type,
          info: info ? { label: info.label, icon: info.icon } : { label: type, icon: '📝' },
          count
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [texts]);

  // Filter texts based on selected types
  const filteredTexts = useMemo(() => {
    if (selectedTypes.size === 0) return [];
    
    return texts
      .map((text, index) => ({ ...text, globalIndex: index }))
      .filter(text => selectedTypes.has(text.type_texte));
  }, [texts, selectedTypes]);

  // Toggle type selection
  const handleTypeToggle = useCallback((type: TextType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    onTypesChange(newSet);
  }, [selectedTypes, onTypesChange]);

  // Select all types
  const handleSelectAll = useCallback(() => {
    const allTypes = new Set(availableTypes.map(t => t.type));
    onTypesChange(allTypes);
  }, [availableTypes, onTypesChange]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    onTypesChange(new Set());
  }, [onTypesChange]);

  // Generate and share URL
  const handleShareSelection = useCallback(async () => {
    if (selectedTypes.size === 0) {
      toast.error('Sélectionnez au moins un type littéraire');
      return;
    }

    const typesParam = Array.from(selectedTypes).join(',');
    const url = `${window.location.origin}/explorations/${explorationSlug}/lire?types=${typesParam}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Anthologie littéraire - Galerie Fleuve',
          text: `Découvrez cette sélection : ${Array.from(selectedTypes).map(t => 
            availableTypes.find(at => at.type === t)?.info.label
          ).filter(Boolean).join(', ')}`,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié !', {
          description: 'Partagez ce lien pour lire cette anthologie'
        });
      }
    } catch (err) {
      // User cancelled share or error occurred
      if ((err as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié !');
      }
    }
  }, [selectedTypes, explorationSlug, availableTypes]);

  if (availableTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p>Aucun type littéraire détecté</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium">Filtrer par type</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs h-7 px-2"
          >
            Tout
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="text-xs h-7 px-2"
          >
            Aucun
          </Button>
        </div>
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((typeInfo) => {
          const isSelected = selectedTypes.has(typeInfo.type);
          
          return (
            <motion.button
              key={typeInfo.type}
              onClick={() => handleTypeToggle(typeInfo.type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
                isSelected
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "border-muted bg-muted/30 text-muted-foreground hover:border-muted-foreground/50"
              )}
            >
              <span className="text-lg">{typeInfo.info.icon}</span>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{typeInfo.info.label}</span>
                <span className="text-xs opacity-70">
                  {typeInfo.count} texte{typeInfo.count > 1 ? 's' : ''}
                </span>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 ml-1" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selection summary & actions */}
      <AnimatePresence mode="wait">
        {selectedTypes.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 rounded-xl p-4 space-y-3 border border-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {filteredTexts.length} texte{filteredTexts.length > 1 ? 's' : ''} sélectionné{filteredTexts.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareSelection}
                  className="gap-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Partager</span>
                </Button>
                <Button
                  size="sm"
                  onClick={onReadSelection}
                  disabled={filteredTexts.length === 0}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <BookOpen className="h-4 w-4" />
                  Lire
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator className="my-2" />

      {/* Filtered texts list */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground mb-2">
          {selectedTypes.size === 0 
            ? 'Sélectionnez un ou plusieurs types pour voir les textes correspondants'
            : `${filteredTexts.length} résultat${filteredTexts.length > 1 ? 's' : ''}`
          }
        </p>
        
        <AnimatePresence>
          {filteredTexts.map((text, idx) => {
            const typeInfo = getTextTypeInfo(text.type_texte);
            const isCurrentText = text.globalIndex === currentTextIndex;
            
            return (
              <motion.div
                key={text.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: idx * 0.03 }}
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
                  <div className="flex items-center gap-3 w-full">
                    {/* Reading indicator or index */}
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
                      <span className={cn(
                        "font-medium truncate text-sm block",
                        isCurrentText ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                      )}>
                        {text.titre}
                      </span>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {typeInfo && (
                          <Badge 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 h-5 gap-1"
                          >
                            <span>{typeInfo.icon}</span>
                            <span>{typeInfo.label}</span>
                          </Badge>
                        )}
                        
                        {text.marcheNomMarche && (
                          <span className="text-xs text-muted-foreground">
                            {text.marcheNomMarche}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
