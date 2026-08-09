import React from 'react';
import { motion } from 'framer-motion';
import { SpeciesName } from '@/components/species/SpeciesName';
import { cn } from '@/lib/utils';
import type { ProjectedSpecies } from '@/lib/paletteProjections';

interface Props {
  sp: ProjectedSpecies;
  index: number;
  /** Libellé court affiché à droite du nom (récolte, tenue…). */
  metric?: string;
  /** Jauge 0 → 100 sous le nom. */
  gauge?: number;
  /** Ligne de contexte, une phrase courte. */
  note?: string;
  dimmed?: boolean;
}

/** Une espèce dans une colonne-strate : nom vernaculaire, jauge, raison. */
const SpeciesLine: React.FC<Props> = ({ sp, index, metric, gauge, note, dimmed }) => (
  <motion.li
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: dimmed ? 0.4 : 1, y: 0 }}
    transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.3), ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      'group rounded-2xl border border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/60 px-3 py-2.5',
      'transition-colors hover:border-[hsl(var(--ds-forest))]/50',
    )}
  >
    <div className="flex items-baseline gap-2">
      <SpeciesName
        scientificName={sp.species.latin}
        commonName={sp.species.fr}
        size="sm"
        className="font-semibold text-[hsl(var(--ds-forest-deep))]"
      />
      {metric && (
        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--ds-forest))]/75">
          {metric}
        </span>
      )}
    </div>
    <p className="mt-0.5 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/55">
      {sp.species.latin}
    </p>

    {typeof gauge === 'number' && (
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[hsl(var(--ds-forest))]/12">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, Math.min(100, gauge))}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-[hsl(var(--ds-forest))]"
        />
      </div>
    )}

    {note && (
      <p className="mt-1.5 text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/70">{note}</p>
    )}

    {sp.incomplete && (
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ds-gold))]">
        Donnée manquante
      </p>
    )}
  </motion.li>
);

export default SpeciesLine;
