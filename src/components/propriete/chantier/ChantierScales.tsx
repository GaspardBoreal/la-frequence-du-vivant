import React from 'react';
import { buildScaleReadings, type Scale5 } from '@/lib/soilFloraScales';
import type { ConcordanceDetail } from '@/lib/plantIndicatorKb';

const pos = (n: number) => ((n - 0.5) / 5) * 100;

/**
 * Les mêmes quatre curseurs, en double lecture : le cortège avant travaux
 * et le cortège projeté, sur une seule échelle à 5 crans.
 */
export const ChantierScales: React.FC<{
  before: ConcordanceDetail;
  after: ConcordanceDetail | null;
  afterLabel: string;
}> = ({ before, after, afterLabel }) => {
  const b = React.useMemo(() => buildScaleReadings(before, true), [before]);
  const a = React.useMemo(() => (after ? buildScaleReadings(after, true) : null), [after]);

  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-55">
          Ce que dit le site, avant et après
        </p>
        <div className="flex items-center gap-3 text-[10px] opacity-70">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[9px] w-[9px] rounded-full bg-white/45" /> Avant
          </span>
          {a && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[9px] w-[9px] rounded-full bg-[#c8a24a]" /> {afterLabel}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {b.map((r, i) => {
          const av: Scale5 | null = r.flora;
          const ap: Scale5 | null = a ? a[i].flora : null;
          const word = (v: Scale5 | null) => (v == null ? '—' : r.axis.steps[v - 1]);
          return (
            <div key={r.axis.id}>
              <div className="flex items-baseline justify-between gap-2 text-[11px]">
                <span className="uppercase tracking-[0.16em] opacity-55">{r.axis.label}</span>
                <span className="opacity-85">
                  {word(av)}
                  {ap != null && ap !== av ? ` → ${word(ap)}` : ''}
                </span>
              </div>
              <div className="relative mt-1.5">
                <div className="flex gap-[3px]" aria-hidden>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="h-[7px] flex-1 rounded-full bg-white/10" />
                  ))}
                </div>
                {av != null && (
                  <span
                    className="absolute top-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45"
                    style={{ left: `${pos(av)}%` }}
                    title={`Avant : ${word(av)}`}
                  />
                )}
                {ap != null && (
                  <span
                    className="absolute top-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c8a24a] ring-2 ring-black/30"
                    style={{ left: `${pos(ap)}%` }}
                    title={`${afterLabel} : ${word(ap)}`}
                  />
                )}
              </div>
              <div className="mt-1 flex justify-between text-[9.5px] opacity-45">
                <span>{r.axis.left}</span>
                <span>{r.axis.right}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!a && (
        <p className="mt-2 text-[10.5px] italic opacity-55">
          Ajoutez des espèces au lot pour lire la trajectoire projetée.
        </p>
      )}
    </section>
  );
};

export default ChantierScales;
