import React from 'react';
import { ECO_FUNCTIONS, STRATES, STRATE_ORDER } from '@/lib/plantSpread';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';

interface Props {
  plantings: Planting[];
  /** Surface de l'ouvrage en m² (0 pour les ouvrages ponctuels / linéaires). */
  areaM2: number;
  growth: number;
}

const Gauge: React.FC<{ value: number; label: string; hint: string; tone: string }> = ({
  value,
  label,
  hint,
  tone,
}) => (
  <div className="min-w-[112px] flex-1">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[9.5px] font-semibold uppercase tracking-wide opacity-55">{label}</span>
      <span className="text-[12px] font-bold tabular-nums" style={{ color: tone }}>
        {Math.round(value)}%
      </span>
    </div>
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--ds-forest-deep))]/10">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, value)}%`, backgroundColor: tone }}
      />
    </div>
    <p className="mt-1 text-[9.5px] leading-tight opacity-50">{hint}</p>
  </div>
);

/**
 * L'équilibre du plan, lu en direct : couverture du sol, diversité des strates
 * et fonctions écologiques réunies. Une composition n'est pas belle parce
 * qu'elle est pleine, mais parce qu'elle est juste.
 */
export const BalanceBar: React.FC<Props> = ({ plantings, areaM2, growth }) => {
  const covered = plantings.reduce(
    (s, p) => s + Math.PI * Math.pow((p.spreadM * growth) / 2, 2),
    0,
  );
  const coverage = areaM2 > 0 ? (covered / areaM2) * 100 : 0;

  const byStrate = STRATE_ORDER.map((s) => ({
    strate: s,
    n: plantings.filter((p) => p.strate === s).length,
  })).filter((x) => x.n > 0);
  const strateScore = (byStrate.length / 4) * 100;

  const fns = new Set<string>();
  plantings.forEach((p) => (p.functions || []).forEach((f) => fns.add(f)));
  const fnScore = (fns.size / 5) * 100;

  const tone = (v: number) => (v > 110 ? '#c1663f' : v >= 60 ? '#3d7a63' : '#c8a24a');

  return (
    <div className="flex flex-wrap items-start gap-4 border-t border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/70 px-3 py-2.5 backdrop-blur">
      <Gauge
        value={coverage}
        label="Couverture"
        hint={
          areaM2 > 0
            ? coverage > 110
              ? 'Concurrence probable à maturité'
              : coverage >= 60
                ? 'Sol couvert, sol vivant'
                : 'Le sol reste nu par endroits'
            : 'Ouvrage sans surface'
        }
        tone={tone(coverage)}
      />
      <Gauge
        value={strateScore}
        label="Strates"
        hint={`${byStrate.length} strate${byStrate.length > 1 ? 's' : ''} — l’étagement fait la résilience`}
        tone={tone(strateScore)}
      />
      <Gauge
        value={fnScore}
        label="Fonctions"
        hint={`${fns.size} fonction${fns.size > 1 ? 's' : ''} écologique${fns.size > 1 ? 's' : ''} réunie${fns.size > 1 ? 's' : ''}`}
        tone={tone(fnScore)}
      />

      <div className="flex min-w-[150px] flex-1 flex-wrap items-center gap-1">
        {byStrate.map(({ strate, n }) => (
          <span
            key={strate}
            className="rounded-full px-1.5 py-0.5 text-[9.5px] font-medium"
            style={{ backgroundColor: `${STRATES[strate].color}22`, color: STRATES[strate].color }}
          >
            {STRATES[strate].glyph} {n}
          </span>
        ))}
        {Array.from(fns).map((f) => {
          const eco = ECO_FUNCTIONS.find((x) => x.key === f);
          return eco ? (
            <span
              key={f}
              title={eco.label}
              className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9.5px]"
            >
              {eco.glyph}
            </span>
          ) : null;
        })}
        {!plantings.length && (
          <span className="text-[10px] opacity-45">Posez une première espèce sur le plan…</span>
        )}
      </div>
    </div>
  );
};

export default BalanceBar;
