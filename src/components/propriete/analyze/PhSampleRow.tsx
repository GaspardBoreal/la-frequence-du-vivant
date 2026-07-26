import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, RotateCcw } from 'lucide-react';
import { PhChoiceTooltip } from './PhChoiceTooltip';
import {
  PH_MAX,
  PH_MIN,
  PH_STEP,
  classifyPh,
  phPercent,
  type PhClassId,
  type PhTestId,
} from './phTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

export const PhSampleRow: React.FC<{
  sample: SoilSample;
  index: number;
  onPatch: (patch: Partial<SoilSample>) => void;
}> = ({ sample, index, onPatch }) => {
  const [hovered, setHovered] = useState<PhClassId | null>(null);
  const test = (sample.ph_test ?? null) as PhTestId | null;
  const value = typeof sample.ph_value === 'number' ? sample.ph_value : null;
  const cls = value != null ? classifyPh(value) : null;
  const complete = !!test && value != null;
  const tipId = `ph-tip-${sample.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border p-3 transition-all ${
        complete
          ? 'border-[hsl(var(--ds-forest))]/45 bg-[hsl(var(--ds-forest))]/[0.06] shadow-[inset_0_1px_8px_rgba(47,93,58,0.08)]'
          : 'border-dashed border-[hsl(var(--ds-forest))]/30 bg-[hsl(var(--ds-cream))]/60'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Identité du prélèvement */}
        <div className="flex items-center gap-2 min-w-[150px] flex-1">
          <div className="relative flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm">
            {sample.label}
            {complete && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(var(--ds-gold))] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[hsl(var(--ds-forest-deep))]" strokeWidth={3.5} />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/75 truncate">
              <MapPin className="w-3 h-3 shrink-0 opacity-60" />
              <span className="truncate">
                {(sample.location ?? '').trim() || 'Emplacement non nommé'}
              </span>
            </div>
            {!complete && (
              <div className="text-[9.5px] font-bold tracking-[0.16em] uppercase text-[hsl(var(--ds-gold))] mt-0.5">
                À compléter
              </div>
            )}
          </div>
        </div>

        {/* Test utilisé */}
        <div className="flex flex-col gap-1">
          <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/60">
            Test
          </span>
          <div
            role="radiogroup"
            aria-label={`Test de pH réalisé sur le prélèvement ${sample.label}`}
            className="inline-flex rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-0.5"
          >
            {([
              { id: 'bandelette' as PhTestId, letter: 'A', label: 'Bandelette' },
              { id: 'phmetre' as PhTestId, letter: 'B', label: 'pHmètre' },
            ]).map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={test === t.id}
                onClick={() => onPatch({ ph_test: test === t.id ? null : t.id })}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all ${
                  test === t.id
                    ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] shadow-sm'
                    : 'text-[hsl(var(--ds-forest-deep))]/70 hover:bg-[hsl(var(--ds-forest))]/10'
                }`}
              >
                {t.label} <span className="opacity-70">({t.letter})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Valeur de pH */}
        <div className="flex flex-col gap-1 min-w-[240px] flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/60">
              pH mesuré
            </span>
            {value != null && (
              <button
                type="button"
                onClick={() => onPatch({ ph_value: null })}
                className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-[hsl(var(--ds-forest-deep))]/50 hover:text-[hsl(var(--ds-forest-deep))] transition"
              >
                <RotateCcw className="w-2.5 h-2.5" /> effacer
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <div
                className="h-2.5 w-full rounded-full border border-[hsl(var(--ds-line))]"
                style={{
                  background:
                    'linear-gradient(90deg,#c94a3a 0%,#d97a2b 22%,#e4b64a 44%,#6b9a3b 58%,#3e8074 78%,#2f5d7a 100%)',
                  opacity: value == null ? 0.35 : 1,
                }}
              />
              {value != null && (
                <motion.span
                  layout
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
                  style={{ left: `calc(${phPercent(value)}% - 7px)`, backgroundColor: cls!.color }}
                />
              )}
              <input
                type="range"
                min={PH_MIN}
                max={PH_MAX}
                step={PH_STEP}
                value={value ?? 7}
                onChange={(e) => onPatch({ ph_value: parseFloat(e.target.value) })}
                aria-label={`Valeur de pH du prélèvement ${sample.label}`}
                className="absolute inset-x-0 -top-1.5 w-full h-6 cursor-pointer opacity-0"
              />
            </div>

            <div
              className="relative shrink-0"
              onMouseEnter={() => setHovered(cls?.id ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              <button
                type="button"
                aria-describedby={hovered ? tipId : undefined}
                onFocus={() => setHovered(cls?.id ?? null)}
                onBlur={() => setHovered(null)}
                className="flex items-center gap-2 rounded-xl border px-2.5 py-1 transition-all"
                style={{
                  borderColor: cls ? `${cls.color}80` : 'hsl(var(--ds-line))',
                  background: cls ? `${cls.color}18` : 'transparent',
                }}
              >
                <span
                  className="font-serif text-xl leading-none"
                  style={{ color: cls?.color ?? 'hsl(var(--ds-forest-deep) / 0.45)' }}
                >
                  {value != null ? value.toFixed(1) : '—'}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.14em] leading-tight text-left"
                  style={{ color: cls?.color ?? 'hsl(var(--ds-forest-deep) / 0.45)' }}
                >
                  {cls ? cls.short : 'non mesuré'}
                </span>
              </button>
              <PhChoiceTooltip variant={hovered} id={tipId} align="right" clamp />
            </div>
          </div>

          {/* Raccourcis de saisie rapide */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {[4.5, 5.5, 6.5, 7, 7.5, 8.5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onPatch({ ph_value: v })}
                className={`rounded-full border px-2 py-[1px] text-[9.5px] font-semibold transition-all ${
                  value === v
                    ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/20 text-[hsl(var(--ds-forest-deep))]'
                    : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 text-[hsl(var(--ds-forest-deep))]/70 hover:border-[hsl(var(--ds-gold))]/60'
                }`}
              >
                {v.toFixed(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
