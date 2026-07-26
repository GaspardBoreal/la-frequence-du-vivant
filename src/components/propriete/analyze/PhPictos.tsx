import React from 'react';
import { motion } from 'framer-motion';
import type { PhTestId } from './phTests';

const stroke = 'hsl(var(--ds-forest-deep))';
const forest = 'hsl(var(--ds-forest))';
const gold = 'hsl(var(--ds-gold))';
const cream = 'hsl(var(--ds-cream))';

/** Petit picto d'une classe de pH : goutte teintée + graduation. */
export const IconPhDrop: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden>
    <path
      d="M20 5 C26 15 31 20 31 26 a11 11 0 0 1 -22 0 C9 20 14 15 20 5 Z"
      fill={color}
      fillOpacity={0.22}
      stroke={color}
      strokeWidth={1.8}
    />
    <path d="M20 22 v9" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <circle cx="20" cy="18" r="2" fill={color} />
  </svg>
);

/** Schéma animé du protocole : bandelette colorimétrique / pHmètre. */
export const PhTestSchema: React.FC<{ id: PhTestId }> = ({ id }) =>
  id === 'bandelette' ? <SchemaBandelette /> : <SchemaPhmetre />;

const SchemaBandelette: React.FC = () => (
  <svg viewBox="0 0 320 176" className="w-full h-full" role="img" aria-label="Test à la bandelette">
    <rect width="320" height="176" fill={cream} />
    <path d="M0 158 h320" stroke={forest} strokeOpacity={0.16} strokeWidth={16} />

    {/* Verre + suspension de terre */}
    <g>
      <path d="M58 52 h64 l-7 84 h-50 Z" fill="hsl(var(--ds-forest) / 0.06)" stroke={stroke} strokeOpacity={0.5} strokeWidth={2} />
      <motion.path
        d="M63 92 h54 l-4 44 h-46 Z"
        fill={forest}
        fillOpacity={0.22}
        animate={{ fillOpacity: [0.16, 0.3, 0.16] }}
        transition={{ duration: 3.4, repeat: Infinity }}
      />
      <path d="M66 122 h48 l-2 14 h-44 Z" fill={forest} fillOpacity={0.45} />
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={76 + i * 14}
          cy={104}
          r={2.4}
          fill={stroke}
          fillOpacity={0.45}
          animate={{ cy: [98, 126] }}
          transition={{ duration: 2.6, delay: i * 0.6, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </g>

    {/* Bandelette qui plonge et se colore */}
    <motion.g
      animate={{ y: [-16, 6, -16] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="86" y="26" width="12" height="76" rx="3" fill={cream} stroke={stroke} strokeOpacity={0.55} strokeWidth={1.6} />
      <motion.rect
        x="86"
        y="74"
        width="12"
        height="28"
        rx="3"
        animate={{ fill: ['#e4b64a', '#6b9a3b', '#3e8074', '#e4b64a'] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
    </motion.g>

    {/* Nuancier */}
    <g>
      <rect x="176" y="42" width="112" height="94" rx="8" fill={cream} stroke={stroke} strokeOpacity={0.4} strokeWidth={1.6} />
      {['#c94a3a', '#d97a2b', '#e4b64a', '#6b9a3b', '#3e8074', '#2f5d7a'].map((c, i) => (
        <g key={c}>
          <rect x={186} y={52 + i * 14} width="46" height="10" rx="2" fill={c} />
          <text x={240} y={61 + i * 14} fontSize="8" fill={stroke} fillOpacity={0.65}>
            {(4 + i).toFixed(0)}–{(5 + i).toFixed(0)}
          </text>
        </g>
      ))}
      <motion.rect
        x="182"
        y="48"
        width="54"
        height="18"
        rx="4"
        fill="none"
        stroke={gold}
        strokeWidth="2.2"
        animate={{ y: [48, 90, 62, 48] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
    </g>

    <text x="16" y="24" fontSize="10" fill={forest} fillOpacity={0.8} fontWeight="bold" letterSpacing="2">
      TREMPER · COMPARER
    </text>
  </svg>
);

const SchemaPhmetre: React.FC = () => (
  <svg viewBox="0 0 320 176" className="w-full h-full" role="img" aria-label="Test au pHmètre">
    <rect width="320" height="176" fill={cream} />
    <path d="M0 158 h320" stroke={forest} strokeOpacity={0.16} strokeWidth={16} />

    {/* Boue de terre */}
    <path d="M42 118 q46 -22 96 0 q-8 26 -48 26 q-40 0 -48 -26 Z" fill={forest} fillOpacity={0.4} stroke={stroke} strokeOpacity={0.4} strokeWidth={1.6} />

    {/* Sonde */}
    <motion.g animate={{ y: [-10, 2, -10] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}>
      <rect x="82" y="26" width="26" height="58" rx="6" fill={cream} stroke={stroke} strokeOpacity={0.55} strokeWidth={1.8} />
      <rect x="87" y="33" width="16" height="14" rx="2" fill={forest} fillOpacity={0.18} stroke={stroke} strokeOpacity={0.3} />
      <path d="M95 84 v34" stroke={stroke} strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" />
      <circle cx="95" cy="120" r="4" fill={gold} />
    </motion.g>

    {/* Afficheur */}
    <g>
      <rect x="178" y="46" width="118" height="70" rx="10" fill={cream} stroke={stroke} strokeOpacity={0.42} strokeWidth={1.8} />
      <text x="192" y="68" fontSize="9" fill={forest} fillOpacity={0.7} letterSpacing="2" fontWeight="bold">
        pH
      </text>
      <motion.text
        x="204"
        y="102"
        fontSize="30"
        fontFamily="serif"
        fill={stroke}
        animate={{ opacity: [0.45, 1, 1, 0.45] }}
        transition={{ duration: 3.2, repeat: Infinity }}
      >
        6.8
      </motion.text>
      <motion.circle
        cx="286"
        cy="58"
        r="3.4"
        fill={gold}
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
    </g>

    <text x="16" y="24" fontSize="10" fill={forest} fillOpacity={0.8} fontWeight="bold" letterSpacing="2">
      CALIBRER · STABILISER
    </text>
  </svg>
);
