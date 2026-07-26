import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEXTURE_SHORT, TEXTURE_VERB, type TextureResultId } from './textureTests';

/**
 * Hero animé du bloc 4 — Texture du sol.
 * Une même scène (main + boudin) qui morphe selon la dominante :
 * grains libres → boudin cassé → boudin plié en cercle.
 */

type Variant = TextureResultId | null | undefined;

const stroke = 'hsl(var(--ds-forest-deep))';
const forest = 'hsl(var(--ds-forest))';
const gold = 'hsl(var(--ds-gold))';
const cream = 'hsl(var(--ds-cream))';

const BOUDIN_PATH: Record<TextureResultId, string> = {
  sable: 'M120 128 q40 -2 78 0',
  limon: 'M120 128 q40 -22 78 0',
  argile: 'M120 128 q40 -78 78 0',
};

export const TextureCrossSection: React.FC<{ value?: Variant }> = ({ value }) => {
  const v = (value ?? null) as TextureResultId | null;

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 420 184" className="w-full h-full" role="img" aria-label="Texture du sol">
        <defs>
          <linearGradient id="tex-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--ds-cream))" />
            <stop offset="100%" stopColor="hsl(var(--ds-forest) / 0.10)" />
          </linearGradient>
        </defs>

        <rect width="420" height="184" fill="url(#tex-sky)" />
        <path d="M0 152 h420" stroke={forest} strokeOpacity={0.18} strokeWidth={14} />

        {/* Main ouverte, stylisée */}
        <g stroke={stroke} strokeOpacity={0.45} strokeWidth={2.4} fill="none" strokeLinecap="round">
          <path d="M92 150 q34 26 116 22" />
          <path d="M92 150 q-14 -14 -6 -30" />
          <path d="M208 172 q22 -4 30 -18" />
        </g>

        {/* Boudin morphant */}
        <AnimatePresence mode="wait">
          {v === 'sable' ? (
            <motion.g key="sable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <path d="M118 130 q22 -6 40 0" stroke={forest} strokeWidth={13} strokeLinecap="round" fill="none" opacity={0.7} />
              {[
                [176, 118],
                [190, 130],
                [204, 116],
                [212, 132],
                [186, 142],
                [166, 142],
                [222, 124],
              ].map(([cx, cy], i) => (
                <motion.circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={gold}
                  animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2 + i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </motion.g>
          ) : v ? (
            <motion.g key={v} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {v === 'argile' ? (
                <>
                  <circle cx="176" cy="112" r="34" stroke={forest} strokeWidth={14} fill="none" />
                  <motion.circle
                    cx="176"
                    cy="112"
                    r="34"
                    stroke={gold}
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray="6 10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '176px 112px' }}
                  />
                </>
              ) : (
                <>
                  <motion.path
                    d={BOUDIN_PATH.limon}
                    stroke={forest}
                    strokeWidth={14}
                    strokeLinecap="round"
                    fill="none"
                    animate={{ d: [BOUDIN_PATH.limon, 'M120 128 q40 -14 78 0', BOUDIN_PATH.limon] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <path d="M158 104 l4 22" stroke={cream} strokeWidth={4} strokeLinecap="round" />
                  <path d="M158 104 l4 22" stroke={gold} strokeWidth={1.6} strokeLinecap="round" />
                  <circle cx="216" cy="132" r="5" fill={forest} opacity={0.7} />
                </>
              )}
            </motion.g>
          ) : (
            <motion.g key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.path
                d={BOUDIN_PATH.limon}
                stroke={forest}
                strokeOpacity={0.28}
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray="10 12"
                fill="none"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Titre gauche */}
        <text x="24" y="42" fontSize="10" fontWeight="700" letterSpacing="3" fill={forest} opacity={0.65}>
          TEXTURE
        </text>
        <text x="24" y="66" fontSize="17" fontStyle="italic" fill={stroke} fontFamily="serif">
          {v ? TEXTURE_SHORT[v] : 'Roulez un boudin'}
        </text>
      </svg>

      {/* Verbe clé doré */}
      <AnimatePresence mode="wait">
        {v && (
          <motion.div
            key={v}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="absolute left-5 bottom-4 rounded-full border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-cream))]/85 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-gold))] backdrop-blur-sm"
          >
            {TEXTURE_VERB[v]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
