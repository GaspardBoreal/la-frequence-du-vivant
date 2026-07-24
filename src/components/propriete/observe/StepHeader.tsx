import React from 'react';
import { Eye, Check } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'J\'observe' },
  { n: 2, label: 'J\'analyse' },
  { n: 3, label: 'J\'identifie' },
  { n: 4, label: 'Je synthétise' },
  { n: 5, label: 'Palette' },
];

export const StepHeader: React.FC<{ current?: number; savedAt?: string | null; saving?: boolean }> = ({
  current = 1,
  savedAt,
  saving,
}) => {
  return (
    <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-6 md:p-8 shadow-[0_2px_20px_-8px_rgba(60,80,60,0.15)]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]">
            <Eye className="w-3.5 h-3.5" /> Méthode D.S. · Étape {current} / 5
          </div>
          <h2 className="font-serif italic text-3xl md:text-4xl mt-2 text-[hsl(var(--ds-forest-deep))]">
            J'observe le site
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--ds-forest))]/80 max-w-xl leading-relaxed">
            Recueillir les informations essentielles du site avant d'analyser le sol.
            <span className="italic"> Observer · Comprendre · Concevoir.</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]/80">
            Progression
          </div>
          <div className="text-3xl font-serif text-[hsl(var(--ds-forest-deep))]">{current * 20}%</div>
          <div className="mt-2 text-[10px] text-[hsl(var(--ds-forest))]/70 flex items-center justify-end gap-1.5">
            {saving ? (
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ds-forest))] animate-pulse" /> Enregistrement…</span>
            ) : savedAt ? (
              <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Enregistré</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Dots progression */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = s.n === current;
          const done = s.n < current;
          return (
            <React.Fragment key={s.n}>
              <div
                className={`flex items-center gap-2 ${
                  active ? '' : 'opacity-60'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-serif ${
                    active
                      ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] shadow-md ring-2 ring-[hsl(var(--ds-gold))]/40'
                      : done
                      ? 'bg-[hsl(var(--ds-forest))]/25 text-[hsl(var(--ds-forest-deep))]'
                      : 'bg-transparent border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest))]/60'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                </span>
                <span className="hidden md:inline text-[11px] font-medium tracking-wide text-[hsl(var(--ds-forest-deep))]">
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-[hsl(var(--ds-line))]" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
