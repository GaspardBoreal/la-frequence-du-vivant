import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin } from 'lucide-react';
import { IconCompacte, IconGrumeleuse, IconParticulaire } from './SoilPictos';
import { StructureChoiceTooltip } from './StructureChoiceTooltip';
import {
  RESULT_ORDER,
  RESULT_SHORT,
  type StructureResultId,
  type StructureTestId,
} from './structureTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

const ICONS: Record<StructureResultId, React.ReactNode> = {
  compacte: <IconCompacte />,
  grumeleuse: <IconGrumeleuse />,
  particulaire: <IconParticulaire />,
};

export const StructureSampleRow: React.FC<{
  sample: SoilSample;
  index: number;
  onPatch: (patch: Partial<SoilSample>) => void;
}> = ({ sample, index, onPatch }) => {
  const [hovered, setHovered] = useState<StructureResultId | null>(null);
  const test = (sample.structure_test ?? null) as StructureTestId | null;
  const result = (sample.structure_result ?? null) as StructureResultId | null;
  const complete = !!test && !!result;

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
            aria-label={`Test réalisé sur le prélèvement ${sample.label}`}
            className="inline-flex rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-0.5"
          >
            {([
              { id: 'beche' as StructureTestId, letter: 'A', label: 'Bêche' },
              { id: 'stabilite' as StructureTestId, letter: 'B', label: 'Stabilité' },
            ]).map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={test === t.id}
                onClick={() => onPatch({ structure_test: test === t.id ? null : t.id })}
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

        {/* Résultat observé */}
        <div className="flex flex-col gap-1">
          <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/60">
            Résultat observé
          </span>
          <div role="radiogroup" aria-label={`Résultat observé sur ${sample.label}`} className="flex gap-1.5">
            {RESULT_ORDER.map((r, i) => {
              const selected = result === r;
              const tipId = `struct-tip-${sample.id}-${r}`;
              return (
                <div
                  key={r}
                  className="relative"
                  onMouseEnter={() => setHovered(r)}
                  onMouseLeave={() => setHovered((h) => (h === r ? null : h))}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-describedby={hovered === r ? tipId : undefined}
                    onClick={() => onPatch({ structure_result: selected ? null : r })}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-1.5 w-[74px] transition-all ${
                      selected
                        ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/10 shadow-[0_3px_10px_-4px_rgba(47,93,58,0.35)]'
                        : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 hover:border-[hsl(var(--ds-forest))]/50'
                    }`}
                  >
                    <span
                      className={`[&_svg]:w-7 [&_svg]:h-7 transition-transform ${selected ? 'scale-110' : ''}`}
                      aria-hidden
                    >
                      {ICONS[r]}
                    </span>
                    <span className="text-[9px] font-semibold leading-tight text-center text-[hsl(var(--ds-forest-deep))]">
                      {RESULT_SHORT[r]}
                    </span>
                  </button>
                  <StructureChoiceTooltip
                    variant={hovered === r ? r : null}
                    id={tipId}
                    align="right"
                    clamp
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
