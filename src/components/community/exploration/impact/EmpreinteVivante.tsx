import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface EmpreinteVivanteProps {
  /** Stats driving the 4 rings */
  photos: number;
  audios: number;
  textes: number;
  temoignages: number;
  /** Sensitivity dots */
  bioCount: number;
  auxCount: number;
  eeeCount: number;
  /** Visual size in px */
  size?: number;
  /** Reduce motion (no pulses) */
  reducedMotion?: boolean;
}

/**
 * SVG of 4 concentric pulsing rings = the marcheur's living signature.
 * Ring thickness scales with contribution volume in that dimension.
 * Sensitivity dots orbit on the outermost ring.
 */
const EmpreinteVivante: React.FC<EmpreinteVivanteProps> = ({
  photos, audios, textes, temoignages,
  bioCount, auxCount, eeeCount,
  size = 220,
  reducedMotion = false,
}) => {
  const cx = size / 2;
  const cy = size / 2;

  // Map count -> stroke width (1 to 10 px)
  const strokeFor = (n: number) => Math.min(1 + Math.log2(n + 1) * 1.6, 10);

  const rings = [
    { r: size * 0.14, w: strokeFor(photos),       color: 'hsl(199 89% 60%)', label: 'photos',     pulse: photos > 0 ? 2.4 : 0 }, // sky
    { r: size * 0.22, w: strokeFor(audios),       color: 'hsl(265 80% 65%)', label: 'audios',     pulse: audios > 0 ? 3.0 : 0 }, // purple
    { r: size * 0.30, w: strokeFor(textes),       color: 'hsl(39 92% 60%)',  label: 'textes',     pulse: textes > 0 ? 3.6 : 0 }, // amber
    { r: size * 0.38, w: strokeFor(temoignages),  color: 'hsl(347 80% 62%)', label: 'temoign.',   pulse: temoignages > 0 ? 4.2 : 0 }, // rose
  ];

  const sensitivityRadius = size * 0.46;
  const sensitivityDots = useMemo(() => {
    const dots: { color: string; angle: number; key: string; alert?: boolean }[] = [];
    const palette = {
      bio: 'hsl(150 70% 50%)',     // emerald
      aux: 'hsl(45 92% 55%)',      // gold
      eee: 'hsl(0 80% 60%)',       // red
    };
    const cap = 12;
    const counts = [
      { color: palette.bio, n: Math.min(bioCount, cap) },
      { color: palette.aux, n: Math.min(auxCount, cap) },
      { color: palette.eee, n: Math.min(eeeCount, cap), alert: true },
    ];
    const total = counts.reduce((s, c) => s + c.n, 0);
    if (total === 0) return dots;
    let i = 0;
    counts.forEach(({ color, n, alert }) => {
      for (let k = 0; k < n; k++) {
        const angle = (i / total) * Math.PI * 2;
        dots.push({ color, angle, key: `${color}-${k}`, alert });
        i++;
      }
    });
    return dots;
  }, [bioCount, auxCount, eeeCount]);

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Soft halo */}
        <defs>
          <radialGradient id="empreinte-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(150 70% 50% / 0.25)" />
            <stop offset="60%" stopColor="hsl(150 70% 50% / 0.05)" />
            <stop offset="100%" stopColor="hsl(150 70% 50% / 0)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={size * 0.48} fill="url(#empreinte-halo)" />

        {rings.map((ring, idx) => (
          <motion.circle
            key={ring.label}
            cx={cx} cy={cy} r={ring.r}
            fill="none"
            stroke={ring.color}
            strokeWidth={ring.w}
            strokeLinecap="round"
            opacity={ring.w <= 1.1 ? 0.25 : 0.85}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={
              reducedMotion || ring.pulse === 0
                ? { scale: 1, opacity: ring.w <= 1.1 ? 0.25 : 0.85 }
                : { scale: [1, 1.03, 1], opacity: [0.65, 0.95, 0.65] }
            }
            transition={
              reducedMotion || ring.pulse === 0
                ? { duration: 0.6, delay: idx * 0.12 }
                : { duration: ring.pulse, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2 }
            }
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}

        {/* Sensitivity dots on outermost orbit */}
        {sensitivityDots.map(({ color, angle, key, alert }) => {
          const x = cx + Math.cos(angle) * sensitivityRadius;
          const y = cy + Math.sin(angle) * sensitivityRadius;
          return (
            <motion.circle
              key={key}
              cx={x} cy={y} r={3.5}
              fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                reducedMotion
                  ? { opacity: 1, scale: 1 }
                  : alert
                    ? { opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }
                    : { opacity: 1, scale: [0.9, 1.1, 0.9] }
              }
              transition={
                reducedMotion
                  ? { duration: 0.4 }
                  : alert
                    ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              }
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          );
        })}

        {/* Center pulse */}
        <motion.circle
          cx={cx} cy={cy} r={4}
          fill="hsl(150 70% 60%)"
          animate={reducedMotion ? {} : { scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px`, filter: 'drop-shadow(0 0 8px hsl(150 70% 60%))' }}
        />
      </svg>
    </div>
  );
};

export default EmpreinteVivante;
