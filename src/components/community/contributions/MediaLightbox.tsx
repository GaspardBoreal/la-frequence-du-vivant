import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface LightboxItem {
  url: string;
  type: 'photo' | 'video';
  titre?: string | null;
  isPublic: boolean;
  isOwner: boolean;
  createdAt?: string;
}

interface MediaLightboxProps {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({ items, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const item = items[index];
  if (!item) return null;

  const goNext = useCallback(() => setIndex(i => Math.min(i + 1, items.length - 1)), [items.length]);
  const goPrev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    // Only navigate on horizontal swipe (not vertical scroll)
    if (Math.abs(dx) > 50 && dy < 100) {
      if (dx > 0) goNext();
      else goPrev();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-white/70 text-sm font-medium">
            {index + 1} / {items.length}
          </span>
        </div>

        {/* Media */}
        <div className="flex-1 relative flex items-center justify-center min-h-0 px-2">
          {/* Desktop chevrons */}
          {index > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {index < items.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center"
            >
              {item.type === 'photo' ? (
                <img
                  src={item.url}
                  alt={item.titre || ''}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  draggable={false}
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                  playsInline
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="shrink-0 px-4 py-3 space-y-1">
          {item.titre && (
            <p className="text-white text-sm font-medium truncate">{item.titre}</p>
          )}
          <div className="flex items-center gap-2 text-white/50 text-xs">
            {item.isPublic ? (
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
            ) : (
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Privé</span>
            )}
            {item.createdAt && (
              <>
                <span>·</span>
                <span>{format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr })}</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaLightbox;
