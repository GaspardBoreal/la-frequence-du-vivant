import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PH_CLASS_MAP, PH_GRADIENT, phPercent, type PhClassId } from './phTests';

const stroke = 'hsl(var(--ds-forest-deep))';
const forest = 'hsl(var(--ds-forest))';
const cream = 'hsl(var(--ds-cream))';
const gold = 'hsl(var(--ds-gold))';

/**
 * Hero animé du bloc 5 — Acidité.
 * Un profil de sol dont la teinte et la végétation morphent selon le pH moyen relevé.
 */
export const PhCrossSection: React.FC<{
  value?: number | null;
  classId?: PhClassId | null;
}> = ({ value, classId }) => {
  const cls = classId ? PH_CLASS_MAP[classId] : null;
  const color = cls?.color ?? 'hsl(var(--ds-forest))';
  const pct = value != null ? phPercent(value) : null;

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 420 184" className="w-full h-full" role="img" aria-label="Acidité du sol">
        <defs>
          <linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cream} />
            <stop offset="100%" stopColor="hsl(var(--ds-forest) / 0.10)" />
          </linearGradient>
          <linearGradient id="ph-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.42} />
            <stop offset="100%" stopColor={color} stopOpacity={0.86} />
          </linearGradient>
        </defs>

        <rect width="420" height="184" fill="url(#ph-sky)" />

        {/* Profil de sol teinté par le pH */}
        <motion.path
          key={color}
          d="M0 104 q60 -14 108 -2 q52 12 104 -4 q56 -16 106 2 q56 14 102 -6 V184 H0 Z"
          fill="url(#ph-soil)"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        />

        {/* Racines / disponibilité des nutriments */}
        <g stroke={cream} strokeOpacity={0.55} strokeWidth={1.6} fill="none" strokeLinecap="round">
          <path d="M96 116 v40 M96 130 l-14 12 M96 142 l14 10" />
          <path d="M212 112 v46 M212 128 l-16 14 M212 140 l15 12" />
          <path d="M326 118 v38 M326 132 l-14 12 M326 144 l13 9" />
        </g>

        {/* Bulles de nutriments : plus le pH est proche de la neutralité, plus elles montent */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.circle
            key={i}
            cx={70 + i * 62}
            r={3}
            fill={gold}
            fillOpacity={0.7}
            animate={{ cy: [150, 108], opacity: [0, 0.9, 0] }}
            transition={{ duration: 3.4, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}

        {/* Végétation stylisée */}
        <g stroke={forest} strokeOpacity={0.7} strokeWidth={2.2} fill="none" strokeLinecap="round">
          <path d="M96 104 q-4 -26 6 -40 M96 104 q10 -18 22 -24 M96 104 q-16 -14 -26 -18" />
          <path d="M212 100 q2 -30 -6 -44 M212 100 q14 -20 26 -22" />
          <path d="M326 106 q-2 -22 8 -34 M326 106 q-14 -12 -24 -14" />
        </g>

        {/* Échelle pH */}
        <g>
          <defs>
            <linearGradient id="ph-scale" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c94a3a" />
              <stop offset="22%" stopColor="#d97a2b" />
              <stop offset="44%" stopColor="#e4b64a" />
              <stop offset="58%" stopColor="#6b9a3b" />
              <stop offset="78%" stopColor="#3e8074" />
              <stop offset="100%" stopColor="#2f5d7a" />
            </linearGradient>
          </defs>
          <rect x="28" y="26" width="364" height="10" rx="5" fill="url(#ph-scale)" />

          {pct != null && (
            <motion.g
              animate={{ x: 28 + (pct / 100) * 364 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              <circle cx={0} cy={31} r={7.5} fill={color} stroke={cream} strokeWidth={2.5} />
              <path d="M0 40 v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
            </motion.g>
          )}
          <text x="28" y="20" fontSize="9" fill={stroke} fillOpacity={0.55}>4</text>
          <text x="200" y="20" fontSize="9" fill={stroke} fillOpacity={0.55}>7</text>
          <text x="384" y="20" fontSize="9" fill={stroke} fillOpacity={0.55}>9</text>
        </g>
      </svg>

      <AnimatePresence mode="wait">
        {cls ? (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1"
          >
            <span
              className="font-serif italic text-lg drop-shadow-sm"
              style={{ color: 'hsl(var(--ds-cream))' }}
            >
              pH moyen {value != null ? value.toFixed(1) : '—'}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ background: 'hsl(var(--ds-cream))', color: cls.color }}
            >
              {cls.label}
            </span>
            <span className="text-[11px] italic text-[hsl(var(--ds-cream))]/90">{cls.verb}</span>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2.5 left-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-cream))]/85"
          >
            En attente de vos mesures
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
