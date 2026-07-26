import React from 'react';
import { motion } from 'framer-motion';

const stroke = 'hsl(var(--ds-forest-deep))';
const forest = 'hsl(var(--ds-forest))';
const gold = 'hsl(var(--ds-gold))';
const cream = 'hsl(var(--ds-cream))';

/** A · Test de la bêche : bloc prélevé qui chute et se rompt. */
export const SchemaBeche: React.FC = () => (
  <svg viewBox="0 0 200 110" className="w-full h-full" aria-hidden>
    <defs>
      <linearGradient id="sb-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={forest} stopOpacity="0.28" />
        <stop offset="100%" stopColor={stroke} stopOpacity="0.14" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="200" height="110" fill={cream} />
    {/* sol */}
    <path d="M0 84 Q100 78 200 84 L200 110 L0 110 Z" fill="url(#sb-ground)" />
    <path d="M0 84 Q100 78 200 84" stroke={stroke} strokeWidth="1" fill="none" opacity="0.5" />

    {/* bêche */}
    <g>
      <rect x="40" y="18" width="3.5" height="42" rx="1.6" fill={stroke} opacity="0.8" />
      <path d="M33 58 h18 v20 q-9 8 -18 0 z" fill={forest} fillOpacity="0.5" stroke={stroke} strokeWidth="1.2" />
      <rect x="35" y="12" width="14" height="4" rx="2" fill={gold} opacity="0.9" />
    </g>

    {/* bloc en chute */}
    <motion.g
      initial={{ y: -18, opacity: 0.4 }}
      animate={{ y: [-18, 0, -18] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M104 30 h34 v26 h-34 z" fill={forest} fillOpacity="0.42" stroke={stroke} strokeWidth="1.2" />
      <path d="M112 30 v26 M126 30 v26" stroke={stroke} strokeWidth="0.7" opacity="0.5" />
    </motion.g>

    {/* impact + éclats */}
    <motion.g
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="150" cy="82" r="5" fill={forest} fillOpacity="0.5" stroke={stroke} strokeWidth="1" />
      <circle cx="162" cy="79" r="3.4" fill={forest} fillOpacity="0.4" stroke={stroke} strokeWidth="0.9" />
      <circle cx="141" cy="78" r="2.6" fill={forest} fillOpacity="0.35" stroke={stroke} strokeWidth="0.8" />
      <circle cx="170" cy="83" r="1.8" fill={stroke} fillOpacity="0.4" />
    </motion.g>
    <path d="M146 68 l4 8 M158 68 l-2 8" stroke={gold} strokeWidth="1.2" opacity="0.8" />
    <text x="100" y="102" textAnchor="middle" fontSize="8" fill={stroke} opacity="0.7" fontStyle="italic">
      chute ~1 m · lecture de la rupture
    </text>
  </svg>
);

/** B · Test de stabilité : agrégat immergé, bulles ou dispersion. */
export const SchemaStabilite: React.FC = () => (
  <svg viewBox="0 0 200 110" className="w-full h-full" aria-hidden>
    <defs>
      <linearGradient id="ss-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={forest} stopOpacity="0.14" />
        <stop offset="100%" stopColor={forest} stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="200" height="110" fill={cream} />

    {/* bocal */}
    <rect x="66" y="18" width="68" height="74" rx="8" fill="none" stroke={stroke} strokeWidth="1.6" opacity="0.85" />
    <rect x="70" y="34" width="60" height="54" rx="6" fill="url(#ss-water)" />
    <path d="M70 34 q15 4 30 0 q15 -4 30 0" stroke={forest} strokeWidth="1.2" fill="none" opacity="0.8" />
    <rect x="76" y="13" width="48" height="5" rx="2.5" fill={gold} opacity="0.9" />

    {/* agrégat */}
    <motion.g
      animate={{ y: [0, 3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M92 60 q6 -8 14 -4 q9 4 6 12 q-3 8 -12 6 q-10 -2 -8 -14 z"
        fill={forest}
        fillOpacity="0.5"
        stroke={stroke}
        strokeWidth="1.2"
      />
    </motion.g>

    {/* bulles */}
    {[
      { x: 88, d: 0 },
      { x: 100, d: 0.5 },
      { x: 113, d: 1 },
      { x: 106, d: 1.6 },
    ].map((b, i) => (
      <motion.circle
        key={i}
        cx={b.x}
        cy={60}
        r={i % 2 ? 2 : 2.8}
        fill={cream}
        stroke={forest}
        strokeWidth="0.8"
        animate={{ cy: [60, 38], opacity: [0, 0.95, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: b.d, ease: 'easeOut' }}
      />
    ))}

    <text x="100" y="104" textAnchor="middle" fontSize="8" fill={stroke} opacity="0.7" fontStyle="italic">
      10 min d’observation · bulles = air
    </text>
  </svg>
);

export const TestSchema: React.FC<{ id: 'beche' | 'stabilite' }> = ({ id }) =>
  id === 'beche' ? <SchemaBeche /> : <SchemaStabilite />;
