import React from 'react';
import { motion } from 'framer-motion';
import { DISPLAY_STRATE_HINT, DISPLAY_STRATE_LABEL, type ProjectedStrate, type DisplayStrate } from '@/lib/paletteProjections';

interface Props {
  block: ProjectedStrate;
  index: number;
  children: React.ReactNode;
}

/** Teinte par profondeur : du tapis du sol à la canopée. */
const TINT: Record<DisplayStrate, string> = {
  herbacee: 'bg-[hsl(var(--ds-gold))]/8',
  arbuste: 'bg-[hsl(var(--ds-forest))]/6',
  liane: 'bg-[hsl(var(--ds-forest))]/10',
  arbre: 'bg-[hsl(var(--ds-forest))]/14',
};

/** Une colonne-strate : titre coloré, respiration, grille de cartes. */
const StrateColumn: React.FC<Props> = ({ block, index, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    className={`rounded-3xl border border-[hsl(var(--ds-line))] p-3.5 ${TINT[block.strate]}`}
  >
    <header className="mb-3 px-1">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]">
        {DISPLAY_STRATE_LABEL[block.strate]}
      </h4>
      <p className="mt-1 text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/55">
        {DISPLAY_STRATE_HINT[block.strate]}
      </p>
    </header>
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">{children}</ul>
  </motion.section>
);

export default StrateColumn;
