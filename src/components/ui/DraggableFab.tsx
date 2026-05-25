import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggableFab, type FabCorner } from '@/hooks/useDraggableFab';
import { cn } from '@/lib/utils';

interface DraggableFabProps {
  id: string;
  children: React.ReactNode;
  size?: number;
  defaultCorner?: FabCorner;
  zIndex?: number;
  className?: string;
  /** When true, renders nothing (e.g. when chat panel is open). */
  hidden?: boolean;
}

/**
 * Wraps a floating action button to make it draggable on touch/mouse.
 * - Long-press 250ms → enter drag mode
 * - Drag → reposition (clamped to viewport, respects safe-area)
 * - Release → snap to nearest left/right edge
 * - Double-tap → reset to default corner
 * - Position persisted in localStorage under fab-pos:<id>
 *
 * The chat panel itself stays anchored — only the closed bubble moves.
 */
const DraggableFab: React.FC<DraggableFabProps> = ({
  id,
  children,
  size = 56,
  defaultCorner = 'bottom-right',
  zIndex = 1200,
  className,
  hidden = false,
}) => {
  const { pos, isDragging, showHint, handlers } = useDraggableFab({
    id,
    size,
    defaultCorner,
  });

  if (hidden || !pos) return null;

  return (
    <>
      {/* Subtle corner safe-zone hints during drag */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: zIndex - 1 }}
          >
            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((c) => (
              <span
                key={c}
                className={cn(
                  'absolute h-16 w-16 rounded-full border-2 border-primary/40 bg-primary/10 backdrop-blur-sm',
                  c.includes('top') ? 'top-4' : 'bottom-4',
                  c.includes('left') ? 'left-4' : 'right-4'
                )}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        {...handlers}
        animate={{
          x: pos.x,
          y: pos.y,
          scale: isDragging ? 1.08 : 1,
        }}
        transition={
          isDragging
            ? { type: 'tween', duration: 0 }
            : { type: 'spring', stiffness: 380, damping: 32 }
        }
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex,
          width: size,
          height: size,
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        className={cn('pointer-events-auto select-none', className)}
        aria-label="Bouton flottant déplaçable — maintenez pour déplacer, double-tap pour réinitialiser"
      >
        {/* Pulsing halo when dragging */}
        <AnimatePresence>
          {isDragging && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-primary/30 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {children}

        {/* First-time hint */}
        <AnimatePresence>
          {showHint && !isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-full mb-2 right-0 whitespace-nowrap rounded-lg bg-background/95 border border-border px-2.5 py-1 text-[10px] font-medium text-foreground shadow-lg pointer-events-none"
            >
              ↕ Maintenez pour déplacer
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default DraggableFab;
