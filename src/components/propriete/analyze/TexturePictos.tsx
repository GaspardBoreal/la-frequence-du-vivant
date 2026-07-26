import React from 'react';
import { motion } from 'framer-motion';
import type { TextureTestId } from './textureTests';

/**
 * Grammaire visuelle commune : un boudin de terre entre deux doigts.
 * Seul le comportement du boudin change (s'émiette / casse / se plie).
 */

const stroke = 'hsl(var(--ds-forest-deep))';
const forest = 'hsl(var(--ds-forest))';
const gold = 'hsl(var(--ds-gold))';
const cream = 'hsl(var(--ds-cream))';

const Fingers: React.FC = () => (
  <g stroke={stroke} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.55}>
    {/* doigt haut */}
    <path d="M10 16 q10 -7 22 -5" />
    <path d="M10 16 q-4 3 -3 7" />
    {/* doigt bas */}
    <path d="M10 48 q10 7 22 5" />
    <path d="M10 48 q-4 -3 -3 -7" />
  </g>
);

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 64 64" className="w-9 h-9" role="img" aria-hidden>
    <circle cx="32" cy="32" r="30" fill={cream} stroke={forest} strokeOpacity={0.2} />
    <Fingers />
    {children}
  </svg>
);

/** Sable : le boudin ne tient pas, il se disperse en grains. */
export const IconTextureSable: React.FC = () => (
  <Frame>
    <path d="M20 32 q6 -3 11 0" stroke={forest} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.75} />
    {[
      [36, 26],
      [41, 33],
      [37, 39],
      [45, 28],
      [46, 38],
      [33, 42],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={1.9} fill={gold} />
    ))}
  </Frame>
);

/** Limon : le boudin se forme puis casse en tronçons. */
export const IconTextureLimon: React.FC = () => (
  <g>
    <Frame>
      <path d="M17 33 q5 -4 10 -1" stroke={forest} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <path d="M32 31 q5 -3 10 1" stroke={forest} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <path d="M46 33 l3 1" stroke={gold} strokeWidth={4} strokeLinecap="round" />
      <path d="M29.5 29 l1.5 5" stroke={gold} strokeWidth={1.4} strokeLinecap="round" />
    </Frame>
  </g>
);

/** Argile : le boudin se plie et se ferme en cercle. */
export const IconTextureArgile: React.FC = () => (
  <Frame>
    <circle cx="32" cy="33" r="11" stroke={forest} strokeWidth={5.5} fill="none" strokeLinecap="round" />
    <circle cx="32" cy="33" r="11" stroke={gold} strokeWidth={1.2} fill="none" strokeDasharray="3 5" opacity={0.8} />
  </Frame>
);

/** Schéma animé de chaque test (fiche protocole). */
export const TextureTestSchema: React.FC<{ id: TextureTestId }> = ({ id }) =>
  id === 'boudin' ? <SchemaBoudin /> : <SchemaSedimentation />;

const SchemaBoudin: React.FC = () => (
  <svg viewBox="0 0 200 110" className="w-full h-full" role="img" aria-label="Schéma du test du boudin">
    <rect width="200" height="110" fill={cream} />
    <g opacity={0.12}>
      <path d="M0 88 h200" stroke={forest} strokeWidth={10} />
    </g>

    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${18 + i * 62}, 20)`}>
        <circle cx="24" cy="10" r="8.5" fill={forest} fillOpacity={0.12} stroke={forest} strokeOpacity={0.35} />
        <text x="24" y="13.5" textAnchor="middle" fontSize="9" fontWeight="700" fill={stroke}>
          {i + 1}
        </text>

        {i === 0 && (
          <motion.g
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '24px 45px' }}
          >
            <ellipse cx="24" cy="45" rx="15" ry="9" fill={forest} fillOpacity={0.6} />
            <path d="M12 52 q12 6 24 0" stroke={stroke} strokeWidth={1.4} fill="none" opacity={0.5} />
          </motion.g>
        )}

        {i === 1 && (
          <motion.g
            animate={{ scaleX: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '24px 45px' }}
          >
            <rect x="6" y="41" width="36" height="8" rx="4" fill={forest} fillOpacity={0.75} />
            <path d="M6 34 q18 -6 36 0" stroke={stroke} strokeWidth={1.4} fill="none" opacity={0.45} />
            <path d="M6 56 q18 6 36 0" stroke={stroke} strokeWidth={1.4} fill="none" opacity={0.45} />
          </motion.g>
        )}

        {i === 2 && (
          <motion.g
            animate={{ pathLength: [0.4, 1, 0.4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.path
              d="M8 52 q16 -22 32 0"
              stroke={forest}
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
              animate={{ d: ['M8 52 q16 -4 32 0', 'M8 52 q16 -22 32 0', 'M8 52 q16 -4 32 0'] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>
        )}
      </g>
    ))}

    <g fontSize="7.5" fill={stroke} opacity={0.7} textAnchor="middle" fontWeight="600">
      <text x="42" y="98">Humidifier</text>
      <text x="104" y="98">Rouler 1 cm</text>
      <text x="166" y="98">Courber</text>
    </g>
  </svg>
);

const SchemaSedimentation: React.FC = () => (
  <svg viewBox="0 0 200 110" className="w-full h-full" role="img" aria-label="Schéma du test de sédimentation">
    <rect width="200" height="110" fill={cream} />

    {/* bocal */}
    <g transform="translate(58, 12)">
      <rect x="0" y="8" width="60" height="80" rx="8" fill={forest} fillOpacity={0.06} stroke={forest} strokeOpacity={0.4} strokeWidth={1.6} />
      <rect x="16" y="2" width="28" height="8" rx="3" fill={forest} fillOpacity={0.25} stroke={forest} strokeOpacity={0.4} />

      {/* eau */}
      <motion.rect
        x="3" y="22" width="54" height="20" rx="3"
        fill={forest} fillOpacity={0.12}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* argile */}
      <motion.rect
        x="3" y="42" width="54" height="12"
        fill={gold} fillOpacity={0.45}
        initial={{ height: 0 }}
        animate={{ height: 12 }}
        transition={{ duration: 1.2, delay: 0.6 }}
      />
      {/* limon */}
      <motion.rect
        x="3" y="54" width="54" height="16"
        fill={forest} fillOpacity={0.45}
        initial={{ height: 0 }}
        animate={{ height: 16 }}
        transition={{ duration: 1.1, delay: 0.3 }}
      />
      {/* sable */}
      <motion.rect
        x="3" y="70" width="54" height="16" rx="2"
        fill={stroke} fillOpacity={0.55}
        initial={{ height: 0 }}
        animate={{ height: 16 }}
        transition={{ duration: 1 }}
      />
    </g>

    <g fontSize="7.5" fill={stroke} fontWeight="600" opacity={0.8}>
      <text x="124" y="58">Argile</text>
      <text x="124" y="72">Limon</text>
      <text x="124" y="88">Sable</text>
      <line x1="118" y1="55" x2="122" y2="55" stroke={gold} strokeWidth={2} />
      <line x1="118" y1="69" x2="122" y2="69" stroke={forest} strokeWidth={2} />
      <line x1="118" y1="85" x2="122" y2="85" stroke={stroke} strokeWidth={2} />
    </g>

    <text x="10" y="102" fontSize="7.5" fill={stroke} opacity={0.6} fontStyle="italic">
      24 h de repos
    </text>
  </svg>
);
