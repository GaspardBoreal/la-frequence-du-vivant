import React from 'react';
import { Sparkles, Wand2 } from 'lucide-react';

interface Option<T extends string> {
  id: T;
  label: string;
  icon: string;
  hint: string;
}

interface Props<T extends string> {
  index: number;
  title: string;
  question: string;
  options: Option<T>[];
  value: T | null | undefined;
  onChange: (v: T | null) => void;
  suggestion?: { value: T | null; because: string | null };
}

/** Un sélecteur du contexte de site — trois choix, une déduction proposée. */
export function SelectorRow<T extends string>({
  index,
  title,
  question,
  options,
  value,
  onChange,
  suggestion,
}: Props<T>) {
  const canSuggest = !!suggestion?.value && suggestion.value !== value;

  return (
    <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
            {String(index).padStart(2, '0')} · {title}
          </div>
          <p className="mt-1 font-serif italic text-lg text-[hsl(var(--ds-forest-deep))]">
            {question}
          </p>
        </div>
        {canSuggest && (
          <button
            type="button"
            onClick={() => onChange(suggestion!.value)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-gold))]/10 px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-gold))]/25 transition-colors"
            title={suggestion?.because ?? undefined}
          >
            <Wand2 className="w-3 h-3" />
            Proposition : {options.find((o) => o.id === suggestion!.value)?.label}
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((o) => {
          const active = value === o.id;
          const suggested = suggestion?.value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(active ? null : o.id)}
              className={[
                'relative text-left rounded-xl border px-3 py-3 transition-all',
                active
                  ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15 shadow-[0_8px_24px_-14px_rgba(176,141,87,0.8)]'
                  : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] hover:border-[hsl(var(--ds-gold))]/60',
              ].join(' ')}
            >
              {suggested && !active && (
                <Sparkles className="absolute top-2 right-2 w-3 h-3 text-[hsl(var(--ds-gold))]" />
              )}
              <div className="text-xl leading-none">{o.icon}</div>
              <div className="mt-1.5 text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
                {o.label}
              </div>
              <div className="text-[11px] text-[hsl(var(--ds-forest-deep))]/60 leading-snug">
                {o.hint}
              </div>
            </button>
          );
        })}
      </div>

      {suggestion?.because && (
        <p className="mt-2 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/55">
          Déduit de : {suggestion.because}.
        </p>
      )}
    </div>
  );
}
