import React from 'react';
import { motion } from 'framer-motion';
import { ListChecks, Sparkle } from 'lucide-react';
import { LifeTestSchema } from './LifePictos';
import { TestVideoShelf } from './TestVideoShelf';
import type { LifeTest } from './lifeTests';

export const LifeProtocolCard: React.FC<{ test: LifeTest; index?: number }> = ({
  test,
  index = 0,
}) => {
  const videos = (test.videos ?? []).filter((v) => (v.url ?? '').trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="relative overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] shadow-[0_2px_16px_-10px_rgba(60,80,60,0.25)]"
    >
      <div className="h-1 w-full bg-gradient-to-r from-[hsl(var(--ds-gold))]/0 via-[hsl(var(--ds-gold))] to-[hsl(var(--ds-gold))]/0" />

      <div className="flex items-start gap-3 p-4 pb-2">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif text-base shadow-sm ring-2 ring-[hsl(var(--ds-gold))]/30">
          {test.letter}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] leading-tight">
              {test.title}
            </div>
            {test.optional && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-forest))]/30 bg-[hsl(var(--ds-forest))]/8 px-2 py-[1px] text-[9px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--ds-forest))]">
                <Sparkle className="w-2.5 h-2.5" /> bonus
              </span>
            )}
          </div>
          <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))] mt-0.5">
            {test.subtitle}
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl overflow-hidden border border-[hsl(var(--ds-line))]/70 aspect-[20/11]">
        <LifeTestSchema id={test.id} />
      </div>

      <div className="p-4 pt-3">
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
          <ListChecks className="w-3 h-3" /> Le geste, pas à pas
        </div>
        <ol className="mt-2 space-y-1.5">
          {test.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-[2px] shrink-0 w-4 h-4 rounded-full bg-[hsl(var(--ds-forest))]/12 text-[hsl(var(--ds-forest))] text-[9px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">{s}</span>
            </li>
          ))}
        </ol>

        {videos.length > 0 && (
          <div className="mt-3">
            <TestVideoShelf storageKey={`life-${test.id}`} videos={videos} title="Voir le geste" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
