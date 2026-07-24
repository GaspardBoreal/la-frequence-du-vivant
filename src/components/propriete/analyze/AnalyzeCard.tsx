import React from 'react';
import { motion } from 'framer-motion';

export const AnalyzeCard: React.FC<{
  number: number;
  category: string;
  title: string;
  subtitle?: string;
  index?: number;
  hero?: React.ReactNode;
  children: React.ReactNode;
}> = ({ number, category, title, subtitle, index = 0, hero, children }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="relative overflow-hidden rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]"
    >
      <header className="flex items-start gap-4 p-5 md:p-6 pb-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif text-xl shadow-md ring-2 ring-[hsl(var(--ds-gold))]/30">
          {number}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            {category}
          </div>
          <h3 className="mt-1 font-serif italic text-xl md:text-2xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-[hsl(var(--ds-forest-deep))]/70">{subtitle}</p>
          )}
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

      {hero && (
        <div className="mx-5 md:mx-6 mb-4 rounded-2xl overflow-hidden bg-[hsl(var(--ds-cream))]/70 border border-[hsl(var(--ds-line))]/70">
          {hero}
        </div>
      )}

      <div className="p-5 md:p-6 pt-2">{children}</div>
    </motion.article>
  );
};
