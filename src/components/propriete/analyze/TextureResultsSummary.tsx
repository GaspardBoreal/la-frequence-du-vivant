import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scale } from 'lucide-react';
import {
  BOUDIN_FORM_MAP,
  TEXTURE_LABELS,
  TEXTURE_ORDER,
  TEXTURE_READING,
  TEXTURE_SHORT,
  TEXTURE_TEST_LABELS,
  type BoudinFormId,
  type TextureResultId,
  type TextureTestId,
} from './textureTests';

const COLORS: Record<TextureResultId, string> = {
  sable: 'hsl(var(--ds-gold))',
  limon: 'hsl(var(--ds-forest))',
  argile: 'hsl(var(--ds-forest-deep))',
};

export const TextureResultsSummary: React.FC<{
  counts: Record<TextureResultId, number>;
  filled: number;
  total: number;
  dominant: TextureResultId | null;
  contrasted: boolean;
  testCounts: Record<TextureTestId, number>;
  formCounts: Record<BoudinFormId, number>;
}> = ({ counts, filled, total, dominant, contrasted, testCounts, formCounts }) => (
  <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
      <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
        <Scale className="w-3 h-3" /> Synthèse des textures
      </div>
      <span className="text-[11px] text-[hsl(var(--ds-forest-deep))]/75">
        <span className="font-semibold">{filled}</span> / {total} renseignés
      </span>
    </div>

    <div className="h-3 w-full rounded-full overflow-hidden bg-[hsl(var(--ds-forest))]/10 flex">
      {TEXTURE_ORDER.map((r) =>
        counts[r] > 0 ? (
          <motion.div
            key={r}
            initial={{ width: 0 }}
            animate={{ width: `${(counts[r] / Math.max(filled, 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: COLORS[r] }}
            title={`${TEXTURE_SHORT[r]} : ${counts[r]}`}
          />
        ) : null
      )}
    </div>

    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {TEXTURE_ORDER.map((r) => (
        <span
          key={r}
          className="inline-flex items-center gap-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/80"
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[r] }} />
          {TEXTURE_SHORT[r]} · <span className="font-semibold">{counts[r]}</span>
        </span>
      ))}
    </div>

    {dominant && (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-xl border border-[hsl(var(--ds-forest))]/30 bg-[hsl(var(--ds-forest))]/[0.07] p-3"
      >
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))]">
          <Sparkles className="w-3 h-3" />
          {contrasted ? 'Textures contrastées · dominante' : 'Texture dominante'}
        </div>
        <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] mt-0.5">
          {TEXTURE_LABELS[dominant]}
        </div>
        <p className="mt-1 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
          {TEXTURE_READING[dominant]}
          {contrasted && ' Les textures diffèrent selon les points : raisonner la palette par zones.'}
        </p>
      </motion.div>
    )}

    <div className="mt-2.5 flex flex-wrap gap-2">
      {(['boudin', 'sedimentation'] as TextureTestId[]).map((t) =>
        testCounts[t] > 0 ? (
          <span
            key={t}
            className="rounded-full bg-[hsl(var(--ds-forest))]/10 px-2.5 py-0.5 text-[10px] text-[hsl(var(--ds-forest-deep))]/85"
          >
            {TEXTURE_TEST_LABELS[t]} · <span className="font-semibold">{testCounts[t]}</span>
          </span>
        ) : null
      )}
      {(Object.keys(formCounts) as BoudinFormId[]).map((f) =>
        formCounts[f] > 0 ? (
          <span
            key={f}
            className="rounded-full bg-[hsl(var(--ds-gold))]/18 px-2.5 py-0.5 text-[10px] text-[hsl(var(--ds-forest-deep))]/85"
          >
            {BOUDIN_FORM_MAP[f].label} ({BOUDIN_FORM_MAP[f].clay}) ·{' '}
            <span className="font-semibold">{formCounts[f]}</span>
          </span>
        ) : null
      )}
    </div>
  </div>
);
