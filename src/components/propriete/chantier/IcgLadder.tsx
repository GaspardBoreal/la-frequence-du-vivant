import React from 'react';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { ConcordanceRow } from '@/lib/plantIndicatorKb';
import type { IcgDelta, IcgReading } from '@/lib/chantierIcg';
import { MATCH_LABEL } from '@/lib/chantierIcg';

const TONE: Record<string, string> = {
  oui: '#4f8a5b',
  partiel: '#c8a24a',
  non: '#b4553f',
  na: '#8b8578',
};

/** Trois barres pour un niveau 1..3 : la lecture doit être immédiate. */
const Gauge: React.FC<{ level: number | null; color: string }> = ({ level, color }) => (
  <span className="inline-flex items-end gap-[2px]" aria-hidden>
    {[1, 2, 3].map((i) => (
      <span
        key={i}
        style={{
          height: 4 + i * 3,
          background: level != null && level >= i ? color : 'currentColor',
          opacity: level != null && level >= i ? 1 : 0.18,
        }}
        className="w-[4px] rounded-[1px]"
      />
    ))}
  </span>
);

const RowLine: React.FC<{ row: ConcordanceRow; gain?: number }> = ({ row, gain }) => (
  <div className="flex items-center gap-2 border-b border-current/10 py-1.5 last:border-b-0">
    <span className="min-w-0 flex-1 truncate text-[12px]">{row.label}</span>
    <span className="hidden w-[128px] shrink-0 truncate text-[11px] opacity-60 sm:block">
      {row.soil}
    </span>
    <Gauge level={row.soilLevel} color={TONE[row.match]} />
    <ArrowRight className="h-3 w-3 opacity-30" />
    <Gauge level={row.floraLevel} color={TONE[row.match]} />
    <span
      className="w-[132px] shrink-0 text-right text-[11px] font-semibold"
      style={{ color: TONE[row.match] }}
    >
      {MATCH_LABEL[row.match]}
    </span>
    <span className="w-[34px] shrink-0 text-right text-[11px] tabular-nums opacity-70">
      {row.rowPoints}/2
    </span>
    {gain != null && (
      <span
        className={`w-[38px] shrink-0 text-right text-[11px] font-semibold tabular-nums ${
          gain > 0 ? 'text-[#4f8a5b]' : gain < 0 ? 'text-[#b4553f]' : 'opacity-35'
        }`}
      >
        {gain > 0 ? `+${gain}` : gain < 0 ? gain : '—'}
      </span>
    )}
  </div>
);

/**
 * L'échelle ICG expliquée ligne à ligne : sol lu à gauche, flore lue à droite,
 * verdict et points. Le calcul est écrit en toutes lettres sous le tableau —
 * un chiffre que l'on ne sait pas refaire ne convainc personne.
 */
export const IcgLadder: React.FC<{
  reading: IcgReading;
  delta?: IcgDelta | null;
  title?: string;
}> = ({ reading, delta, title }) => (
  <div className="rounded-2xl border border-current/15 p-3">
    {title && (
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] opacity-55">{title}</p>
    )}
    <div className="mb-1 flex items-center gap-2 text-[9.5px] uppercase tracking-[0.14em] opacity-40">
      <span className="min-w-0 flex-1">Critère</span>
      <span className="hidden w-[128px] shrink-0 sm:block">Lecture du sol</span>
      <span className="w-[58px] shrink-0 text-center">Sol / Flore</span>
      <span className="w-[132px] shrink-0 text-right">Verdict</span>
      <span className="w-[34px] shrink-0 text-right">Pts</span>
      {delta && <span className="w-[38px] shrink-0 text-right">Δ</span>}
    </div>
    {reading.detail.rows.map((r, i) => (
      <RowLine key={r.key} row={r} gain={delta ? delta.rows[i]?.gain : undefined} />
    ))}
    <p className="mt-2 text-[11px] italic opacity-70">{reading.sentence}</p>
    <p className="mt-0.5 text-[10.5px] opacity-50">
      Barème D.S. : même niveau = 2 points, un cran d'écart = 1, deux crans = 0. Total sur 16,
      ramené sur 100. Fiabilité de lecture : {reading.detail.reliability} %.
    </p>
  </div>
);

/** Le gain, mis en scène : deux nombres, une flèche, trois raisons. */
export const IcgDeltaHero: React.FC<{
  before: IcgReading;
  after: IcgReading | null;
  delta: IcgDelta | null;
  afterLabel: string;
}> = ({ before, after, delta, afterLabel }) => {
  const gain = delta?.icg ?? 0;
  const Icon = gain > 0 ? TrendingUp : gain < 0 ? TrendingDown : Minus;
  return (
    <div className="rounded-2xl border border-[#c8a24a]/40 bg-[#c8a24a]/[0.07] p-4">
      <div className="flex flex-wrap items-end gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-55">Avant travaux</p>
          <p className="font-serif text-[38px] leading-none">{before.detail.icg}</p>
          <p className="text-[11px] opacity-60">/ 100 · {before.detail.band}</p>
        </div>
        <Icon
          className={`mb-2 h-6 w-6 ${gain > 0 ? 'text-[#4f8a5b]' : gain < 0 ? 'text-[#b4553f]' : 'opacity-30'}`}
        />
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-55">{afterLabel}</p>
          <p className="font-serif text-[38px] leading-none">{after ? after.detail.icg : '—'}</p>
          <p className="text-[11px] opacity-60">
            {after ? `/ 100 · ${after.detail.band}` : 'à renseigner'}
          </p>
        </div>
        {after && (
          <div className="ml-auto text-right">
            <p
              className={`font-serif text-[30px] leading-none ${
                gain > 0 ? 'text-[#4f8a5b]' : gain < 0 ? 'text-[#b4553f]' : 'opacity-40'
              }`}
            >
              {gain > 0 ? `+${gain}` : gain}
            </p>
            <p className="text-[10.5px] opacity-60">points d'ICG</p>
          </div>
        )}
      </div>

      {delta && delta.drivers.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-current/10 pt-2.5">
          {delta.drivers.map((d) => (
            <li key={d.key} className="text-[11.5px]">
              <span className="font-semibold">{d.label}</span> —{' '}
              {MATCH_LABEL[d.before.match].toLowerCase()} → {MATCH_LABEL[d.after.match].toLowerCase()}{' '}
              <span className={d.gain > 0 ? 'text-[#4f8a5b]' : 'text-[#b4553f]'}>
                ({d.gain > 0 ? `+${d.gain}` : d.gain} pt)
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IcgLadder;
