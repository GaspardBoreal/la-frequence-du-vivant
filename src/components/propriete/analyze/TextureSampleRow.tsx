import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin } from 'lucide-react';
import { IconTextureSable, IconTextureLimon, IconTextureArgile } from './TexturePictos';
import { TextureChoiceTooltip } from './TextureChoiceTooltip';
import {
  BOUDIN_FORMS,
  BOUDIN_FORM_MAP,
  TEXTURE_ORDER,
  TEXTURE_SHORT,
  type BoudinFormId,
  type TextureResultId,
  type TextureTestId,
} from './textureTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

const ICONS: Record<TextureResultId, React.ReactNode> = {
  sable: <IconTextureSable />,
  limon: <IconTextureLimon />,
  argile: <IconTextureArgile />,
};

export const TextureSampleRow: React.FC<{
  sample: SoilSample;
  index: number;
  onPatch: (patch: Partial<SoilSample>) => void;
}> = ({ sample, index, onPatch }) => {
  const [hovered, setHovered] = useState<TextureResultId | null>(null);
  const test = (sample.texture_test ?? null) as TextureTestId | null;
  const result = (sample.texture_result ?? null) as TextureResultId | null;
  const form = (sample.boudin_form ?? null) as BoudinFormId | null;
  const complete = !!test && !!result;
  const showForm = test === 'boudin' && (result === 'limon' || result === 'argile');

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
            aria-label={`Test de texture réalisé sur le prélèvement ${sample.label}`}
            className="inline-flex rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-0.5"
          >
            {([
              { id: 'boudin' as TextureTestId, letter: 'A', label: 'Boudin' },
              { id: 'sedimentation' as TextureTestId, letter: 'B', label: 'Sédimentation' },
            ]).map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={test === t.id}
                onClick={() =>
                  onPatch(
                    test === t.id
                      ? { texture_test: null }
                      : { texture_test: t.id, ...(t.id === 'sedimentation' ? { boudin_form: null } : {}) }
                  )
                }
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
            Texture observée
          </span>
          <div role="radiogroup" aria-label={`Texture observée sur ${sample.label}`} className="flex gap-1.5">
            {TEXTURE_ORDER.map((r) => {
              const selected = result === r;
              const tipId = `tex-tip-${sample.id}-${r}`;
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
                    onFocus={() => setHovered(r)}
                    onBlur={() => setHovered((h) => (h === r ? null : h))}
                    onClick={() =>
                      onPatch(selected ? { texture_result: null, boudin_form: null } : { texture_result: r })
                    }
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
                      {TEXTURE_SHORT[r]}
                    </span>
                  </button>
                  <TextureChoiceTooltip variant={hovered === r ? r : null} id={tipId} align="right" clamp />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forme du boudin → teneur en argile */}
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 pt-2.5 border-t border-[hsl(var(--ds-forest))]/15 flex flex-wrap items-center gap-2">
              <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/60">
                Forme du boudin
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BOUDIN_FORMS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={form === f.id}
                    onClick={() => onPatch({ boudin_form: form === f.id ? null : f.id })}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
                      form === f.id
                        ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/20 text-[hsl(var(--ds-forest-deep))]'
                        : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 text-[hsl(var(--ds-forest-deep))]/75 hover:border-[hsl(var(--ds-gold))]/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {form && (
                <span className="text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/75">
                  → {BOUDIN_FORM_MAP[form].clay}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
