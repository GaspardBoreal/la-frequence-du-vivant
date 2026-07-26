import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scale, AlertTriangle } from 'lucide-react';
import {
  PH_CLASSES,
  PH_CLASS_MAP,
  PH_ORDER,
  PH_TEST_LABELS,
  phPercent,
  type PhAggregate,
  type PhTestId,
} from './phTests';

export const PhResultsSummary: React.FC<{
  agg: PhAggregate;
  total: number;
  testCounts: Record<PhTestId, number>;
}> = ({ agg, total, testCounts }) => {
  const dominant = agg.dominant ? PH_CLASS_MAP[agg.dominant] : null;

  return (
    <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
          <Scale className="w-3 h-3" /> Synthèse des acidités
        </div>
        <span className="text-[11px] text-[hsl(var(--ds-forest-deep))]/75">
          <span className="font-semibold">{agg.filled}</span> / {total} mesurés
        </span>
      </div>

      {/* Distribution par classe */}
      <div className="h-3 w-full rounded-full overflow-hidden bg-[hsl(var(--ds-forest))]/10 flex">
        {PH_ORDER.map((id) =>
          agg.counts[id] > 0 ? (
            <motion.div
              key={id}
              initial={{ width: 0 }}
              animate={{ width: `${(agg.counts[id] / Math.max(agg.filled, 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: PH_CLASS_MAP[id].color }}
              title={`${PH_CLASS_MAP[id].label} : ${agg.counts[id]}`}
            />
          ) : null
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {PH_CLASSES.filter((c) => agg.counts[c.id] > 0).map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/80"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
            {c.label} · <span className="font-semibold">{agg.counts[c.id]}</span>
          </span>
        ))}
      </div>

      {/* Règle pH : min → moyenne → max */}
      {agg.filled > 0 && (
        <div className="mt-3.5">
          <div
            className="relative h-2.5 rounded-full border border-[hsl(var(--ds-line))]"
            style={{
              background:
                'linear-gradient(90deg,#c94a3a 0%,#d97a2b 22%,#e4b64a 44%,#6b9a3b 58%,#3e8074 78%,#2f5d7a 100%)',
            }}
          >
            {agg.min != null && agg.max != null && agg.amplitude > 0 && (
              <div
                className="absolute -top-[3px] h-[16px] rounded-full border-2 border-[hsl(var(--ds-forest-deep))]/45"
                style={{
                  left: `${phPercent(agg.min)}%`,
                  width: `${Math.max(phPercent(agg.max) - phPercent(agg.min), 1)}%`,
                }}
              />
            )}
            {agg.average != null && (
              <motion.span
                layout
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{
                  left: `calc(${phPercent(agg.average)}% - 8px)`,
                  background: dominant?.color ?? 'hsl(var(--ds-forest))',
                }}
              />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/80">
            <span>
              pH moyen{' '}
              <span className="font-serif text-lg" style={{ color: dominant?.color }}>
                {agg.average!.toFixed(1)}
              </span>
            </span>
            <span>
              amplitude <span className="font-semibold">{agg.amplitude.toFixed(1)}</span> pt
            </span>
            <span>
              min <span className="font-semibold">{agg.min!.toFixed(1)}</span> · max{' '}
              <span className="font-semibold">{agg.max!.toFixed(1)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Lecture agronomique */}
      {dominant && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border p-3"
          style={{ borderColor: `${dominant.color}66`, background: `${dominant.color}14` }}
        >
          <div
            className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase"
            style={{ color: dominant.color }}
          >
            <Sparkles className="w-3 h-3" />
            {agg.contrasted ? 'Acidités contrastées · dominante' : 'Acidité dominante'}
          </div>
          <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] mt-0.5">
            {dominant.label} · pH {dominant.range[0].toFixed(1)} – {dominant.range[1].toFixed(1)}
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
            {dominant.nutrients} {dominant.plants}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/75 italic">
            {dominant.advice}
          </p>
        </motion.div>
      )}

      {agg.amplitude > 1 && (
        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-gold))]/[0.1] p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-[1px] text-[hsl(var(--ds-gold))]" />
          <span className="text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
            <span className="font-semibold">Sol contrasté · </span>
            plus d’un point de pH d’écart entre vos prélèvements : raisonner la palette végétale par
            zones plutôt qu’à l’échelle du site.
          </span>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        {(['bandelette', 'phmetre'] as PhTestId[]).map((t) =>
          testCounts[t] > 0 ? (
            <span
              key={t}
              className="rounded-full bg-[hsl(var(--ds-forest))]/10 px-2.5 py-0.5 text-[10px] text-[hsl(var(--ds-forest-deep))]/85"
            >
              {PH_TEST_LABELS[t]} · <span className="font-semibold">{testCounts[t]}</span>
            </span>
          ) : null
        )}
      </div>
    </div>
  );
};
