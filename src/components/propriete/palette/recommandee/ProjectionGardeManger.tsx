import React from 'react';
import { motion } from 'framer-motion';
import StrateColumn from './StrateColumn';
import SpeciesLine from './SpeciesLine';
import { MONTH_FULL, foodTraits, flatten, monthShort, type ProjectedStrate } from '@/lib/paletteProjections';

interface Props {
  strates: ProjectedStrate[];
}

const SIZE = 260;
const R_OUT = 116;
const R_IN = 66;

/** Projection 2 — le garde-manger : douze mois, les creux se voient. */
const ProjectionGardeManger: React.FC<Props> = ({ strates }) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const species = React.useMemo(() => flatten(strates), [strates]);

  const perMonth = React.useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    species.forEach((sp) => foodTraits(sp.species).months.forEach((m) => (counts[m - 1] += 1)));
    return counts;
  }, [species]);

  const max = Math.max(1, ...perMonth);
  const gaps = perMonth.map((c, i) => ({ c, i })).filter((x) => x.c === 0);

  const sector = (i: number) => {
    const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
    const r = R_IN + (R_OUT - R_IN) * (perMonth[i] / max);
    const c = SIZE / 2;
    const p = (radius: number, a: number) => `${c + radius * Math.cos(a)},${c + radius * Math.sin(a)}`;
    return `M ${p(R_IN, a0)} L ${p(r, a0)} A ${r} ${r} 0 0 1 ${p(r, a1)} L ${p(R_IN, a1)} A ${R_IN} ${R_IN} 0 0 0 ${p(R_IN, a0)} Z`;
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="mx-auto">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Calendrier de récolte sur douze mois">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R_OUT} fill="none" stroke="hsl(var(--ds-line))" strokeWidth={1} />
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R_IN} fill="none" stroke="hsl(var(--ds-line))" strokeWidth={1} />
            {perMonth.map((count, i) => {
              const a = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
              const lx = SIZE / 2 + (R_OUT + 14) * Math.cos(a);
              const ly = SIZE / 2 + (R_OUT + 14) * Math.sin(a);
              return (
                <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                  <motion.path
                    d={sector(i)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hovered === null || hovered === i ? 1 : 0.3 }}
                    transition={{ duration: 0.3 }}
                    fill={count === 0 ? 'hsl(var(--ds-gold) / 0.18)' : 'hsl(var(--ds-forest) / 0.75)'}
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] font-bold"
                    fill="hsl(var(--ds-forest-deep) / 0.6)"
                  >
                    {monthShort(i + 1)}
                  </text>
                </g>
              );
            })}
            <text
              x={SIZE / 2}
              y={SIZE / 2 - 6}
              textAnchor="middle"
              className="text-[11px] font-bold uppercase"
              fill="hsl(var(--ds-forest) / 0.7)"
            >
              {hovered === null ? 'Année' : MONTH_FULL[hovered]}
            </text>
            <text
              x={SIZE / 2}
              y={SIZE / 2 + 14}
              textAnchor="middle"
              className="text-[15px] font-bold"
              fill="hsl(var(--ds-forest-deep))"
            >
              {hovered === null ? `${species.length} espèces` : `${perMonth[hovered]} en production`}
            </text>
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-[hsl(var(--ds-forest-deep))]/80">
            Chaque part du cercle compte les espèces en production ce mois-là : récolte pour la
            maison, floraison pour les pollinisateurs. Les parts claires sont les creux de l’année.
          </p>
          {gaps.length > 0 ? (
            <p className="rounded-2xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-gold))]/10 px-3 py-2 text-[12px] text-[hsl(var(--ds-forest-deep))]">
              À combler : {gaps.map((g) => MONTH_FULL[g.i].toLowerCase()).join(', ')}.
            </p>
          ) : (
            <p className="rounded-2xl border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-forest))]/8 px-3 py-2 text-[12px] text-[hsl(var(--ds-forest-deep))]">
              Aucun mois vide : la table est servie toute l’année.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {strates.map((block, i) => (
          <StrateColumn key={block.strate} block={block} index={i}>
            {block.species.map((sp, j) => {
              const t = foodTraits(sp.species);
              const active = hovered === null || t.months.includes(hovered + 1);
              return (
                <SpeciesLine
                  key={sp.species.id}
                  sp={sp}
                  index={j}
                  dimmed={!active}
                  metric={t.months.length ? t.months.map((m) => monthShort(m)).join('·') : undefined}
                  gauge={sp.rank}
                  note={t.yieldLabel || sp.species.service}
                />
              );
            })}
          </StrateColumn>
        ))}
      </div>
    </div>
  );
};

export default ProjectionGardeManger;
