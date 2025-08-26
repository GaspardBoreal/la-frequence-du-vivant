import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, X, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
  const [visibleRange, setVisibleRange] = useState({ start: 0, count: 6 });

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

  const maxVisible = window.innerWidth < 1024 ? 6 : 7;
  const canScrollUp = visibleRange.start > 0;
  const canScrollDown = visibleRange.start + maxVisible < marches.length;

  const scrollUp = () => {
    if (canScrollUp) {
      setVisibleRange(prev => ({
        ...prev,
        start: Math.max(0, prev.start - 1)
      }));
    }
  };

  const scrollDown = () => {
    if (canScrollDown) {
      setVisibleRange(prev => ({
        ...prev,
        start: Math.min(marches.length - maxVisible, prev.start + 1)
      }));
    }
  };

  const visibleMarches = marches.slice(visibleRange.start, visibleRange.start + maxVisible);

  // Find current marche based on current photo
  const currentPhoto = photos[currentIndex];
  const currentMarcheId = currentPhoto ? `${currentPhoto.ville}-${currentPhoto.nomMarche}` : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[90vw] max-w-md"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-background/95 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Marches disponibles</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-muted/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-2">
                {/* Scroll Up Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollUp}
                  disabled={!canScrollUp}
                  className="w-full mb-1 h-8 hover:bg-muted/50 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>

                {/* Marches List */}
                <div className="space-y-1">
                  {visibleMarches.map((marche) => {
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
                            ? 'bg-primary/10 border-2 border-primary/30'
                            : 'hover:bg-muted/50 border-2 border-transparent'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}>
                              {marche.displayName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {marche.ville}
                            </p>
                            {dateFormatted && (
                              <p className="text-xs text-muted-foreground">
                                {dateFormatted}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant="secondary" className="text-xs">
                              {marche.photoCount}
                            </Badge>
                            {isSelected && (
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Scroll Down Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollDown}
                  disabled={!canScrollDown}
                  className="w-full mt-1 h-8 hover:bg-muted/50 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground text-center">
                  {marches.length} marche{marches.length > 1 ? 's' : ''} • {photos.length} photo{photos.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MarcheSelector;