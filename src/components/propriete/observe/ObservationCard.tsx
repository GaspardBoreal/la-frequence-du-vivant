import React from 'react';
import { motion } from 'framer-motion';
import { ChoicePicto } from './ChoicePicto';
import type { ObserveBlock } from './observeConfig';

export const ObservationCard: React.FC<{
  block: ObserveBlock;
  selected: string[];
  onToggle: (value: string) => void;
  index?: number;
}> = ({ block, selected, onToggle, index = 0 }) => {
  const isSelected = (v: string) => selected.includes(v);
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="relative overflow-hidden rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]"
    >
      {/* Header */}
      <header className="flex items-start gap-4 p-5 md:p-6 pb-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif text-xl shadow-md ring-2 ring-[hsl(var(--ds-gold))]/30">
          {block.number}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            {block.category}
          </div>
          <h3 className="mt-1 font-serif italic text-xl md:text-2xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {block.title}
          </h3>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-2 flex items-center gap-1 origin-left"
          >
            <div className="h-[2px] w-14 bg-[hsl(var(--ds-forest))] rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ds-forest))]" />
          </motion.div>
        </div>
      </header>

      {/* Illustration */}
      <div className="mx-5 md:mx-6 mb-4 aspect-[16/7] rounded-2xl overflow-hidden bg-[hsl(var(--ds-cream))]/70 border border-[hsl(var(--ds-line))]/70">
        <img
          src={block.hero}
          alt=""
          loading="lazy"
          width={768}
          height={336}
          className="w-full h-full object-cover transition-transform duration-[6000ms] hover:scale-105"
        />
      </div>

      {/* Choices */}
      <div
        role="group"
        aria-label={block.title}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-5 md:p-6 pt-2"
      >
        {block.choices.map((c) => (
          <ChoicePicto
            key={c.value}
            label={c.label}
            icon={c.icon}
            selected={isSelected(c.value)}
            onToggle={() => onToggle(c.value)}
          />
        ))}
      </div>
    </motion.article>
  );
};
