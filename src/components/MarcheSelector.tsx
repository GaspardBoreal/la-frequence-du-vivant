import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, X, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useIsMobile } from '../hooks/use-mobile';

interface MarcheInfo {
  id: string;
  nomMarche: string;
  ville: string;
  date?: string;
  photoCount: number;
  displayName: string;
}

interface MarcheSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  photos: any[];
  onMarcheSelect: (marcheId: string) => void;
  selectedMarcheId?: string;
  currentIndex: number;
}

const MarcheSelector: React.FC<MarcheSelectorProps> = ({
  isOpen,
  onClose,
  photos,
  onMarcheSelect,
  selectedMarcheId,
  currentIndex
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, count: 5 });
  const isMobile = useIsMobile();

  // Extract unique marches and sort by date
  const marches = useMemo(() => {
    const marcheMap = new Map<string, MarcheInfo>();
    
    photos.forEach((photo, index) => {
      const marcheId = `${photo.ville}-${photo.nomMarche}`;
      const existing = marcheMap.get(marcheId);
      
      if (existing) {
        existing.photoCount++;
      } else {
        const displayName = photo.nomMarche.length > 20 
          ? photo.nomMarche.substring(0, 20) + '...'
          : photo.nomMarche;
          
        marcheMap.set(marcheId, {
          id: marcheId,
          nomMarche: photo.nomMarche,
          ville: photo.ville,
          date: photo.date,
          photoCount: 1,
          displayName
        });
      }
    });
    
    return Array.from(marcheMap.values()).sort((a, b) => {
      if (!a.date && !b.date) return a.ville.localeCompare(b.ville);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [photos]);

  // Always show exactly 5 marches for better ergonomics
  const maxVisible = 5;
  const canScrollUp = visibleRange.start > 0;
  const canScrollDown = visibleRange.start + maxVisible < marches.length;

  // Find current marche based on current photo
  const currentPhoto = photos[currentIndex];
  const currentMarcheId = currentPhoto ? `${currentPhoto.ville}-${currentPhoto.nomMarche}` : null;

  // Auto-scroll to selected marche when opening
  useEffect(() => {
    if (isOpen && currentMarcheId) {
      const selectedIndex = marches.findIndex(marche => marche.id === currentMarcheId);
      if (selectedIndex >= 0) {
        const newStart = Math.max(0, Math.min(selectedIndex - 2, marches.length - maxVisible));
        setVisibleRange(prev => ({ ...prev, start: newStart }));
      }
    }
  }, [isOpen, currentMarcheId, marches, maxVisible]);

  const scrollUp = useCallback(() => {
    if (canScrollUp) {
      setVisibleRange(prev => ({
        ...prev,
        start: Math.max(0, prev.start - 1)
      }));
    }
  }, [canScrollUp]);

  const scrollDown = useCallback(() => {
    if (canScrollDown) {
      setVisibleRange(prev => ({
        ...prev,
        start: Math.min(marches.length - maxVisible, prev.start + 1)
      }));
    }
  }, [canScrollDown, marches.length, maxVisible]);

  // Mouse wheel support
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      scrollDown();
    } else {
      scrollUp();
    }
  }, [scrollDown, scrollUp]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          scrollUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          scrollDown();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scrollUp, scrollDown, onClose]);

  const visibleMarches = marches.slice(visibleRange.start, visibleRange.start + maxVisible);

  // Position indicators
  const currentPosition = visibleRange.start + 1;
  const totalPages = Math.ceil(marches.length / maxVisible);
  const currentPage = Math.floor(visibleRange.start / maxVisible) + 1;

  // Mobile: Modal centrée | Desktop: Popover contextuel
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            
            {/* Mobile Modal */}
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[90vw] max-w-md"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="bg-background/95 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl">
                <MarcheSelectorContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Popover contextuel
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Desktop: Click outside to close */}
          <div 
            className="fixed inset-0 z-[69]" 
            onClick={onClose}
          />
          
          {/* Desktop Popover - Positionné contextuellement */}
          <motion.div
            className="fixed z-[71] top-20 left-1/2 -translate-x-1/2"
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="bg-black/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-96">
              <MarcheSelectorContent />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  function MarcheSelectorContent() {
    return (
      <div onWheel={handleWheel} className="select-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-white" />
            <h3 className="font-semibold text-white">Marches disponibles</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-white/10 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="relative">
          {/* Fade gradients for scroll indication */}
          {canScrollUp && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
          )}
          {canScrollDown && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
          )}

          <div className="p-2">
            {/* Scroll Up Button - Enhanced */}
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollUp}
              disabled={!canScrollUp}
              className={`w-full mb-2 h-10 transition-all duration-200 ${
                canScrollUp 
                  ? 'hover:bg-white/20 text-white hover:scale-105' 
                  : 'opacity-20 cursor-not-allowed text-white/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronUp className="h-4 w-4" />
                {canScrollUp && (
                  <span className="text-xs">
                    {visibleRange.start} précédente{visibleRange.start > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </Button>

            {/* Marches List - Fixed height container */}
            <div className="space-y-1 min-h-[280px]">
              {visibleMarches.map((marche, index) => {
                const isSelected = marche.id === currentMarcheId;
                const dateFormatted = marche.date 
                  ? new Date(marche.date).toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: '2-digit',
                      year: '2-digit'
                    })
                  : '';

                return (
                  <motion.button
                    key={marche.id}
                    onClick={() => {
                      onMarcheSelect(marche.id);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-white/20 border-2 border-white/40 shadow-lg'
                        : 'hover:bg-white/10 border-2 border-transparent hover:border-white/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          isSelected ? 'text-white' : 'text-white/90'
                        }`}>
                          {marche.displayName}
                        </p>
                        <p className="text-sm text-white/60 truncate">
                          {marche.ville}
                        </p>
                        {dateFormatted && (
                          <p className="text-xs text-white/50">
                            {dateFormatted}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                          {marche.photoCount}
                        </Badge>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Scroll Down Button - Enhanced */}
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollDown}
              disabled={!canScrollDown}
              className={`w-full mt-2 h-10 transition-all duration-200 ${
                canScrollDown 
                  ? 'hover:bg-white/20 text-white hover:scale-105' 
                  : 'opacity-20 cursor-not-allowed text-white/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                {canScrollDown && (
                  <span className="text-xs">
                    {marches.length - (visibleRange.start + maxVisible)} suivante{marches.length - (visibleRange.start + maxVisible) > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </Button>
          </div>
        </div>

        {/* Footer - Enhanced with position indicators */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              {marches.length} marche{marches.length > 1 ? 's' : ''} • {photos.length} photo{photos.length > 1 ? 's' : ''}
            </span>
            <span className="bg-white/10 px-2 py-1 rounded-full">
              {Math.min(visibleRange.start + 1, marches.length)}-{Math.min(visibleRange.start + maxVisible, marches.length)} sur {marches.length}
            </span>
          </div>
        </div>
      </div>
    );
  }
};

export default MarcheSelector;