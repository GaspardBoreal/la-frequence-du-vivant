import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface Props {
  /** Composite key `kind:id` (e.g. `species:Clematis`). Null disables. */
  target: string | null;
  /** Delay (ms) before searching for the target — give time for tabs to render. */
  delay?: number;
  /** Called once the halo finishes (or target not found). */
  onSettled?: () => void;
}

/**
 * Scrolls to `[data-focus-id="<target>"]` and pulses an emerald halo around it.
 * Also dispatches `lfdv:focus` CustomEvent so deep components (modals/drawers) can react.
 */
export const FocusHalo: React.FC<Props> = ({ target, delay = 250, onSettled }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;

    // Note: parent (ExplorationMarcheurPage) already dispatches `lfdv:focus`
    // with full descriptor (kind/id/sub/marcheId). We just handle scroll+halo.

    const tick = (attempt: number) => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(target)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Wait for smooth-scroll to land before painting halo.
        setTimeout(() => {
          if (cancelled) return;
          setRect(el.getBoundingClientRect());
          setTimeout(() => {
            if (cancelled) return;
            setRect(null);
            onSettled?.();
          }, 1800);
        }, 350);
      } else if (attempt < 12) {
        setTimeout(() => tick(attempt + 1), 250);
      } else {
        onSettled?.();
      }
    };
    const start = setTimeout(() => tick(0), delay);
    return () => { cancelled = true; clearTimeout(start); };
  }, [target, delay, onSettled]);

  if (!rect) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="fixed pointer-events-none z-[150]"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      >
        <motion.div
          animate={{ boxShadow: [
            '0 0 0 0 rgba(45,212,168,0.0), 0 0 0 0 rgba(45,212,168,0.0)',
            '0 0 0 4px rgba(45,212,168,0.45), 0 0 60px 10px rgba(45,212,168,0.35)',
            '0 0 0 2px rgba(45,212,168,0.25), 0 0 30px 4px rgba(45,212,168,0.15)',
          ]}}
          transition={{ duration: 1.6, times: [0, 0.4, 1] }}
          className="w-full h-full rounded-2xl ring-2 ring-emerald-400/70"
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default FocusHalo;
