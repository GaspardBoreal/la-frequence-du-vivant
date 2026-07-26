import React from 'react';
import { motion } from 'framer-motion';
import type { LifeSignId, LifeTestId } from './lifeTests';

const S = 34;
const base = { width: S, height: S, viewBox: '0 0 34 34', fill: 'none' } as const;

/* ------------------------------------------------------------------ */
/* Pictos par indice de vie                                            */
/* ------------------------------------------------------------------ */

const Worm: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <path
      d="M5 24c3-5 6 2 9-3s5 3 8-2 4-6 6-6"
      stroke={c}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <circle cx="28.5" cy="12.6" r="1.1" fill={c} />
  </svg>
);

const Galleries: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <path d="M3 9h28" stroke={c} strokeWidth="1.5" opacity="0.45" />
    <path d="M9 9c0 6-4 7-4 12" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M20 9c1 5 5 6 5 13" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M11 20c4-3 8-2 11 1" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    <path d="M13 9c1.2-3 4.5-3 5.6 0" fill={c} opacity="0.75" />
  </svg>
);

const Roots: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <path d="M17 5v9" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
    <path
      d="M17 14c-3 3-4 6-4 12M17 14c3 3 4.5 5 5 12M17 14c-1 4-1 8-1 12"
      stroke={c}
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path d="M12 20c-2 1-3 3-3 5M22 20c2 1 3 3 3 5" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const Microfauna: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <ellipse cx="13" cy="18" rx="6" ry="4.4" stroke={c} strokeWidth="2.2" />
    <path d="M8 15l-3-2M8 21l-3 2M18 15l3-2M18 21l3 2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="26" cy="10" r="2.6" stroke={c} strokeWidth="1.8" />
    <path d="M26 13v3M24 10h-2.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const Mycelium: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <path
      d="M5 22c5-1 7-6 12-6s7 4 12 3M8 27c3-4 5-8 4-13M24 28c-2-5-2-10 1-14"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="17" cy="16" r="2" fill={c} opacity="0.8" />
    <circle cx="10" cy="14" r="1.2" fill={c} opacity="0.6" />
    <circle cx="25" cy="14" r="1.2" fill={c} opacity="0.6" />
  </svg>
);

const OrganicMatter: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <path d="M4 25h26" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M8 21c3-4 8-4 10 0" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 13c4-3 8-1 8 3-3 2-7 1-8-3z" fill={c} opacity="0.75" />
    <path d="M6 17c2-2 5-2 6 0" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    <path d="M21 21c2-3 5-3 7-1" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const Smell: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <path d="M6 26c4 0 6-3 6-7 0-5 4-8 8-7" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M20 8c2 2 4 2 6 0M20 13c2 2 5 2 7 0M21 18c2 2 4 2 6 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
  </svg>
);

const Fizz: React.FC<{ c: string }> = ({ c }) => (
  <svg {...base} aria-hidden>
    <path d="M9 20h16l-2 8H11l-2-8z" stroke={c} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="14" cy="14" r="2" stroke={c} strokeWidth="1.6" />
    <circle cx="20" cy="10" r="1.5" stroke={c} strokeWidth="1.5" />
    <circle cx="24" cy="15" r="1.1" fill={c} opacity="0.8" />
    <circle cx="11" cy="9" r="1" fill={c} opacity="0.6" />
  </svg>
);

