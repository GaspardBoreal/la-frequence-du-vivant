// Text Sommaire Sheet - Responsive navigation sheet for Sommaire Poétique
// Mobile: bottom sheet, Desktop/Tablet: right side panel
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import TextNavigationViewToggle, { TextViewMode } from './TextNavigationViewToggle';
import TextFilView from './TextFilView';
import TextParcoursView from './TextParcoursView';
import TextAnthologieView from './TextAnthologieView';
import { TextType } from '@/types/textTypes';

interface TextItem {
  id: string;
  titre: string;
  type_texte: TextType;
  marche_id: string;
  marcheNomMarche?: string;
  marcheVille?: string;
}

interface TextSommaireSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texts: TextItem[];
  currentTextIndex: number;
  onTextSelect: (index: number) => void;
  viewMode: TextViewMode;
  onViewModeChange: (mode: TextViewMode) => void;
  // Anthologie specific
  selectedTypes: Set<TextType>;
  onTypesChange: (types: Set<TextType>) => void;
  onReadSelection: () => void;
  explorationSlug: string;
}

export default function TextSommaireSheet({
  open,
  onOpenChange,
  texts,
  currentTextIndex,
  onTextSelect,
  viewMode,
  onViewModeChange,
  selectedTypes,
  onTypesChange,
  onReadSelection,
  explorationSlug
}: TextSommaireSheetProps) {
  const isMobile = useIsMobile();
  
  const handleTextSelect = (index: number) => {
    onTextSelect(index);
    onOpenChange(false);
  };

  const handleReadSelection = () => {
    onReadSelection();
    onOpenChange(false);
  };

  // Responsive: bottom on mobile, right on desktop/tablet
  const sheetSide = isMobile ? 'bottom' : 'right';
  const sheetClassName = isMobile 
    ? 'h-[85vh] rounded-t-2xl' 
    : 'w-[400px] sm:w-[450px] sm:max-w-lg';
  const scrollHeight = isMobile 
    ? 'h-[calc(85vh-8rem)]' 
    : 'h-[calc(100vh-8rem)]';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={sheetSide} className={sheetClassName}>
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center font-serif text-slate-800 dark:text-white">
            Sommaire Poétique
          </SheetTitle>
          
          {/* View mode toggle */}
          <div className="flex justify-center pt-2">
            <TextNavigationViewToggle
              mode={viewMode}
              onModeChange={onViewModeChange}
            />
          </div>
        </SheetHeader>
        
        <ScrollArea className={`${scrollHeight} pr-4`}>
          {viewMode === 'fil' && (
            <TextFilView
              texts={texts}
              currentTextIndex={currentTextIndex}
              onTextSelect={handleTextSelect}
            />
          )}
          
          {viewMode === 'parcours' && (
            <TextParcoursView
              texts={texts}
              currentTextIndex={currentTextIndex}
              onTextSelect={handleTextSelect}
            />
          )}
          
          {viewMode === 'anthologie' && (
            <TextAnthologieView
              texts={texts}
              selectedTypes={selectedTypes}
              onTypesChange={onTypesChange}
              onReadSelection={handleReadSelection}
              onTextSelect={handleTextSelect}
              currentTextIndex={currentTextIndex}
              explorationSlug={explorationSlug}
            />
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
