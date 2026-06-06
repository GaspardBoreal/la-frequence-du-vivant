import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import type { EventTestimony } from '@/hooks/useEventTestimonies';

interface Props {
  items: EventTestimony[];
}

const QuoteWall: React.FC<Props> = ({ items }) => {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
      {items.map((t, i) => (
        <motion.div
          key={t.id}
          data-focus-id={`testimony:${t.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="mb-4 break-inside-avoid relative rounded-2xl border border-border bg-card p-5 overflow-hidden"
        >
          <Quote
            className="absolute -top-2 -left-2 w-20 h-20 text-emerald-500/10 pointer-events-none"
            strokeWidth={1}
          />
          <p className="relative text-foreground/90 italic leading-relaxed font-serif text-[15px]">
            {t.quote}
          </p>
          <div className="relative mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-semibold">
              {t.author_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{t.author_name}</div>
              {t.marche_event?.title && (
                <div className="text-[10px] text-muted-foreground truncate">{t.marche_event.title}</div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default QuoteWall;
