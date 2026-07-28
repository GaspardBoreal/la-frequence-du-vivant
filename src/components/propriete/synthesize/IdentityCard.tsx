import React from 'react';
import type { IdentityLine } from './synthesisModel';

/** Carte d'identité écologique — la fiche signalétique du site, tous étages confondus. */
export const IdentityCard: React.FC<{
  lines: IdentityLine[];
  compact?: boolean;
}> = ({ lines, compact = false }) => {
  if (lines.length === 0) {
    return (
      <p className="text-xs italic text-[hsl(var(--ds-forest-deep))]/45">
        — Complétez les étapes précédentes pour révéler la carte d’identité du site —
      </p>
    );
  }

  return (
    <dl
      className={
        compact
          ? 'grid grid-cols-2 gap-x-6 gap-y-2.5'
          : 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3'
      }
    >
      {lines.map((l) => (
        <div
          key={l.key}
          className="flex items-baseline justify-between gap-3 border-b border-dotted border-[hsl(var(--ds-line))] pb-1.5 print-avoid-break"
        >
          <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/80 shrink-0">
            {l.label}
          </dt>
          <dd className="text-right">
            <span className="font-serif italic text-base text-[hsl(var(--ds-forest-deep))] leading-tight">
              {l.value}
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]/40">
              {l.origin}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
