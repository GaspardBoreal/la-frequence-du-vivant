import React from 'react';
import { motion } from 'framer-motion';
import type { SpeciesAbundance } from '@/utils/biodiversityIndices';

interface RankAbundanceCurveProps {
  abundance: SpeciesAbundance[];
  max?: number;
  height?: number;
}

/**
 * Whittaker rank-abundance curve. A flat slope = high evenness, a cliff = a
 * dominant species.
 */
export const RankAbundanceCurve: React.FC<RankAbundanceCurveProps> = ({
  abundance,
  max = 20,
  height = 140,
}) => {
  const data = abundance.slice(0, max);
  if (!data.length) return null;
  const total = data.reduce((s, a) => s + a.n, 0);
  const W = 320;
  const H = height;
  const padX = 8;
  const padY = 14;
  const stepX = (W - 2 * padX) / Math.max(1, data.length - 1);
  const maxN = data[0].n || 1;

  const points = data.map((sp, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - sp.n / maxN) * (H - 2 * padY);
    return { x, y, sp };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
        <line
          x1={padX}
          y1={H - padY}
          x2={W - padX}
          y2={H - padY}
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="hsl(var(--primary))"
            opacity={0.9}
          >
            <title>{`${p.sp.commonName || p.sp.scientificName} — ${p.sp.n} (${((p.sp.n / total) * 100).toFixed(1)}%)`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-2">
        <span>Espèce dominante</span>
        <span>Rang ↗</span>
        <span>Espèces rares</span>
      </div>
    </div>
  );
};

export default RankAbundanceCurve;
