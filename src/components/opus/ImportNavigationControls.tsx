import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImportNavigationControlsProps {
  currentIndex: number;
  totalImports: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const ImportNavigationControls: React.FC<ImportNavigationControlsProps> = ({
  currentIndex,
  totalImports,
  onPrevious,
  onNext
}) => {
  if (totalImports <= 1) return null;

  return (
    <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm border border-border/30 rounded-lg px-3 py-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="h-8 w-8 p-0 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="sr-only">Import précédent</span>
      </Button>
      
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="text-primary font-semibold">{currentIndex + 1}</span>
        <span>/</span>
        <span>{totalImports}</span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={currentIndex === totalImports - 1}
        className="h-8 w-8 p-0 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
        <span className="sr-only">Import suivant</span>
      </Button>
    </div>
  );
};