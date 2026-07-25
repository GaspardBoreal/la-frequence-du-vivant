import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Coupe de sol dynamique — Étape 2 · Bloc 1 (État du terrain).
 * Une scène commune (ciel + strates + horizon) déclinée en 5 récits
 * didactiques selon la valeur choisie.
 */

type Variant = 'remanie' | 'remblai' | 'decaissement' | 'naturel' | 'inconnu' | null | undefined;

const stroke = 'hsl(var(--ds-forest-deep))';
const forest = 'hsl(var(--ds-forest))';
const gold = 'hsl(var(--ds-gold))';
const cream = 'hsl(var(--ds-cream))';

const VERBS: Record<Exclude<Variant, null | undefined>, string> = {
  remanie: 'Terre déplacée · brassée',
  remblai: 'Terre apportée · empilée',
  decaissement: 'Terre retirée · creusée',
  naturel: 'Terre en place · stratifiée',
  inconnu: 'À investiguer · scan partiel',
};

const Scene: React.FC<{ variant: Exclude<Variant, null | undefined>; dim?: boolean }> = ({
  variant,
  dim = false,
}) => {
  const opacity = dim ? 0.55 : 1;
  return (
    <g opacity={opacity}>
      {/* Ciel */}
      <rect x="0" y="0" width="320" height="60" fill="url(#tcs-sky)" />

      {/* Strates de base — communes à tous les cas */}
      {variant !== 'decaissement' && (
        <>
          <path d="M0 70 L320 70" stroke={stroke} strokeWidth="0.6" opacity="0.35" />
          <path d="M0 88 L320 88" stroke={stroke} strokeWidth="0.6" opacity="0.25" />
          <path d="M0 108 L320 108" stroke={stroke} strokeWidth="0.6" opacity="0.2" />
        </>
      )}

      {/* Sol de fond */}
      <rect x="0" y="60" width="320" height="80" fill="url(#tcs-soil)" />

      {variant === 'naturel' && (
        <>
          {/* Litière + humus + terre + argile — strates parallèles nettes */}
          <rect x="0" y="60" width="320" height="6" fill={forest} opacity="0.35" />
          <rect x="0" y="66" width="320" height="10" fill={forest} opacity="0.22" />
          <rect x="0" y="76" width="320" height="18" fill={gold} opacity="0.28" />
          <rect x="0" y="94" width="320" height="26" fill={forest} opacity="0.18" />
          <rect x="0" y="120" width="320" height="20" fill={stroke} opacity="0.12" />
          {/* Herbes en surface */}
          {[30, 55, 90, 130, 170, 205, 240, 275, 300].map((x, i) => (
            <path
              key={i}
              d={`M${x} 62 Q${x - 1} 55 ${x + (i % 2 === 0 ? 1 : -1)} 50`}
              stroke={forest}
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
          ))}
          {/* Racines qui plongent proprement */}
          <path
            d="M110 62 L110 110 M110 78 Q102 88 98 118 M110 78 Q118 88 122 118 M110 100 Q104 110 100 130"
            stroke={stroke}
            strokeWidth="1"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M220 62 L220 118 M220 82 Q212 92 208 122 M220 82 Q228 92 232 122"
            stroke={stroke}
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
        </>
      )}

      {variant === 'remanie' && (
        <>
          {/* Strates rompues et rebouchées en désordre */}
          <path d="M0 76 L120 74 L130 84 L170 78 L180 68 L320 72" stroke={stroke} strokeWidth="1" opacity="0.5" fill="none" />
          <path d="M0 96 L100 94 L115 108 L155 100 L195 112 L235 96 L320 100" stroke={stroke} strokeWidth="1" opacity="0.45" fill="none" />
          {/* Cicatrice diagonale */}
          <path
            d="M120 62 L200 138"
            stroke={gold}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.75"
          />
          <path
            d="M195 62 L145 138"
            stroke={gold}
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.55"
          />
          {/* Blocs de terre déplacés */}
          <path d="M130 72 L155 74 L152 82 L128 80 Z" fill={gold} opacity="0.28" stroke={stroke} strokeWidth="0.7" />
          <path d="M180 90 L210 94 L206 104 L176 100 Z" fill={forest} opacity="0.22" stroke={stroke} strokeWidth="0.7" />
          <path d="M60 100 L92 96 L96 108 L64 112 Z" fill={forest} opacity="0.2" stroke={stroke} strokeWidth="0.7" />
          {/* Pelle en filigrane */}
          <g opacity="0.35" transform="translate(240 52) rotate(25)">
            <rect x="-1" y="0" width="2" height="26" fill={stroke} />
            <path d="M-6 26 L6 26 L4 36 L-4 36 Z" fill={stroke} />
          </g>
          {/* Surface irrégulière */}
          <path d="M0 60 Q40 58 80 62 T160 60 T240 63 T320 60 L320 65 L0 65 Z" fill={cream} opacity="0.35" />
        </>
      )}

      {variant === 'remblai' && (
        <>
          {/* Ligne pointillée = sol d'origine enfoui */}
          <path
            d="M0 78 L320 78"
            stroke={gold}
            strokeWidth="1.2"
            strokeDasharray="5 4"
            opacity="0.85"
          />
          <text x="8" y="74" fontSize="7" fill={gold} fontStyle="italic" opacity="0.9">
            sol d'origine
          </text>
          {/* Monticule ajouté au-dessus */}
          <path
            d="M20 78 Q80 42 160 38 Q240 42 300 78 Z"
            fill={gold}
            fillOpacity="0.25"
            stroke={stroke}
            strokeWidth="1.2"
          />
          <path
            d="M40 78 Q90 52 160 48 Q230 52 280 78"
            stroke={stroke}
            strokeWidth="0.7"
            fill="none"
            opacity="0.45"
          />
          {/* Cailloux / gravats hétérogènes */}
          <circle cx="90" cy="66" r="3" fill={stroke} opacity="0.6" />
          <circle cx="140" cy="54" r="2.4" fill={stroke} opacity="0.7" />
          <circle cx="180" cy="60" r="3.2" fill={stroke} opacity="0.55" />
          <circle cx="220" cy="66" r="2.6" fill={stroke} opacity="0.65" />
          <path d="M110 62 L116 60 L118 66 L112 68 Z" fill={forest} opacity="0.6" />
          <path d="M195 50 L202 48 L204 55 L197 57 Z" fill={forest} opacity="0.55" />
          <path d="M245 62 L252 60 L254 66 L247 68 Z" fill={forest} opacity="0.5" />
        </>
      )}

      {variant === 'decaissement' && (
        <>
          {/* Ligne pointillée = niveau retiré */}
          <path
            d="M0 62 L320 62"
            stroke={gold}
            strokeWidth="1.2"
            strokeDasharray="5 4"
            opacity="0.85"
          />
          <text x="8" y="58" fontSize="7" fill={gold} fontStyle="italic" opacity="0.9">
            niveau d'origine
          </text>
          {/* Sol restant avec cuvette creusée */}
          <path
            d="M0 62 L60 62 Q80 62 90 82 L100 108 L220 108 L230 82 Q240 62 260 62 L320 62 L320 140 L0 140 Z"
            fill="url(#tcs-soil)"
            stroke={stroke}
            strokeWidth="1.2"
          />
          {/* Strates tronquées */}
          <path d="M0 76 L82 76" stroke={stroke} strokeWidth="0.7" opacity="0.4" />
          <path d="M238 76 L320 76" stroke={stroke} strokeWidth="0.7" opacity="0.4" />
          <path d="M0 92 L92 92" stroke={stroke} strokeWidth="0.7" opacity="0.35" />
          <path d="M228 92 L320 92" stroke={stroke} strokeWidth="0.7" opacity="0.35" />
          <path d="M100 108 L220 108" stroke={stroke} strokeWidth="0.9" opacity="0.5" />
          {/* Flèche descendante ambre */}
          <g stroke={gold} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M160 70 L160 100" />
            <path d="M152 92 L160 102 L168 92" />
          </g>
        </>
      )}

      {variant === 'inconnu' && (
        <>
          {/* Strates à moitié révélées */}
          <path d="M0 74 L120 74" stroke={stroke} strokeWidth="0.8" opacity="0.45" />
          <path d="M0 92 L90 92" stroke={stroke} strokeWidth="0.8" opacity="0.4" />
          <path d="M0 112 L70 112" stroke={stroke} strokeWidth="0.8" opacity="0.35" />
          <path d="M240 78 L320 78" stroke={stroke} strokeWidth="0.8" opacity="0.35" />
          <path d="M270 100 L320 100" stroke={stroke} strokeWidth="0.8" opacity="0.3" />
          {/* Voile brumeux */}
          <rect x="0" y="0" width="320" height="140" fill="url(#tcs-fog)" />
          {/* Points d'interrogation en filigrane */}
          {[
            { x: 90, y: 100, s: 1 },
            { x: 175, y: 82, s: 1.6 },
            { x: 250, y: 108, s: 1.1 },
          ].map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={p.y}
              fontSize={22 * p.s}
              fontWeight="700"
              fill={stroke}
              opacity="0.28"
              textAnchor="middle"
            >
              ?
            </text>
          ))}
        </>
      )}
    </g>
  );
};

export const TerrainCrossSection: React.FC<{ value?: Variant }> = ({ value }) => {
  const active = (value ?? undefined) as Exclude<Variant, null | undefined> | undefined;
  const variant: Exclude<Variant, null | undefined> = active ?? 'naturel';
  const verb = active ? VERBS[active] : 'Choisissez un cas pour révéler la coupe';

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="tcs-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={cream} />
            <stop offset="1" stopColor={cream} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="tcs-soil" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={gold} stopOpacity="0.3" />
            <stop offset="1" stopColor={forest} stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="tcs-fog" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={cream} stopOpacity="0.05" />
            <stop offset="0.5" stopColor={cream} stopOpacity="0.55" />
            <stop offset="1" stopColor={cream} stopOpacity="0.15" />
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
