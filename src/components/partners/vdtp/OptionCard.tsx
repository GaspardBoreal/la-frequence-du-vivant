import React from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ConfigOption } from '@/content/vdtp/configurateur';

interface Props {
  option: ConfigOption;
  selected: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
}

const OptionCard: React.FC<Props> = ({ option, selected, disabled, onToggle }) => (
  <motion.button
    type="button"
    role="switch"
    aria-checked={selected}
    disabled={disabled}
    whileTap={{ scale: disabled ? 1 : 0.99 }}
    onClick={() => onToggle(option.id)}
    className={`w-full rounded-2xl border p-4 text-left transition-all ${
      disabled ? 'cursor-not-allowed opacity-55' : ''
    } ${
      selected
        ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8 shadow-[0_6px_18px_-12px_rgba(47,93,58,0.6)]'
        : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 hover:border-[hsl(var(--ds-forest))]/50'
    }`}
  >
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]'
            : 'border-[hsl(var(--ds-line))] bg-transparent'
        }`}
      >
        {selected && <Check className="h-4 w-4 text-[hsl(var(--ds-cream))]" strokeWidth={3} />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-semibold leading-tight text-[hsl(var(--ds-forest-deep))]">
            {option.label}
          </h3>
          {option.core && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-gold))]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--ds-forest-deep))]">
              <Lock className="h-3 w-3" /> socle
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              option.state === 'production'
                ? 'bg-[hsl(var(--ds-forest))]/12 text-[hsl(var(--ds-forest-deep))]'
                : 'bg-[hsl(var(--ds-ink-soft))]/12 text-[hsl(var(--ds-ink-soft))]'
            }`}
          >
            {option.state === 'production' ? 'en production' : 'à adapter'}
          </span>
        </div>

        <p className="mt-1.5 text-[13px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
          {option.pitch}
        </p>
        <p className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-relaxed text-[hsl(var(--ds-forest-deep))]">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--ds-gold))]" />
          <span>{option.gain}</span>
        </p>
        <p className="mt-2 text-[11px] italic text-[hsl(var(--ds-ink-soft))]">
          Preuve : {option.proof}
        </p>
      </div>

      <span className="shrink-0 rounded-lg border border-[hsl(var(--ds-line))] px-2 py-1 text-[11px] font-semibold text-[hsl(var(--ds-ink-soft))]">
        {option.weight} pts
      </span>
    </div>
  </motion.button>
);

export default OptionCard;
