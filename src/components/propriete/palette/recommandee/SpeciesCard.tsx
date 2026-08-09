import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sparkles } from 'lucide-react';
import { SpeciesName } from '@/components/species/SpeciesName';
import { SpeciesThumb } from '@/components/species/SpeciesThumb';
import { cn } from '@/lib/utils';
import type { ProjectedSpecies } from '@/lib/paletteProjections';

interface Props {
  sp: ProjectedSpecies;
  index: number;
  /** Libellé court affiché en pastille sur la photo (récolte, tenue…). */
  metric?: string;
  /** Jauge 0 → 100 sous le nom. */
  gauge?: number;
  /** Ligne de contexte, une phrase courte. */
  note?: string;
  dimmed?: boolean;
  onOpen?: (sp: ProjectedSpecies) => void;
}

/** Carte espèce illustrée : photo de référence, nom, jauge de pertinence. */
const SpeciesCard: React.FC<Props> = ({ sp, index, metric, gauge, note, dimmed, onOpen }) => (
  <motion.li
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
    transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
    className="list-none"
  >
    <button
      type="button"
      onClick={() => onOpen?.(sp)}
      className={cn(
        'group w-full overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 text-left',
        'transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--ds-forest))]/60 hover:shadow-lg',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ds-forest))]/60',
      )}
      aria-label={`Ouvrir la fiche de ${sp.species.fr}`}
    >
      {/* Photo de référence */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[hsl(var(--ds-forest))]/8">
        <SpeciesThumb
          scientificName={sp.species.latin}
          commonName={sp.species.fr}
          kingdom="Plantae"
          size="lg"
          className="!h-full !w-full !rounded-none transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {metric && (
          <span className="absolute left-2 top-2 rounded-full bg-[hsl(var(--ds-forest-deep))]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--ds-cream))] backdrop-blur-sm">
            {metric}
          </span>
        )}
        {sp.species.vegetalLocal && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-cream))]/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--ds-forest-deep))]">
            <Leaf className="h-2.5 w-2.5" /> Local
          </span>
        )}
      </div>

      <div className="px-3 py-2.5">
        <SpeciesName
          scientificName={sp.species.latin}
          commonName={sp.species.fr}
          size="sm"
          className="font-semibold text-[hsl(var(--ds-forest-deep))]"
        />

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
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/70">
            {note}
          </p>
        )}

        {sp.incomplete && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ds-gold))]">
            Donnée manquante
          </p>
        )}

        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-transparent transition-colors group-hover:text-[hsl(var(--ds-forest))]/80">
          <Sparkles className="h-3 w-3" /> Fiche espèce
        </span>
      </div>
    </button>
  </motion.li>
);

export default SpeciesCard;
