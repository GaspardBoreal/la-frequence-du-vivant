import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Quote } from 'lucide-react';
import { buildWordCloud } from '../utils/tokenize';
import type { EventTestimony } from '@/hooks/useEventTestimonies';

interface Props { items: EventTestimony[]; }

// Pseudo-random rotation déterministe par mot (pour stabilité au re-render)
const seededRotation = (word: string) => {
  let h = 0;
  for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) | 0;
  return ((h % 100) / 100) * 8 - 4; // -4° à +4°
};

const WordCloud: React.FC<Props> = ({ items }) => {
  const [active, setActive] = useState<{ word: string; key: string; ids: string[] } | null>(null);

  const words = useMemo(
    () => buildWordCloud(items.map((i) => ({ id: i.id, quote: i.quote }))).slice(0, 60),
    [items]
  );
  const max = words[0]?.count || 1;

  const matchingTestimonies = useMemo(() => {
    if (!active) return [];
    return items.filter((t) => active.ids.includes(t.id));
  }, [active, items]);

  // Surligne le mot dans le témoignage en restant insensible aux accents.
  const highlight = (text: string, key: string) => {
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const parts = text.split(/(\p{L}+)/u);
    return parts.map((p, i) =>
      /\p{L}/u.test(p) && normalize(p) === key ? (
        <mark key={i} className="bg-amber-500/20 text-foreground rounded px-0.5">{p}</mark>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  return (
    <>
      {/* Header éditorial discret */}
      <div className="text-center mb-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground/70">
          Les mots qui reviennent
        </p>
      </div>

      {/* Container poétique */}
      <div
        className="relative rounded-3xl border border-border/60 overflow-hidden
                   bg-gradient-to-br from-emerald-500/[0.04] via-card to-amber-500/[0.04]
                   shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.15)]
                   p-8 sm:p-14 min-h-[320px]"
      >
        {/* Halo décoratif */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.08), transparent 50%), radial-gradient(circle at 75% 80%, hsl(45 90% 60% / 0.06), transparent 50%)',
          }}
        />

        <div
          className="relative flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-6"
          style={{
            maskImage: 'radial-gradient(ellipse 95% 95% at center, black 70%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 95% at center, black 70%, transparent 100%)',
          }}
        >
          {words.map((w, i) => {
            const ratio = w.count / max;
            const isTop = i < 3;
            const isStrong = i >= 3 && i < 10;
            // Taille fluide : 0.85rem → 3.4rem
            const size = 0.85 + ratio * 2.55;
            const rotation = isTop ? 0 : seededRotation(w.word);

            const cls = isTop
              ? 'font-serif italic text-amber-600 dark:text-amber-300/95 tracking-tight'
              : isStrong
              ? 'font-semibold text-foreground'
              : 'font-light text-muted-foreground/80';

            return (
              <motion.button
                key={w.word}
                initial={{ opacity: 0, scale: 0.7, filter: 'blur(6px)' }}
                animate={{ opacity: isTop ? 1 : isStrong ? 0.95 : 0.7, scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: i * 0.025, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{
                  scale: 1.12,
                  opacity: 1,
                  filter: 'drop-shadow(0 0 14px hsl(var(--primary) / 0.45))',
                }}
                onClick={() => setActive({ word: w.word, key: w.key, ids: w.testimonyIds })}
                className={`leading-none cursor-pointer transition-colors hover:text-foreground ${cls}`}
                style={{
                  fontSize: `${size}rem`,
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {w.word}
              </motion.button>
            );
          })}

          {words.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Aucun mot suffisamment marquant pour l'instant.
            </p>
          )}
        </div>
      </div>

      {/* Modal de détail */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-end sm:items-center justify-center p-3"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card/95 backdrop-blur-xl border border-border/70 rounded-3xl
                         w-full max-w-xl max-h-[80vh] overflow-y-auto p-6
                         shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.4)]"
            >
              <button
                onClick={() => setActive(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                Mot-clé
              </p>
              <p className="text-3xl sm:text-4xl font-serif italic text-amber-600 dark:text-amber-300 mb-3">
                « {active.word} »
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                {matchingTestimonies.length} marcheur{matchingTestimonies.length > 1 ? 's' : ''} l'évoque{matchingTestimonies.length > 1 ? 'nt' : ''}
              </p>
              <div className="space-y-3">
                {matchingTestimonies.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-border/60 p-4 bg-background/40"
                  >
                    <Quote className="w-4 h-4 text-amber-500/50 mb-1.5" />
                    <p className="text-sm font-serif italic text-foreground/90 leading-relaxed">
                      {highlight(t.quote, active.word)}
                    </p>
                    <div className="mt-2.5 text-xs font-semibold text-foreground/70">
                      — {t.author_name}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WordCloud;
