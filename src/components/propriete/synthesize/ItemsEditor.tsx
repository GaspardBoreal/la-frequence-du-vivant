import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { SynthesisItem } from '@/hooks/propriete/usePropertySynthesis';

interface Props {
  title: string;
  eyebrow: string;
  tone: 'atout' | 'contrainte' | 'vigilance';
  placeholder: string;
  items: SynthesisItem[];
  onChange: (items: SynthesisItem[]) => void;
  /** Propositions déterministes non encore retenues. */
  suggestions?: SynthesisItem[];
}

const TONES: Record<Props['tone'], { border: string; dot: string; head: string }> = {
  atout: {
    border: 'border-[hsl(var(--ds-forest))]/35',
    dot: 'bg-[hsl(var(--ds-forest))]',
    head: 'text-[hsl(var(--ds-forest))]',
  },
  contrainte: {
    border: 'border-[hsl(var(--ds-gold))]/50',
    dot: 'bg-[hsl(var(--ds-gold))]',
    head: 'text-[hsl(var(--ds-gold))]',
  },
  vigilance: {
    border: 'border-amber-400/60',
    dot: 'bg-amber-500',
    head: 'text-amber-700',
  },
};

export const ItemsEditor: React.FC<Props> = ({
  title,
  eyebrow,
  tone,
  placeholder,
  items,
  onChange,
  suggestions = [],
}) => {
  const t = TONES[tone];
  const [draft, setDraft] = React.useState('');

  const add = (item: SynthesisItem) => onChange([...items, item]);
  const addDraft = () => {
    const text = draft.trim();
    if (!text) return;
    add({ text, because: null, source: 'user' });
    setDraft('');
  };
  const update = (i: number, text: string) =>
    onChange(items.map((it, k) => (k === i ? { ...it, text, source: 'user' } : it)));
  const remove = (i: number) => onChange(items.filter((_, k) => k !== i));

  const fresh = suggestions.filter(
    (s) => !items.some((i) => i.text.toLowerCase() === s.text.toLowerCase()),
  );

  return (
    <div className={`rounded-3xl border ${t.border} bg-[hsl(var(--ds-cream))] p-5 md:p-6 flex flex-col`}>
      <div className={`text-[10px] font-bold tracking-[0.3em] uppercase ${t.head}`}>{eyebrow}</div>
      <h4 className="mt-1 font-serif italic text-xl text-[hsl(var(--ds-forest-deep))]">{title}</h4>

      <ul className="mt-3 space-y-2 flex-1">
        {items.length === 0 && (
          <li className="text-xs italic text-[hsl(var(--ds-forest-deep))]/45">
            — Rien de retenu pour l’instant —
          </li>
        )}
        {items.map((it, i) => (
          <li
            key={i}
            className="group flex items-start gap-2 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/[0.04] px-2.5 py-2"
          >
            <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
            <div className="flex-1 min-w-0">
              <textarea
                rows={1}
                value={it.text}
                onChange={(e) => update(i, e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] leading-snug"
              />
              {it.because && (
                <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/50">
                  {it.because}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded text-[hsl(var(--ds-forest-deep))]/50 hover:text-red-600"
              aria-label="Retirer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {fresh.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ds-forest-deep))]/45 mb-1.5">
            Suggestions issues de vos données
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fresh.slice(0, 6).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => add({ ...s })}
                title={s.because ?? undefined}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/75 hover:border-[hsl(var(--ds-gold))] hover:bg-[hsl(var(--ds-gold))]/10"
              >
                <Plus className="w-3 h-3" /> {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-3 py-1.5 text-xs text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-gold))]"
        />
        <button
          type="button"
          onClick={addDraft}
          className="shrink-0 whitespace-nowrap rounded-full border border-[hsl(var(--ds-forest))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))] hover:text-[hsl(var(--ds-cream))] transition-colors"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
};
