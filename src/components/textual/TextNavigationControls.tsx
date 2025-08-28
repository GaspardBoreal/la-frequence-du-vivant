import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';
import { getTextTypeInfo } from '@/types/textTypes';
import type { MarcheTexte } from '@/hooks/useMarcheTextes';

interface TextNavigationControlsProps {
  texts: MarcheTexte[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  selectedFamily: string;
}

export default function TextNavigationControls({ 
  texts, 
  currentIndex, 
  onNavigate, 
  selectedFamily 
}: TextNavigationControlsProps) {
  const currentText = texts[currentIndex];
  const hasMultipleTexts = texts.length > 1;
  
  if (!hasMultipleTexts) return null;

  // Find previous/next text of same type
  const currentType = currentText?.type_texte;
  const sameTypeTexts = texts.filter(t => t.type_texte === currentType);
  const currentTypeIndex = sameTypeTexts.findIndex(t => t.id === currentText?.id);
  
  const prevSameType = currentTypeIndex > 0 ? 
    texts.findIndex(t => t.id === sameTypeTexts[currentTypeIndex - 1].id) : -1;
  const nextSameType = currentTypeIndex < sameTypeTexts.length - 1 ? 
    texts.findIndex(t => t.id === sameTypeTexts[currentTypeIndex + 1].id) : -1;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < texts.length - 1;
  const canGoPrevType = prevSameType !== -1;
  const canGoNextType = nextSameType !== -1;

  const typeInfo = currentText ? getTextTypeInfo(currentText.type_texte) : null;

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-lg">
      {/* Sequential navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={!canGoPrev}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        
        <div className="text-xs font-mono text-muted-foreground min-w-[3rem] text-center">
          {currentIndex + 1}/{texts.length}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={!canGoNext}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Current text info */}
      {currentText && typeInfo && (
        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="text-sm">{typeInfo.icon}</span>
          <span className="text-xs font-medium truncate max-w-[120px]">
            {currentText.titre}
          </span>
        </div>
      )}

      {/* Type-based navigation */}
      {sameTypeTexts.length > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(prevSameType)}
            disabled={!canGoPrevType}
            className="h-7 w-7 p-0"
            title={`${typeInfo?.label} précédent`}
          >
            <SkipBack className="h-3 w-3" />
          </Button>
          
          <div className="text-xs text-muted-foreground">
            {currentTypeIndex + 1}/{sameTypeTexts.length}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(nextSameType)}
            disabled={!canGoNextType}
            className="h-7 w-7 p-0"
            title={`${typeInfo?.label} suivant`}
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Mini indicator dots */}
      <div className="flex gap-1">
        {texts.slice(0, 7).map((text, index) => {
          const info = getTextTypeInfo(text.type_texte);
          const isActive = index === currentIndex;
          
          return (
            <button
              key={text.id}
              onClick={() => onNavigate(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'bg-primary scale-125' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
              title={`${info.label}: ${text.titre}`}
            />
          );
        })}
        {texts.length > 7 && (
          <div className="text-xs text-muted-foreground">
            +{texts.length - 7}
          </div>
        )}
      </div>
    </div>
  );
}