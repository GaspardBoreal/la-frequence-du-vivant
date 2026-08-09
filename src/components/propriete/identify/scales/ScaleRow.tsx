import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  GAP_LABEL,
  GAP_TOKEN,
  type ScaleReading,
} from '@/lib/soilFloraScales';

const STEPS = [1, 2, 3, 4, 5] as const;

/** Position en % du centre du cran n (1..5) sur la piste */
const pos = (n: number) => ((n - 0.5) / 5) * 100;

/**
 * Une échelle qualitative à 5 crans, deux repères : le sol et la flore.
 * Le segment entre les deux dit l'écart, sans chiffre.
 */
export const ScaleRow: React.FC<{
  reading: ScaleReading;
  delay?: number;
  print?: boolean;
}> = ({ reading, delay = 0, print = false }) => {
  const reduce = useReducedMotion();
  const animate = !print && !reduce;
  const { axis, soil, flora, gap, word } = reading;
  const gapToken = GAP_TOKEN[gap];

  const from = soil != null && flora != null ? Math.min(soil, flora) : null;
  const to = soil != null && flora != null ? Math.max(soil, flora) : null;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className="soil-flora-scale-row py-3 first:pt-0 last:pb-0"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: `hsl(var(${axis.token}))` }}
        >
          {axis.label}
        </span>
        {word && (
          <span className="text-[12.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
            {word}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2.5">
        <span className="hidden sm:block w-[74px] shrink-0 text-right text-[10.5px] leading-tight text-[hsl(var(--ds-forest-deep))]/55">
          {axis.left}
        </span>

        <div className="relative flex-1 min-w-0">
          {/* Piste à 5 crans */}
          <div className="flex gap-[3px]" aria-hidden>
            {STEPS.map((s) => {
              const active = flora === s || soil === s;
              return (
                <div
                  key={s}
                  className="h-[9px] flex-1 rounded-full"
                  style={{
                    background: `hsl(var(${axis.token}) / ${active ? 0.4 : 0.14})`,
                  }}
                />
              );
            })}
          </div>

          {/* Segment d'écart entre les deux voix */}
          {from != null && to != null && to > from && (
            <motion.div
              initial={animate ? { scaleX: 0 } : false}
              animate={animate ? { scaleX: 1 } : undefined}
              transition={{ duration: 0.5, delay: delay + 0.15, ease: 'easeOut' }}
              className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full origin-left"
              style={{
                left: `${pos(from)}%`,
                width: `${pos(to) - pos(from)}%`,
                background: `hsl(var(${gapToken}) / 0.55)`,
              }}
            />
          )}

          {/* Repère du sol */}
          {soil != null && (
            <motion.span
              initial={animate ? { scale: 0, opacity: 0 } : false}
              animate={animate ? { scale: 1, opacity: 1 } : undefined}
              transition={{ type: 'spring', stiffness: 420, damping: 24, delay: delay + 0.1 }}
              className="absolute top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[hsl(var(--ds-cream))]"
              style={{ left: `${pos(soil)}%`, background: 'hsl(var(--ds-mineral))' }}
              title={`Le sol : ${axis.steps[soil - 1]}`}
            />
          )}

          {/* Repère de la flore */}
          {flora != null && (
            <motion.span
              initial={animate ? { scale: 0, opacity: 0 } : false}
              animate={animate ? { scale: 1, opacity: 1 } : undefined}
              transition={{ type: 'spring', stiffness: 420, damping: 24, delay: delay + 0.18 }}
              className="absolute top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-[11px]"
              style={{
                left: `${pos(flora)}%`,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '9px solid hsl(var(--ds-chloro))',
              }}
              title={`La flore : ${axis.steps[flora - 1]}`}
            />
          )}

          {/* Repère sol absent : pointillé au centre */}
          {soil == null && (
            <span
              className="absolute top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
              style={{
                left: '50%',
                borderColor: 'hsl(var(--ds-mineral) / 0.6)',
              }}
              title="Le sol n’est pas encore renseigné"
            />
          )}
        </div>

        <span className="hidden sm:block w-[74px] shrink-0 text-[10.5px] leading-tight text-[hsl(var(--ds-forest-deep))]/55">
          {axis.right}
        </span>
      </div>

      {/* Bornes en mobile */}
      <div className="mt-1 flex justify-between sm:hidden text-[10px] text-[hsl(var(--ds-forest-deep))]/55">
        <span>{axis.left}</span>
        <span>{axis.right}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className="inline-block h-[6px] w-[6px] rounded-full"
          style={{ background: `hsl(var(${gapToken}))` }}
        />
        <span className="text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/60">
          {GAP_LABEL[gap]}
        </span>
      </div>
    </motion.div>
  );
};
