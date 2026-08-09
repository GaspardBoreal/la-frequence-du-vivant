import React from 'react';
import { motion } from 'framer-motion';
import { DISPLAY_STRATE_HINT, DISPLAY_STRATE_LABEL, type ProjectedStrate } from '@/lib/paletteProjections';

interface Props {
  block: ProjectedStrate;
  index: number;
  children: React.ReactNode;
}

/** Une colonne-strate : titre, respiration, liste d'espèces. */
const StrateColumn: React.FC<Props> = ({ block, index, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-paper))]/50 p-3.5"
  >
    <header className="mb-3 px-1">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]">
        {DISPLAY_STRATE_LABEL[block.strate]}
      </h4>
      <p className="mt-1 text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/55">
        {DISPLAY_STRATE_HINT[block.strate]}
      </p>
    </header>
    <ul className="space-y-2">{children}</ul>
  </motion.section>
);

export default StrateColumn;
