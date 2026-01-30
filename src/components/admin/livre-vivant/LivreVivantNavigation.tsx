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
  BookOpen,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onGoToIndex?: (type: 'lieu' | 'genre') => void;
  colorScheme: EpubColorScheme;
}

// Modes de lecture disponibles
const READING_MODES = [
  { 
    id: 'home', 
    icon: Home, 
    label: 'Couverture',
    shortLabel: 'Accueil',
    action: 'goToFirst' as const
  },
  { 
    id: 'toc', 
    icon: List, 
    label: 'Table des Matières',
    shortLabel: 'Sommaire',
    action: 'openToc' as const
  },
  { 
    id: 'index-lieu', 
    icon: MapPin, 
    label: 'Index des Lieux',
    shortLabel: 'Lieux',
    action: 'goToIndexLieu' as const
  },
  { 
    id: 'index-genre', 
    icon: BookOpen, 
    label: 'Index des Genres',
    shortLabel: 'Genres',
    action: 'goToIndexGenre' as const
  },
  { 
    id: 'traversees', 
    icon: Compass, 
    label: 'Traversées Immersives',
    shortLabel: 'Traversées',
    action: 'openTraversees' as const
  },
];

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
  onGoToIndex,
  colorScheme,
}) => {
  const handleModeClick = (action: typeof READING_MODES[number]['action']) => {
    switch (action) {
      case 'goToFirst':
        onGoToFirst();
        break;
      case 'openToc':
        onOpenToc?.();
        break;
      case 'goToIndexLieu':
        onGoToIndex?.('lieu');
        break;
      case 'goToIndexGenre':
        onGoToIndex?.('genre');
        break;
      case 'openTraversees':
        onOpenTraversees?.();
        break;
    }
  };

  return (
    <div 
      className="border-t flex flex-col"
      style={{ 
        borderColor: colorScheme.secondary + '30',
        backgroundColor: colorScheme.background,
      }}
    >
      {/* Modes de lecture - Section mise en avant */}
      <div 
        className="px-3 py-2 border-b"
        style={{ 
          borderColor: colorScheme.secondary + '15',
          background: `linear-gradient(to right, ${colorScheme.accent}08, transparent, ${colorScheme.accent}08)`
        }}
      >
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {READING_MODES.map((mode) => {
            const Icon = mode.icon;
            const isTraversee = mode.id === 'traversees';
            
            return (
              <motion.button
                key={mode.id}
                onClick={() => handleModeClick(mode.action)}
                className="relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                style={{
                  color: isTraversee ? colorScheme.accent : colorScheme.secondary,
                  backgroundColor: isTraversee ? colorScheme.accent + '15' : 'transparent',
                  border: `1px solid ${isTraversee ? colorScheme.accent + '30' : 'transparent'}`,
                }}
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: isTraversee ? colorScheme.accent + '25' : colorScheme.secondary + '15',
                }}
                whileTap={{ scale: 0.98 }}
                title={mode.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline font-medium">{mode.shortLabel}</span>
                
                {/* Badge "Explorer" pour Traversées */}
                {isTraversee && (
                  <span 
                    className="hidden md:flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ 
                      backgroundColor: colorScheme.accent + '25',
                      color: colorScheme.accent
                    }}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Nouveau
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Barre de progression et navigation pages */}
      <div className="px-4 py-2 flex flex-col gap-2">
        {/* Progress bar */}
        <div className="relative w-full h-1 rounded-full overflow-hidden bg-muted/30">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ backgroundColor: colorScheme.accent }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Navigation pages */}
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onGoToFirst}
            disabled={!canGoPrevious}
            style={{ color: colorScheme.secondary }}
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onGoToPrevious}
            disabled={!canGoPrevious}
            style={{ color: colorScheme.secondary }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span 
            className="text-xs px-3 min-w-[70px] text-center font-medium"
            style={{ color: colorScheme.primary }}
          >
            {currentPageIndex + 1} / {totalPages}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onGoToNext}
            disabled={!canGoNext}
            style={{ color: colorScheme.secondary }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onGoToLast}
            disabled={!canGoNext}
            style={{ color: colorScheme.secondary }}
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LivreVivantNavigation;
