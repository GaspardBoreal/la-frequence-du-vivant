import React from 'react';
import { motion } from 'framer-motion';

// Palette D.S. — trait sépia sur crème, remplissage vert forêt / or
const SEPIA = '#3a2f28';
const FOREST = '#2f5d3a';
const GOLD = '#c9a24b';
const CREAM = '#f7f3ea';

interface LeafProps {
  active?: boolean;
  size?: number;
}

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.9, delay: 0.05 * i, ease: 'easeInOut' as const },
  }),
};

const Wrap: React.FC<{ size: number; active?: boolean; children: React.ReactNode }> = ({
  size,
  active,
  children,
}) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    style={{
      color: active ? FOREST : SEPIA,
      filter: active ? `drop-shadow(0 2px 6px ${FOREST}55)` : undefined,
    }}
  >
    <rect x={0} y={0} width={64} height={64} rx={8} fill={active ? `${FOREST}12` : `${CREAM}00`} />
    {children}
  </motion.svg>
);

/** Feuille dentelée (herbacée / ortie) */
export const LeafHerbacee: React.FC<LeafProps> = ({ active, size = 56 }) => (
  <Wrap size={size} active={active}>
    <motion.path
      variants={draw}
      d="M32 52 C 22 44, 18 30, 32 12 C 46 30, 42 44, 32 52 Z"
      stroke="currentColor"
      strokeWidth={1.6}
      fill={active ? `${FOREST}30` : 'none'}
      strokeLinejoin="round"
    />
    <motion.path variants={draw} custom={1} d="M32 12 L32 50" stroke="currentColor" strokeWidth={1.2} />
    <motion.path variants={draw} custom={2} d="M32 22 L26 26 M32 22 L38 26 M32 32 L24 36 M32 32 L40 36 M32 42 L27 45 M32 42 L37 45" stroke="currentColor" strokeWidth={1} />
  </Wrap>
);

/** Feuille arbuste (aubépine, noisetier) */
export const LeafArbuste: React.FC<LeafProps> = ({ active, size = 56 }) => (
  <Wrap size={size} active={active}>
    <motion.path
      variants={draw}
      d="M14 40 C 20 20, 44 20, 50 40 C 44 46, 20 46, 14 40 Z"
      stroke="currentColor"
      strokeWidth={1.6}
      fill={active ? `${FOREST}30` : 'none'}
      strokeLinejoin="round"
    />
    <motion.path variants={draw} custom={1} d="M14 40 L50 40" stroke="currentColor" strokeWidth={1.2} />
    <motion.circle variants={draw} custom={2} cx={22} cy={48} r={2.5} fill={GOLD} stroke={SEPIA} strokeWidth={0.6} />
    <motion.circle variants={draw} custom={3} cx={32} cy={50} r={2.5} fill={GOLD} stroke={SEPIA} strokeWidth={0.6} />
    <motion.circle variants={draw} custom={4} cx={42} cy={48} r={2.5} fill={GOLD} stroke={SEPIA} strokeWidth={0.6} />
  </Wrap>
);

/** Vrille / liane */
export const LeafLiane: React.FC<LeafProps> = ({ active, size = 56 }) => (
  <Wrap size={size} active={active}>
    <motion.path
      variants={draw}
      d="M12 50 C 20 42, 20 30, 28 26 C 36 22, 40 30, 44 22 C 48 14, 54 18, 52 26 C 50 34, 42 38, 46 46"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
    />
    <motion.path
      variants={draw}
      custom={1}
      d="M30 20 C 34 14, 40 14, 42 20 C 40 24, 34 24, 30 20 Z"
      stroke="currentColor"
      strokeWidth={1.2}
      fill={active ? `${FOREST}30` : 'none'}
    />
  </Wrap>
);

/** Arbre (chêne) */
export const LeafArbre: React.FC<LeafProps> = ({ active, size = 56 }) => (
  <Wrap size={size} active={active}>
    <motion.path
      variants={draw}
      d="M32 8 C 42 12, 48 22, 46 32 C 52 34, 52 44, 44 46 C 44 52, 34 54, 32 50 C 30 54, 20 52, 20 46 C 12 44, 12 34, 18 32 C 16 22, 22 12, 32 8 Z"
      stroke="currentColor"
      strokeWidth={1.6}
      fill={active ? `${FOREST}30` : 'none'}
      strokeLinejoin="round"
    />
    <motion.path variants={draw} custom={1} d="M32 30 L32 58" stroke={SEPIA} strokeWidth={1.4} />
  </Wrap>
);

export const FamilyIcon: React.FC<{ family: 'herbacee' | 'arbuste' | 'liane' | 'arbre'; active?: boolean; size?: number }> = ({
  family,
  active,
  size,
}) => {
  const Cmp =
    family === 'herbacee' ? LeafHerbacee :
    family === 'arbuste' ? LeafArbuste :
    family === 'liane' ? LeafLiane :
    LeafArbre;
  return <Cmp active={active} size={size} />;
};

/** Anneau ICG animé (Indice de Cohérence Globale) */
export const IcgRing: React.FC<{ value: number; size?: number }> = ({ value, size = 128 }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const tone = clamped >= 75 ? FOREST : clamped >= 50 ? GOLD : '#b95c3a';

  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <defs>
        <linearGradient id="icg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone} />
          <stop offset="100%" stopColor={FOREST} />
        </linearGradient>
      </defs>
      <circle cx={64} cy={64} r={r} stroke={`${SEPIA}22`} strokeWidth={8} fill="none" />
      <motion.circle
        cx={64}
        cy={64}
        r={r}
        stroke="url(#icg-grad)"
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        initial={{ strokeDasharray: c, strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      <text
        x={64}
        y={62}
        textAnchor="middle"
        fontFamily="serif"
        fontStyle="italic"
        fontSize={34}
        fill={FOREST}
      >
        {clamped}
      </text>
      <text
        x={64}
        y={82}
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize={9}
        letterSpacing={3}
        fill={`${SEPIA}99`}
      >
        ICG / 100
      </text>
    </svg>
  );
};
