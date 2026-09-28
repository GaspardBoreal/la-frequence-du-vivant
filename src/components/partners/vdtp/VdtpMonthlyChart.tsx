import React from 'react';
import { JOURNAL_ENTRIES, JOURNAL_THEME_LABEL, type JournalTheme } from '@/content/vdtp/journal';

const THEMES: JournalTheme[] = ['observer', 'mesurer', 'raconter', 'piloter'];
const THEME_COLOR: Record<JournalTheme, string> = {
  observer: 'hsl(var(--ds-forest))',
  mesurer: 'hsl(var(--ds-forest) / 0.6)',
  raconter: 'hsl(var(--ds-gold))',
  piloter: 'hsl(var(--ds-forest-deep))',
};
const START = '2026-07';
const OFFICIAL_MONTH = '2026-09';

const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(`${ym}-15T12:00:00`));

function monthsRange(): string[] {
  const last = [...JOURNAL_ENTRIES.map((e) => e.date.slice(0, 7)), new Date().toISOString().slice(0, 7)]
    .sort()
    .pop()!;
  const out: string[] = [];
  let [y, m] = START.split('-').map(Number);
  while (`${y}-${String(m).padStart(2, '0')}` <= last) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

interface Props {
  month: string | null;
  onMonth: (m: string | null) => void;
}

/** Synthèse mensuelle : briques livrées par pilier, cumul, repère de la présentation du 18.09. */
const VdtpMonthlyChart: React.FC<Props> = ({ month, onMonth }) => {
  const months = React.useMemo(monthsRange, []);
  const data = months.map((ym) => {
    const list = JOURNAL_ENTRIES.filter((e) => e.date.startsWith(ym));
    return { ym, total: list.length, by: THEMES.map((t) => list.filter((e) => e.theme === t).length) };
  });
  const max = Math.max(1, ...data.map((d) => d.total));
  let cum = 0;

  return (
    <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-white/70 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-[hsl(var(--ds-forest-deep))]">Synthèse mensuelle</h2>
        <p className="text-xs text-[hsl(var(--ds-ink-soft))]">
          {JOURNAL_ENTRIES.length} briques depuis juillet 2026
        </p>
      </div>
      <p className="mt-1 text-xs text-[hsl(var(--ds-ink-soft))]">
        Touchez un mois pour filtrer la frise.
      </p>

      <div className="mt-5 flex h-44 items-end gap-2 sm:gap-4">
        {data.map((d) => {
          cum += d.total;
          const active = month === d.ym;
          return (
            <button
              key={d.ym}
              type="button"
              onClick={() => onMonth(active ? null : d.ym)}
              aria-pressed={active}
              aria-label={`${monthLabel(d.ym)} : ${d.total} brique(s), ${cum} au total`}
              className={`group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-xl pb-1 transition-colors ${
                active ? 'bg-[hsl(var(--ds-gold))]/15' : 'hover:bg-[hsl(var(--ds-forest))]/5'
              } ${month && !active ? 'opacity-50' : ''}`}
            >
              {d.ym === OFFICIAL_MONTH && (
                <span className="absolute top-0 whitespace-nowrap rounded-full bg-[hsl(var(--ds-gold))] px-1.5 py-0.5 text-[9px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                  18.09 officiel
                </span>
              )}
              <span className="mb-1 text-xs font-semibold text-[hsl(var(--ds-forest-deep))]">{d.total || ''}</span>
              <div
                className="flex w-full max-w-[44px] flex-col-reverse overflow-hidden rounded-t-lg"
                style={{ height: `${(d.total / max) * 70}%` }}
              >
                {d.by.map((n, i) =>
                  n > 0 ? (
                    <div key={THEMES[i]} style={{ flex: n, background: THEME_COLOR[THEMES[i]] }} />
                  ) : null,
                )}
              </div>
              <span className="mt-1.5 text-[11px] capitalize text-[hsl(var(--ds-ink-soft))]">{monthLabel(d.ym)}</span>
              <span className="text-[10px] text-[hsl(var(--ds-ink-soft))]">cumul {cum}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        {THEMES.map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--ds-ink-soft))]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: THEME_COLOR[t] }} />
            {JOURNAL_THEME_LABEL[t]}
          </span>
        ))}
      </div>
    </section>
  );
};

export default VdtpMonthlyChart;
