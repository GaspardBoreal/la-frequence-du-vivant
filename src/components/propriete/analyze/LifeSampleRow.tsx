import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Minus, Plus, RotateCcw, Worm } from 'lucide-react';
import { LifeChoiceTooltip } from './LifeChoiceTooltip';
import { LifeSignIcon } from './LifePictos';
import {
  LIFE_CLASS_MAP,
  LIFE_SIGNS,
  LIFE_TESTS,
  LIFE_TEST_LABELS,
  WORM_MAX,
  scoreLife,
  wormClass,
  type LifeSignId,
  type LifeTestId,
} from './lifeTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

export const LifeSampleRow: React.FC<{
  sample: SoilSample;
  index: number;
  total: number;
  onPatch: (patch: Partial<SoilSample>) => void;
  /** Pastille « preuves de terrain ». */
  mediaSlot?: React.ReactNode;
}> = ({ sample, index, total, onPatch, mediaSlot }) => {
  const [hovered, setHovered] = useState<LifeSignId | null>(null);
  const test = (sample.life_test ?? null) as LifeTestId | null;
  const signs = (sample.life_signs ?? []) as LifeSignId[];
  const worms = typeof sample.worm_count === 'number' ? sample.worm_count : null;
  const score = scoreLife(signs, worms);
  const complete = signs.length > 0 || worms != null;
  const cls = complete ? LIFE_CLASS_MAP[score.klass] : null;
  const tipId = `life-tip-${sample.id}`;

  const toggleSign = (id: LifeSignId) => {
    const next = signs.includes(id) ? signs.filter((s) => s !== id) : [...signs, id];
    onPatch({ life_signs: next });
  };

  const setWorms = (n: number | null) =>
    onPatch({ worm_count: n == null ? null : Math.max(0, Math.min(WORM_MAX * 4, n)) });

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
      <div className="flex flex-wrap items-start gap-3">
        {mediaSlot}
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
              <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--ds-gold))] mt-0.5">
                à renseigner
              </div>
            )}
            {cls && (
              <div
                className="text-[9.5px] font-bold uppercase tracking-[0.16em] mt-0.5"
                style={{ color: cls.color }}
              >
                {cls.label} · {score.score}/100
              </div>
            )}
          </div>
        </div>

        {/* Test utilisé */}
        <div className="min-w-[190px]">
          <div className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/60 mb-1">
            Test utilisé
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LIFE_TESTS.map((t) => {
              const active = test === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onPatch({ life_test: active ? null : t.id })}
                  className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${
                    active
                      ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                      : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))]/80 hover:border-[hsl(var(--ds-forest))]/50'
                  }`}
                >
                  {LIFE_TEST_LABELS[t.id]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comptage de vers */}
        <div className="min-w-[150px]">
          <div className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/60 mb-1">
            Vers · bêchée 20 cm
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Retirer un ver"
              onClick={() => setWorms(Math.max(0, (worms ?? 0) - 1))}
              className="w-7 h-7 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] flex items-center justify-center text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div
              className="min-w-[54px] text-center rounded-xl border px-2 py-1"
              style={{
                borderColor: worms != null ? `${LIFE_CLASS_MAP[wormClass(worms)].color}66` : undefined,
                background: worms != null ? `${LIFE_CLASS_MAP[wormClass(worms)].color}14` : undefined,
              }}
            >
              <span className="font-serif text-base text-[hsl(var(--ds-forest-deep))]">
                {worms ?? '—'}
              </span>
            </div>
            <button
              type="button"
              aria-label="Ajouter un ver"
              onClick={() => setWorms((worms ?? 0) + 1)}
              className="w-7 h-7 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] flex items-center justify-center text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <Worm className="w-3.5 h-3.5 text-[#c96a5a]" />
          </div>
        </div>

        {/* Reset */}
        {complete && (
          <button
            type="button"
            onClick={() => onPatch({ life_signs: [], worm_count: null, life_test: null })}
            className="self-center inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[10px] text-[hsl(var(--ds-forest-deep))]/70 hover:border-[hsl(var(--ds-forest))]/50 transition"
          >
            <RotateCcw className="w-3 h-3" /> Effacer
          </button>
        )}
      </div>

      {/* Indices cochables */}
      <div className="mt-3">
        <div className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/60 mb-1.5">
          Indices visibles — cochez tout ce qui est présent
        </div>
        <div className="flex flex-wrap gap-1.5" onMouseLeave={() => setHovered(null)}>
          {LIFE_SIGNS.map((s, i) => {
            const active = signs.includes(s.id);
            const align: 'left' | 'center' | 'right' =
              i < 2 ? 'left' : i >= LIFE_SIGNS.length - 2 ? 'right' : 'center';
            return (
              <div key={s.id} className="relative">
                <LifeChoiceTooltip
                  variant={hovered === s.id ? s.id : null}
                  id={`${tipId}-${s.id}`}
                  align={align}
                  clamp
                />
                <motion.button
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  aria-describedby={hovered === s.id ? `${tipId}-${s.id}` : undefined}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setHovered(s.id)}
                  onFocus={() => setHovered(s.id)}
                  onBlur={() => setHovered(null)}
                  onClick={() => toggleSign(s.id)}
                  className="group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition-all"
                  style={{
                    borderColor: active ? s.color : 'hsl(var(--ds-line))',
                    background: active ? `${s.color}1f` : 'hsl(var(--ds-cream))',
                    boxShadow: active ? `inset 0 1px 8px ${s.color}22` : undefined,
                  }}
                >
                  <span className="[&_svg]:w-4 [&_svg]:h-4 shrink-0">
                    <LifeSignIcon id={s.id} color={active ? s.color : 'hsl(var(--ds-forest))'} />
                  </span>
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: active ? s.color : 'hsl(var(--ds-forest-deep))' }}
                  >
                    {s.short}
                  </span>
                  {active && <Check className="w-3 h-3" style={{ color: s.color }} strokeWidth={3} />}
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jauge de vitalité du prélèvement */}
      {complete && cls && (
        <div className="mt-2.5">
          <div className="h-2 w-full rounded-full bg-[hsl(var(--ds-forest))]/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: cls.color }}
              initial={{ width: 0 }}
              animate={{ width: `${score.score}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="mt-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70">
            {score.signCount} indice{score.signCount > 1 ? 's' : ''} coché
            {score.signCount > 1 ? 's' : ''}
            {worms != null && <> · {worms} ver{worms > 1 ? 's' : ''} comptés</>} · prélèvement{' '}
            {index + 1}/{total}
          </div>
        </div>
      )}
    </motion.div>
  );
};
