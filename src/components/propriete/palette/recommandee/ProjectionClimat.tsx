import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer } from 'lucide-react';
import StrateColumn from './StrateColumn';
import SpeciesCard from './SpeciesCard';
import { climateTraits, flatten, type ProjectedSpecies, type ProjectedStrate } from '@/lib/paletteProjections';

interface Props {
  strates: ProjectedStrate[];
  horizon: number;
  onHorizonChange: (v: number) => void;
  onOpen?: (sp: ProjectedSpecies) => void;
}

const yearOf = (h: number) => Math.round(2026 + h * 24);

/** Projection 3 — le climat de demain : la zone de confort glisse. */
const ProjectionClimat: React.FC<Props> = ({ strates, horizon, onHorizonChange, onOpen }) => {
  const species = React.useMemo(() => flatten(strates), [strates]);
  const fragile = species.filter((s) => climateTraits(s.species, horizon).hold < 55).length;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--ds-forest))]/12 text-[hsl(var(--ds-forest-deep))]">
            <Thermometer className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/75">
              Horizon
            </p>
            <p className="text-lg font-semibold text-[hsl(var(--ds-forest-deep))]">{yearOf(horizon)}</p>
          </div>
          <p className="ml-auto text-[12px] text-[hsl(var(--ds-forest-deep))]/70">
            {fragile > 0
              ? `${fragile} espèce${fragile > 1 ? 's' : ''} en tension à cet horizon`
              : 'Toute la palette tient à cet horizon'}
          </p>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(horizon * 100)}
          onChange={(e) => onHorizonChange(Number(e.target.value) / 100)}
          aria-label="Horizon climatique"
          className="mt-4 w-full accent-[hsl(var(--ds-forest))]"
        />

        {/* Axe fraîcheur → aridité, bande de confort qui glisse */}
        <div className="relative mt-4 h-11 overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]">
          <motion.div
            animate={{ left: `${20 + horizon * 45}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="absolute top-0 h-full w-[35%] rounded-xl bg-[hsl(var(--ds-forest))]/15 ring-1 ring-inset ring-[hsl(var(--ds-forest))]/35"
          />
          {species.map((sp) => {
            const c = climateTraits(sp.species, horizon);
            const x = ((c.aridity + 3) / 6) * 100;
            return (
              <motion.span
                key={sp.species.id}
                animate={{ opacity: c.hold < 55 ? 0.28 : 0.9 }}
                title={sp.species.fr}
                style={{ left: `${x}%` }}
                className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--ds-forest-deep))]"
              />
            );
          })}
          <span className="absolute bottom-0.5 left-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/45">
            Fraîcheur
          </span>
          <span className="absolute bottom-0.5 right-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/45">
            Aridité
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {strates.map((block, i) => (
          <StrateColumn key={block.strate} block={block} index={i}>
            {block.species.map((sp, j) => {
              const c = climateTraits(sp.species, horizon);
              return (
                <SpeciesCard
                  key={sp.species.id}
                  sp={sp}
                  index={j}
                  onOpen={onOpen}
                  dimmed={c.hold < 55}
                  metric={`${c.hold}%`}
                  gauge={c.hold}
                  note={c.note}
                />
              );
            })}
          </StrateColumn>
        ))}
      </div>
    </div>
  );
};

export default ProjectionClimat;
