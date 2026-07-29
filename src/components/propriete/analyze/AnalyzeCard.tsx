import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const AnalyzeCard: React.FC<{
  number: number;
  category: string;
  title: string;
  subtitle?: string;
  index?: number;
  hero?: React.ReactNode;
  children: React.ReactNode;
  /** Rend l'en-tête cliquable pour replier/déplier le corps de la carte. */
  collapsible?: boolean;
  open?: boolean;
  onToggleOpen?: () => void;
  /** Bandeau d'indicateurs affiché lorsque la carte est repliée. */
  signature?: React.ReactNode;
}> = ({
  number,
  category,
  title,
  subtitle,
  index = 0,
  hero,
  children,
  collapsible,
  open,
  onToggleOpen,
  signature,
}) => {
  const expanded = !collapsible || !!open;
  const bodyId = `analyze-card-body-${number}`;
  const HeaderTag = collapsible ? 'button' : 'div';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="relative overflow-hidden rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]"
    >
      <HeaderTag
        {...(collapsible
          ? {
              type: 'button' as const,
              onClick: onToggleOpen,
              'aria-expanded': expanded,
              'aria-controls': bodyId,
            }
          : {})}
        className={`w-full text-left flex items-start gap-4 p-5 md:p-6 pb-3 ${
          collapsible ? 'transition-colors hover:bg-white/35' : ''
        }`}
      >
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
          {!expanded && signature ? (
            <div className="mt-2">{signature}</div>
          ) : (
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
          )}
        </div>
        {collapsible && (
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest))]"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        )}
      </HeaderTag>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={bodyId}
            key="body"
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {hero && (
              <div className="mx-5 md:mx-6 mb-4 rounded-2xl overflow-hidden bg-[hsl(var(--ds-cream))]/70 border border-[hsl(var(--ds-line))]/70">
                {hero}
              </div>
            )}
            <div className="p-5 md:p-6 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

