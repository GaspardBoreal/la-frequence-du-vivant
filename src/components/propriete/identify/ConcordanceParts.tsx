import React from 'react';
import { Check, CircleDashed, X, Minus } from 'lucide-react';
import { type AxisMatch, type ReadLevel } from '@/lib/plantIndicatorKb';

export const VERDICT_TOKEN: Record<AxisMatch, string> = {
  oui: '--ds-verdict-oui',
  partiel: '--ds-verdict-partiel',
  non: '--ds-verdict-non',
  na: '--ds-verdict-na',
};

export const iconFor = (m: AxisMatch, cls = 'w-3.5 h-3.5') => {
  if (m === 'oui') return <Check className={cls} strokeWidth={3} />;
  if (m === 'partiel') return <CircleDashed className={cls} strokeWidth={2.4} />;
  if (m === 'non') return <X className={cls} strokeWidth={3} />;
  return <Minus className={cls} />;
};

export const wordFor = (m: AxisMatch) =>
  m === 'oui'
    ? 'OUI · 2 pts'
    : m === 'partiel'
      ? 'PARTIEL · 1 pt'
      : m === 'non'
        ? 'NON · 0 pt'
        : 'NON ÉVALUÉ · 0 pt';

/** Pastille de verdict, contrastée et sémantique */
export const VerdictChip: React.FC<{ match: AxisMatch }> = ({ match }) => {
  const token = VERDICT_TOKEN[match];
  if (match === 'na') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[hsl(var(--ds-verdict-na))]/60 px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--ds-verdict-na))]">
        {iconFor(match, 'w-3 h-3')} Non évalué
      </span>
    );
  }
  const solid = match === 'oui';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.1em]"
      style={
        solid
          ? { background: `hsl(var(${token}))`, color: 'hsl(var(--ds-cream))' }
          : {
              background: `hsl(var(${token}) / 0.14)`,
              color: `hsl(var(${token}))`,
              boxShadow: `inset 0 0 0 1px hsl(var(${token}) / 0.45)`,
            }
      }
    >
      {iconFor(match, 'w-3 h-3')} {wordFor(match)}
    </span>
  );
};

/** Jauge à 3 crans — lecture immédiate : deux barres alignées = accord */
export const LevelGauge: React.FC<{
  level: ReadLevel | null;
  token: string;
  align?: 'left' | 'right';
  caption: string;
}> = ({ level, token, align = 'left', caption }) => (
  <div className={align === 'right' ? 'flex flex-col items-end gap-1' : 'flex flex-col gap-1'}>
    <div className={`flex gap-[3px] ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      {[1, 2, 3].map((step) => {
        const on = level != null && level >= step;
        return (
          <span
            key={step}
            className="h-[7px] w-6 rounded-full transition-colors"
            style={{
              background: on
                ? `hsl(var(${token}) / ${0.45 + step * 0.18})`
                : 'hsl(var(--ds-line) / 0.55)',
              outline: level == null ? '1px dashed hsl(var(--ds-verdict-na) / 0.5)' : 'none',
              outlineOffset: '1px',
            }}
          />
        );
      })}
    </div>
    <span className="text-[10px] leading-none text-[hsl(var(--ds-forest-deep))]/70">{caption}</span>
  </div>
);

export const CONCORDANCE_GUIDE: Array<{ m: AxisMatch; txt: string }> = [
  { m: 'oui', txt: 'Même niveau de lecture : le sol et la flore disent la même chose.' },
  { m: 'partiel', txt: 'Un cran d’écart : tendance commune, intensité différente — à nuancer.' },
  { m: 'non', txt: 'Deux crans d’écart : les lectures divergent, un facteur externe agit.' },
];

export const CONCORDANCE_REMEDES = [
  'Reprendre l’observation de terrain : le cortège coché est-il complet et bien identifié ?',
  'Vérifier les prélèvements de l’Étape 2 : nombre, emplacement et représentativité des points.',
  'Envisager une histoire du site (remblai, amendement, drainage, travaux récents) qui découplerait sol et végétation.',
];
