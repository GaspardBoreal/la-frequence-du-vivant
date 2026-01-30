import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronFirst, 
  ChevronLast, 
  ChevronLeft, 
  ChevronRight,
  Home,
  List,
  Compass,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EpubColorScheme } from '@/utils/epubExportUtils';

interface LivreVivantNavigationProps {
  currentPageIndex: number;
  totalPages: number;
  progress: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onGoToFirst: () => void;
  onGoToLast: () => void;
  onGoToPrevious: () => void;
  onGoToNext: () => void;
  onGoToPage: (index: number) => void;
  onOpenToc?: () => void;
  onOpenTraversees?: () => void;
  colorScheme: EpubColorScheme;
}

const LivreVivantNavigation: React.FC<LivreVivantNavigationProps> = ({
  currentPageIndex,
  totalPages,
  progress,
  canGoNext,
  canGoPrevious,
  onGoToFirst,
  onGoToLast,
  onGoToPrevious,
  onGoToNext,
  onOpenToc,
  onOpenTraversees,
  colorScheme,
}) => {
  return (
    <div 
      className="border-t px-4 py-3 flex flex-col gap-3"
      style={{ 
        borderColor: colorScheme.secondary + '30',
        backgroundColor: colorScheme.background,
      }}
    >
      {/* Progress bar */}
      <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-muted/50">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: colorScheme.accent }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onGoToFirst}
            disabled={!canGoPrevious}
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onGoToPrevious}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span 
            className="text-xs px-2 min-w-[60px] text-center"
            style={{ color: colorScheme.secondary }}
          >
            {currentPageIndex + 1} / {totalPages}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onGoToNext}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onGoToLast}
            disabled={!canGoNext}
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={onGoToFirst}
          >
            <Home className="h-3 w-3" />
            <span className="hidden sm:inline">Accueil</span>
          </Button>
          
          {onOpenToc && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={onOpenToc}
            >
              <List className="h-3 w-3" />
              <span className="hidden sm:inline">TdM</span>
            </Button>
          )}
          
          {onOpenTraversees && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={onOpenTraversees}
            >
              <Compass className="h-3 w-3" />
              <span className="hidden sm:inline">Traversées</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivreVivantNavigation;
