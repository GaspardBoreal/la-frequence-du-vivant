import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Quote } from 'lucide-react';
import { buildWordCloud } from '../utils/tokenize';
import type { EventTestimony } from '@/hooks/useEventTestimonies';

interface Props { items: EventTestimony[]; }

const PALETTE = [
  'text-emerald-600 dark:text-emerald-400',
  'text-sky-600 dark:text-sky-400',
  'text-amber-600 dark:text-amber-400',
  'text-violet-600 dark:text-violet-400',
  'text-rose-600 dark:text-rose-400',
  'text-teal-600 dark:text-teal-400',
];

const WordCloud: React.FC<Props> = ({ items }) => {
  const [active, setActive] = useState<{ word: string; ids: string[] } | null>(null);

  const words = useMemo(
    () => buildWordCloud(items.map((i) => ({ id: i.id, quote: i.quote }))).slice(0, 60),
    [items]
  );
  const max = words[0]?.count || 1;

  const matchingTestimonies = useMemo(() => {
    if (!active) return [];
    return items.filter((t) => active.ids.includes(t.id));
  }, [active, items]);

  const highlight = (text: string, word: string) => {
    const re = new RegExp(`(${word})`, 'gi');
    return text.split(re).map((p, i) =>
      p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
      word.toLowerCase() ? (
        <mark key={i} className="bg-emerald-500/25 text-foreground rounded px-0.5">{p}</mark>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 min-h-[280px] flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {words.map((w, i) => {
          const size = 0.85 + (w.count / max) * 1.6;
          const color = PALETTE[i % PALETTE.length];
          return (
            <motion.button
              key={w.word}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015 }}
              whileHover={{ scale: 1.15 }}
              onClick={() => setActive({ word: w.word, ids: w.testimonyIds })}
              className={`font-semibold leading-none transition-all ${color} hover:underline`}
              style={{ fontSize: `${size}rem` }}
            >
              {w.word}
            </motion.button>
          );
        })}
        {words.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun mot suffisamment marquant pour l'instant.</p>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setActive(null)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card border border-border rounded-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto p-5"
          >
            <button
              onClick={() => setActive(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm text-muted-foreground mb-1">Mot-clé</h3>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
              « {active.word} »
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {matchingTestimonies.length} marcheur{matchingTestimonies.length > 1 ? 's' : ''} l'évoque{matchingTestimonies.length > 1 ? 'nt' : ''}
            </p>
            <div className="space-y-3">
              {matchingTestimonies.map((t) => (
                <div key={t.id} className="rounded-xl border border-border p-4 bg-background/40">
                  <Quote className="w-4 h-4 text-emerald-500/40 mb-1" />
                  <p className="text-sm font-serif italic text-foreground/90 leading-relaxed">
                    {highlight(t.quote, active.word)}
                  </p>
                  <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {t.author_name}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default WordCloud;
