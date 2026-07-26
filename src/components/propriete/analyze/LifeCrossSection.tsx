import React from 'react';
import { motion } from 'framer-motion';
import { LIFE_CLASS_MAP, type LifeClassId, type LifeSignId } from './lifeTests';

/**
 * Hero de la Vie du sol : une coupe de terre dont la densité de vie
 * (vers, galeries, radicelles, micro-faune) et la couleur suivent
 * l'indice de vie moyen des prélèvements.
 */
export const LifeCrossSection: React.FC<{
  score: number | null;
  klass: LifeClassId | null;
  signs?: LifeSignId[];
}> = ({ score, klass, signs = [] }) => {
  const cls = klass ? LIFE_CLASS_MAP[klass] : null;
  const s = score ?? 0;
  const density = Math.max(0.12, Math.min(s / 100, 1));
  const worms = klass === null ? 1 : Math.max(1, Math.round(density * 5));
  const galleries = Math.max(1, Math.round(density * 4));
  const critters = Math.max(0, Math.round(density * 6));
  const color = cls?.color ?? 'hsl(var(--ds-forest))';

  return (
    <svg viewBox="0 0 400 175" className="w-full h-full" role="img" aria-label="Coupe de sol vivante">
      <defs>
        <linearGradient id="lifeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--ds-cream))" />
          <stop offset="100%" stopColor="#e9e3d2" />
        </linearGradient>
        <linearGradient id="lifeSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b5231" />
          <stop offset="60%" stopColor="#7d6238" />
          <stop offset="100%" stopColor="#5a4426" />
        </linearGradient>
        <radialGradient id="lifeGlow" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity={0.28 * density + 0.06} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="175" fill="url(#lifeSky)" />

      {/* litière + couvert végétal */}
      <g opacity={0.5 + density * 0.5}>
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.path
            key={i}
            d={`M${14 + i * 24} 58 c-3 -${10 + (i % 4) * 5} 6 -${16 + (i % 3) * 6} 4 -${22 + (i % 5) * 4}`}
            stroke="#6b9a3b"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            animate={{ rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: `${14 + i * 24}px 58px` }}
          />
        ))}
      </g>

      {/* sol */}
      <path d="M0 58 h400 v117 H0 Z" fill="url(#lifeSoil)" />
      <rect y="58" width="400" height="117" fill="url(#lifeGlow)" />
      <path d="M0 58 h400" stroke="#3b2e1a" strokeOpacity="0.5" strokeWidth="2" />

      {/* horizon d'humus */}
      <motion.path
        d="M0 74 q40 -6 80 0 t80 0 t80 0 t80 0 t80 0 V58 H0 Z"
        fill="#3f3120"
        animate={{ opacity: [0.35 + density * 0.35, 0.5 + density * 0.35, 0.35 + density * 0.35] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* galeries */}
      {Array.from({ length: galleries }).map((_, i) => (
        <motion.path
          key={`g${i}`}
          d={`M${50 + i * 88} 60 c${i % 2 ? 14 : -14} 26 ${i % 2 ? -10 : 12} 42 ${i % 2 ? 4 : -6} 66`}
          stroke="#2f2415"
          strokeWidth={5 - i * 0.4}
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
        />
      ))}

      {/* racines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <path
          key={`r${i}`}
          d={`M${34 + i * 62} 58 c${i % 2 ? 6 : -6} 20 ${i % 2 ? -8 : 8} 34 ${i % 2 ? 2 : -4} ${48 + (i % 3) * 14}`}
          stroke="#cbbf9a"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.35 + density * 0.5}
        />
      ))}

      {/* vers de terre animés */}
      {Array.from({ length: worms }).map((_, i) => {
        const x = 40 + i * (320 / Math.max(worms, 1));
        const y = 96 + (i % 3) * 22;
        return (
          <motion.path
            key={`w${i}`}
            d={`M${x} ${y} c8 -7 16 7 24 0 s16 -7 24 0`}
            stroke="#d1806e"
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
            animate={{ x: [0, 9, 0], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.6 + (i % 3) * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
          />
        );
      })}

      {/* micro-faune */}
      {Array.from({ length: critters }).map((_, i) => (
        <motion.circle
          key={`c${i}`}
          cx={30 + i * 58}
          cy={82 + (i % 4) * 20}
          r={2.4}
          fill="#e3dcc4"
          animate={{ cx: [30 + i * 58, 38 + i * 58, 30 + i * 58], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.6 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* mycélium si coché */}
      {signs.includes('mycelium') && (
        <g opacity="0.7">
          {Array.from({ length: 5 }).map((_, i) => (
            <path
              key={`m${i}`}
              d={`M${60 + i * 70} 66 c-16 8 -22 20 -12 30 M${60 + i * 70} 66 c16 6 24 18 14 28`}
              stroke="#e8e2f1"
              strokeWidth="1"
              fill="none"
            />
          ))}
        </g>
      )}

      {/* jauge de vitalité */}
      <g transform="translate(20,150)">
        <rect width="200" height="7" rx="3.5" fill="#2f2415" opacity="0.35" />
        <motion.rect
          height="7"
          rx="3.5"
          fill={color}
          initial={{ width: 0 }}
          animate={{ width: 200 * density }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </g>

      <text x="20" y="140" fontSize="9" fontWeight="bold" letterSpacing="2.4" fill="hsl(var(--ds-cream))" opacity="0.85">
        {(cls?.label ?? 'INDICE DE VIE').toUpperCase()}
      </text>
      {score != null && (
        <text x="232" y="159" fontSize="13" fill="hsl(var(--ds-cream))" fontStyle="italic">
          {Math.round(score)} / 100
        </text>
      )}
      {cls && (
        <text x="398" y="140" fontSize="9" textAnchor="end" fill="hsl(var(--ds-cream))" opacity="0.75">
          {cls.verb}
        </text>
      )}
    </svg>
  );
};
