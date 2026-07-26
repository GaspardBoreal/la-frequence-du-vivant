import React from 'react';
import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';
import { TestSchema } from './StructureTestPictos';
import { TestVideoShelf } from './TestVideoShelf';
import type { StructureTest } from './structureTests';

export const StructureProtocolCard: React.FC<{ test: StructureTest; index?: number }> = ({
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
          <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] leading-tight">
            {test.title}
          </div>
          <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))] mt-0.5">
            {test.subtitle}
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl overflow-hidden border border-[hsl(var(--ds-line))]/70 aspect-[20/11]">
        <TestSchema id={test.id} />
      </div>

      <div className="p-4 pt-3">
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70 mb-2">
          <ListChecks className="w-3 h-3" /> Protocole
        </div>
        <ol className="space-y-1.5">
          {test.steps.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85"
            >
              <span className="mt-0.5 shrink-0 flex items-center justify-center w-4.5 h-[18px] min-w-[18px] rounded-full bg-[hsl(var(--ds-forest))]/10 text-[hsl(var(--ds-forest))] text-[9px] font-bold">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        {videos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {videos.map((v, i) => (
              <a
                key={i}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-forest))]/8 px-3 py-1 text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/15 transition"
              >
                <Play className="w-3 h-3" /> {v.label || `Vidéo ${i + 1}`}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