export const LifeSignIcon: React.FC<{ id: LifeSignId; color?: string }> = ({ id, color }) => {
  const c = color ?? 'hsl(var(--ds-forest))';
  switch (id) {
    case 'vers':
      return <Worm c={c} />;
    case 'galeries':
      return <Galleries c={c} />;
    case 'racines':
      return <Roots c={c} />;
    case 'microfaune':
      return <Microfauna c={c} />;
    case 'mycelium':
      return <Mycelium c={c} />;
    case 'matiere_organique':
      return <OrganicMatter c={c} />;
    case 'odeur_humus':
      return <Smell c={c} />;
    case 'effervescence':
      return <Fizz c={c} />;
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Schémas animés des protocoles                                       */
/* ------------------------------------------------------------------ */

const FOREST = 'hsl(var(--ds-forest))';
const DEEP = 'hsl(var(--ds-forest-deep))';
const GOLD = 'hsl(var(--ds-gold))';

const SchemaFrame: React.FC<{ children: React.ReactNode; caption: string }> = ({
  children,
  caption,
}) => (
  <svg viewBox="0 0 200 110" className="w-full h-full" role="img" aria-label={caption}>
    <rect width="200" height="110" fill="hsl(var(--ds-cream))" />
    {children}
    <text x="100" y="104" textAnchor="middle" fontSize="7" fill={DEEP} opacity="0.6">
      {caption}
    </text>
  </svg>
);

const BecheVivanteSchema: React.FC = () => (
  <SchemaFrame caption="Bloc 20 × 20 × 20 cm émietté sur bâche · 5 min de tri">
    {/* bâche */}
    <path d="M20 78 L180 78 L168 92 L32 92 Z" fill={FOREST} opacity="0.1" stroke={FOREST} strokeOpacity="0.35" />
    {/* cube de terre */}
    <g>
      <path d="M62 34 L104 26 L138 40 L96 50 Z" fill="#8a6a3f" opacity="0.85" />
      <path d="M62 34 L96 50 L96 74 L62 60 Z" fill="#6f5330" />
      <path d="M96 50 L138 40 L138 64 L96 74 Z" fill="#5c4426" />
      {/* cotes */}
      <path d="M56 34 L56 60" stroke={GOLD} strokeWidth="1" />
      <text x="46" y="50" fontSize="7" fill={GOLD}>20</text>
      <path d="M62 66 L96 82" stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" />
    </g>
    {/* vers qui ondulent */}
    {[0, 1, 2].map((i) => (
      <motion.path
        key={i}
        d={`M${46 + i * 42} 86 c4 -4 8 4 12 0 s8 -4 12 0`}
        stroke="#c96a5a"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        animate={{ pathLength: [0.4, 1, 0.4], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
    {/* main / loupe */}
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="158" cy="30" r="11" stroke={FOREST} strokeWidth="2" fill="none" />
      <path d="M166 38 L176 48" stroke={FOREST} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="155" cy="28" r="2" fill="#c96a5a" />
      <circle cx="161" cy="33" r="1.4" fill={FOREST} opacity="0.6" />
    </motion.g>
  </SchemaFrame>
);

const VinaigreSchema: React.FC = () => (
  <SchemaFrame caption="Quelques gouttes de vinaigre blanc · mousse = calcaire actif">
    {/* coupelle */}
    <path d="M62 62 L138 62 L128 86 L72 86 Z" fill={FOREST} opacity="0.12" stroke={FOREST} strokeOpacity="0.4" strokeWidth="1.5" />
    {/* motte */}
    <path d="M84 62 c2 -12 30 -12 32 0 z" fill="#7a5c33" />
    {/* flacon */}
    <g>
      <rect x="30" y="18" width="18" height="26" rx="3" fill={GOLD} opacity="0.25" stroke={GOLD} strokeWidth="1.4" />
      <rect x="35" y="12" width="8" height="7" rx="2" fill={GOLD} opacity="0.6" />
      <path d="M48 40 L64 50" stroke={GOLD} strokeWidth="1.4" strokeDasharray="3 3" />
    </g>
    {/* gouttes */}
    {[0, 1].map((i) => (
      <motion.circle
        key={i}
        cx={72 + i * 6}
        cy={48}
        r="2.2"
        fill={GOLD}
        animate={{ cy: [44, 58], opacity: [1, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.5 }}
      />
    ))}
    {/* bulles d'effervescence */}
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.circle
        key={`b${i}`}
        cx={88 + i * 6}
        cy={54}
        r={1.2 + (i % 3) * 0.5}
        fill="#d99a2b"
        animate={{ cy: [56, 30], opacity: [0.9, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.28 }}
      />
    ))}
    <text x="150" y="40" fontSize="8" fill="#d99a2b" fontWeight="bold">CO₂</text>
    <text x="146" y="52" fontSize="6.5" fill={DEEP} opacity="0.65">ça pétille</text>
  </SchemaFrame>
);

const SachetSchema: React.FC = () => (
  <SchemaFrame caption="Sachet enterré à 8 cm · relevé après 6 à 8 semaines">
    <rect x="10" y="46" width="180" height="40" fill="#8a6a3f" opacity="0.22" />
    <path d="M10 46 h180" stroke={FOREST} strokeWidth="1.5" strokeOpacity="0.5" />
    {/* piquet */}
    <path d="M52 20 L52 60" stroke={FOREST} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M52 22 L70 26 L52 32" fill={GOLD} opacity="0.7" />
    {/* sachet intact */}
    <g>
      <rect x="40" y="60" width="20" height="16" rx="2" fill="hsl(var(--ds-cream))" stroke={FOREST} strokeWidth="1.4" />
      <path d="M50 60 L50 50" stroke={FOREST} strokeWidth="1" />
      <text x="50" y="86" fontSize="6.5" textAnchor="middle" fill={DEEP} opacity="0.7">J0</text>
    </g>
    {/* flèche temps */}
    <motion.path
      d="M74 68 L120 68"
      stroke={GOLD}
      strokeWidth="1.6"
      strokeDasharray="4 3"
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <path d="M118 65 L124 68 L118 71" fill={GOLD} />
    {/* sachet dégradé */}
    <g>
      <motion.rect
        x="136"
        y="60"
        width="20"
        height="16"
        rx="2"
        fill="hsl(var(--ds-cream))"
        stroke={FOREST}
        strokeWidth="1.4"
        strokeDasharray="3 4"
        animate={{ strokeOpacity: [1, 0.35, 1] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <path d="M139 66 c4 4 10 -4 14 2" stroke="#c96a5a" strokeWidth="1.4" fill="none" />
      <text x="146" y="86" fontSize="6.5" textAnchor="middle" fill={DEEP} opacity="0.7">+8 sem.</text>
    </g>
  </SchemaFrame>
);

export const LifeTestSchema: React.FC<{ id: LifeTestId }> = ({ id }) => {
  if (id === 'beche_vivante') return <BecheVivanteSchema />;
  if (id === 'vinaigre') return <VinaigreSchema />;
  return <SachetSchema />;
};
