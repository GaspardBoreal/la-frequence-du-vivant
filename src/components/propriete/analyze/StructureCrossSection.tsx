import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Motte dans la main — Étape 2 · Bloc 3 (Structure du sol).
 * Une scène commune (ciel + horizon + main) déclinée en 3 récits
 * didactiques selon la structure choisie.
 */

type Variant = 'compacte' | 'grumeleuse' | 'particulaire' | null | undefined;

const stroke = 'hsl(var(--ds-forest-deep))';
const forest = 'hsl(var(--ds-forest))';
const gold = 'hsl(var(--ds-gold))';
const cream = 'hsl(var(--ds-cream))';

const VERBS: Record<Exclude<Variant, null | undefined>, string> = {
  compacte: 'Résiste · bloc unique',
  grumeleuse: 'S’émiette · respire',
  particulaire: 'Se disperse · sable',
};

// Silhouette « paume ouverte » commune (les mottes reposent dessus)
const Hand = () => (
  <g opacity="0.55">
    <path
      d="M40 128 Q80 118 160 116 Q240 118 280 128 L280 138 L40 138 Z"
      fill={stroke}
      fillOpacity="0.18"
      stroke={stroke}
      strokeWidth="0.8"
    />
    {/* lignes de la paume */}
    <path
      d="M90 125 Q160 120 230 125"
      stroke={stroke}
      strokeWidth="0.5"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M110 130 Q160 127 210 130"
      stroke={stroke}
      strokeWidth="0.4"
      fill="none"
      opacity="0.4"
    />
  </g>
);

const Scene: React.FC<{ variant: Exclude<Variant, null | undefined>; dim?: boolean }> = ({
  variant,
  dim = false,
}) => {
  const opacity = dim ? 0.55 : 1;
  return (
    <g opacity={opacity}>
      {/* Fond ciel/terre */}
      <rect x="0" y="0" width="320" height="140" fill="url(#scs-sky)" />
      <path d="M0 100 Q160 92 320 100 L320 140 L0 140 Z" fill="url(#scs-ground)" />

      <Hand />

      {variant === 'compacte' && (
        <>
          {/* Motte massive monolithique posée sur la paume */}
          <path
            d="M112 46 Q120 30 160 30 Q200 30 208 46 L214 108 Q210 116 160 116 Q110 116 106 108 Z"
            fill={forest}
            fillOpacity="0.42"
            stroke={stroke}
            strokeWidth="1.6"
          />
          {/* Facettes de surface (bloc dense) */}
          <path
            d="M118 46 Q160 40 202 46"
            stroke={stroke}
            strokeWidth="0.7"
            fill="none"
            opacity="0.55"
          />
          {/* Fissure unique nette qui refuse de céder */}
          <path
            d="M148 32 L156 66 L146 92 L164 114"
            stroke={gold}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          {/* Micro-fissure secondaire */}
          <path
            d="M186 44 L182 78 L192 104"
            stroke={gold}
            strokeWidth="0.9"
            fill="none"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          {/* Point d'impact du couteau */}
          <circle cx="152" cy="34" r="2.2" fill={gold} opacity="0.85" />
        </>
      )}

      {variant === 'grumeleuse' && (
        <>
          {/* Motte éclatée en agrégats arrondis imbriqués */}
          {[
            { cx: 138, cy: 60, r: 18 },
            { cx: 172, cy: 52, r: 15 },
            { cx: 200, cy: 66, r: 17 },
            { cx: 118, cy: 82, r: 14 },
            { cx: 152, cy: 88, r: 16 },
            { cx: 188, cy: 94, r: 15 },
            { cx: 216, cy: 88, r: 13 },
            { cx: 138, cy: 106, r: 11 },
            { cx: 176, cy: 110, r: 12 },
            { cx: 208, cy: 108, r: 10 },
          ].map((a, i) => (
            <circle
              key={i}
              cx={a.cx}
              cy={a.cy}
              r={a.r}
              fill={forest}
              fillOpacity="0.32"
              stroke={stroke}
              strokeWidth="1.1"
            />
          ))}
          {/* Petits vides = porosité (grains de lumière) */}
          {[
            [156, 72],
            [190, 78],
            [138, 92],
            [175, 96],
            [204, 84],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill={cream} opacity="0.9" />
          ))}
          {/* Radicelle qui traverse (respiration racinaire) */}
          <path
            d="M160 30 Q158 44 168 58 Q160 74 172 88 Q166 102 178 116"
            stroke={stroke}
            strokeWidth="1.1"
            fill="none"
            opacity="0.55"
            strokeLinecap="round"
          />
          <path d="M168 58 L176 54" stroke={stroke} strokeWidth="0.7" opacity="0.5" />
          <path d="M172 88 L164 84" stroke={stroke} strokeWidth="0.7" opacity="0.5" />
        </>
      )}

      {variant === 'particulaire' && (
        <>
          {/* Silhouette fantôme de la motte disparue */}
          <path
            d="M112 46 Q120 32 160 32 Q200 32 208 46 L212 88"
            stroke={stroke}
            strokeWidth="0.9"
            strokeDasharray="3 4"
            fill="none"
            opacity="0.4"
          />
          {/* Cascade de grains qui coulent entre les doigts */}
          {Array.from({ length: 90 }).map((_, i) => {
            const col = i % 12;
            const row = Math.floor(i / 12);
            const spread = 6 + row * 3;
            const x = 120 + col * 8 + ((row * 5 + col * 3) % spread) - spread / 2;
            const y = 46 + row * 8 + ((col * 7) % 4);
            const r = 0.9 + ((i * 3) % 5) * 0.25;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={r}
                fill={i % 3 === 0 ? gold : stroke}
                opacity={i % 3 === 0 ? 0.7 : 0.55}
              />
            );
          })}
          {/* Grains qui rebondissent sur la paume */}
          {[
            [90, 118],
            [104, 120],
            [230, 118],
            [244, 120],
            [122, 122],
            [212, 122],
          ].map(([x, y], i) => (
            <circle key={`b${i}`} cx={x} cy={y} r="1.1" fill={stroke} opacity="0.7" />
          ))}
        </>
      )}
    </g>
  );
};

export const StructureCrossSection: React.FC<{ value?: Variant }> = ({ value }) => {
  const active = (value ?? undefined) as Exclude<Variant, null | undefined> | undefined;
  const variant: Exclude<Variant, null | undefined> = active ?? 'grumeleuse';
  const verb = active ? VERBS[active] : 'Cassez une motte pour révéler sa structure';

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="scs-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={cream} />
            <stop offset="1" stopColor={cream} stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="scs-ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={gold} stopOpacity="0.28" />
            <stop offset="1" stopColor={forest} stopOpacity="0.32" />
          </linearGradient>
        </defs>

        <AnimatePresence mode="wait">
          <motion.g
            key={active ?? 'placeholder'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Scene variant={variant} dim={!active} />
          </motion.g>
        </AnimatePresence>
      </svg>

      {/* Verbe clé */}
      <div className="absolute left-0 right-0 bottom-2 flex justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={verb}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest-deep))]/80 bg-[hsl(var(--ds-cream))]/85 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm"
          >
            {verb}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};
