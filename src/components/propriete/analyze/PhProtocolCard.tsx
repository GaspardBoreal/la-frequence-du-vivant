import React from 'react';
import { motion } from 'framer-motion';
import { ListChecks, AlertTriangle, Package } from 'lucide-react';
import { PhTestSchema } from './PhPictos';
import { TestVideoShelf } from './TestVideoShelf';
import type { PhTest } from './phTests';

export const PhProtocolCard: React.FC<{ test: PhTest; index?: number }> = ({ test, index = 0 }) => (
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
            <span className="rounded-full border border-[hsl(var(--ds-forest))]/30 bg-[hsl(var(--ds-forest))]/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--ds-forest))]">
              Optionnel
            </span>
          )}
        </div>
        <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))] mt-0.5">
          {test.subtitle}
        </div>
      </div>
    </div>

    <div className="mx-4 rounded-xl overflow-hidden border border-[hsl(var(--ds-line))]/70 aspect-[20/11]">
      <PhTestSchema id={test.id} />
    </div>

    <div className="p-4 pt-3">
      <div className="flex items-start gap-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/75 mb-2.5">
        <Package className="w-3.5 h-3.5 shrink-0 mt-[1px] text-[hsl(var(--ds-forest))]/70" />
        <span>{test.material}</span>
      </div>

      <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70 mb-2">
        <ListChecks className="w-3 h-3" /> Protocole
      </div>
      <ol className="space-y-1.5">
        {test.steps.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85"
          >
            <span className="mt-0.5 shrink-0 flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-[hsl(var(--ds-forest))]/10 text-[hsl(var(--ds-forest))] text-[9px] font-bold">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[hsl(var(--ds-gold))]/45 bg-[hsl(var(--ds-gold))]/[0.09] p-2.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-[1px] text-[hsl(var(--ds-gold))]" />
        <span className="text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
          <span className="font-semibold">Piège à éviter · </span>
          {test.pitfall}
        </span>
      </div>

      <TestVideoShelf
        storageKey={`ph-${test.id}`}
        videos={test.videos}
        title="Voir le geste"
      />
    </div>
  </motion.div>
);
