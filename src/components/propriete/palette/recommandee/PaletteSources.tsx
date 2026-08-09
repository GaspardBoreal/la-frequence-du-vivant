import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ExternalLink, BookOpen } from 'lucide-react';
import { PALETTE_METHOD_NOTE, PALETTE_SOURCES } from '@/lib/paletteSources';

/** Bloc de transparence : d'où viennent les recommandations. */
const PaletteSources: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--ds-forest))]/12 text-[hsl(var(--ds-forest-deep))]">
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/75">
            Transparence
          </span>
          <span className="block text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
            D’où vient cette palette
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-4 w-4 text-[hsl(var(--ds-forest-deep))]/60" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-4">
              {PALETTE_SOURCES.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 rounded-2xl border border-[hsl(var(--ds-line))]/70 px-3 py-2 transition hover:border-[hsl(var(--ds-forest))]/50 hover:bg-[hsl(var(--ds-forest))]/6"
                >
                  <span className="flex-1">
                    <span className="block text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                      {s.name}
                    </span>
                    <span className="block text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/65">
                      {s.role}
                    </span>
                  </span>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--ds-forest-deep))]/45" />
                </a>
              ))}
              <p className="pt-1 text-[11px] italic leading-snug text-[hsl(var(--ds-forest-deep))]/65">
                {PALETTE_METHOD_NOTE}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaletteSources;
