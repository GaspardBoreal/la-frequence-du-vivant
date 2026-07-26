import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scale } from 'lucide-react';
import {
  READING,
  RESULT_ORDER,
  RESULT_SHORT,
  TEST_LABELS,
  type StructureResultId,
  type StructureTestId,
} from './structureTests';

const COLORS: Record<StructureResultId, string> = {
  compacte: 'hsl(var(--ds-gold))',
  grumeleuse: 'hsl(var(--ds-forest))',
  particulaire: 'hsl(var(--ds-forest-deep))',
};

export const StructureResultsSummary: React.FC<{
  counts: Record<StructureResultId, number>;
  filled: number;
  total: number;
  dominant: StructureResultId | null;
  contrasted: boolean;
  testCounts: Record<StructureTestId, number>;
}> = ({ counts, filled, total, dominant, contrasted, testCounts }) => (
  <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
      <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
        <Scale className="w-3 h-3" /> Synthèse des prélèvements
      </div>
      <span className="text-[11px] text-[hsl(var(--ds-forest-deep))]/75">
        <span className="font-semibold">{filled}</span> / {total} renseignés
      </span>
    </div>

    {/* Barre de répartition */}
    <div className="h-3 w-full rounded-full overflow-hidden bg-[hsl(var(--ds-forest))]/10 flex">
      {RESULT_ORDER.map((r) =>
        counts[r] > 0 ? (
          <motion.div
            key={r}
            initial={{ width: 0 }}
            animate={{ width: `${(counts[r] / Math.max(filled, 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: COLORS[r] }}
            title={`${RESULT_SHORT[r]} : ${counts[r]}`}
          />
        ) : null
      )}
    </div>

    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {RESULT_ORDER.map((r) => (
        <span key={r} className="inline-flex items-center gap-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/80">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[r] }} />
          {RESULT_SHORT[r]} · <span className="font-semibold">{counts[r]}</span>
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
          {contrasted ? 'Sol contrasté · dominante' : 'Structure dominante'}
        </div>
        <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] mt-0.5">
          {RESULT_SHORT[dominant]}
        </div>
        <p className="mt-1 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
          {READING[dominant]}
          {contrasted && ' Les résultats diffèrent selon les points : traiter la propriété par zones.'}
        </p>
      </motion.div>
    )}

    {(testCounts.beche > 0 || testCounts.stabilite > 0) && (
      <div className="mt-2.5 flex flex-wrap gap-2">
        {(['beche', 'stabilite'] as StructureTestId[]).map((t) =>
          testCounts[t] > 0 ? (
            <span
              key={t}
              className="rounded-full bg-[hsl(var(--ds-forest))]/10 px-2.5 py-0.5 text-[10px] text-[hsl(var(--ds-forest-deep))]/85"
            >
              {TEST_LABELS[t]} · <span className="font-semibold">{testCounts[t]}</span>
            </span>
          ) : null
        )}
      </div>
    )}
  </div>
);
