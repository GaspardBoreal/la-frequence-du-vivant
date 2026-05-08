import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { EventTestimony } from '@/hooks/useEventTestimonies';

interface Props { items: EventTestimony[]; }

const ImmersiveCarousel: React.FC<Props> = ({ items }) => {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => (i + 1) % items.length);
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(next, 8000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[idx];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-emerald-500/10 via-card to-sky-500/5 min-h-[360px] flex items-center justify-center p-8 sm:p-12">
      <Quote className="absolute top-6 left-6 w-16 h-16 text-emerald-500/15" strokeWidth={1} />
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl text-center"
        >
          <p className="font-serif italic text-xl sm:text-2xl leading-relaxed text-foreground mb-6">
            {current.quote}
          </p>
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {current.author_name}
          </div>
          {current.marche_event?.title && (
            <div className="text-xs text-muted-foreground mt-1">{current.marche_event.title}</div>
          )}
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Précédent"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/70 hover:bg-background border border-border"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            aria-label="Suivant"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/70 hover:bg-background border border-border"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-6 bg-emerald-500' : 'w-1.5 bg-foreground/20'
                }`}
                aria-label={`Témoignage ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImmersiveCarousel;
