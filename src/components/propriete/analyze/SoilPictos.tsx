import React from 'react';

/**
 * Pictos SVG dessinés main pour l'Étape 2 « J'analyse le sol ».
 * Palette : sépia forêt, ambre or, crème.
 */

const stroke = 'hsl(var(--ds-forest-deep))';
const accent = 'hsl(var(--ds-gold))';
const cream = 'hsl(var(--ds-cream))';

const wrap = (children: React.ReactNode) => (
  <svg viewBox="0 0 64 64" width="40" height="40" aria-hidden fill="none">
    {children}
  </svg>
);

/* ============== Terrain / Remaniement ============== */
export const IconRemanie = () =>
  wrap(
    <>
      <path d="M6 42 L20 34 L28 40 L40 30 L58 42" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 50 L58 50" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M14 42 L14 50 M28 40 L28 50 M40 30 L40 50" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
    </>,
  );

export const IconRemblai = () =>
  wrap(
    <>
      <path d="M6 50 L58 50" stroke={stroke} strokeWidth="1.6" />
      <path d="M16 50 L20 34 L28 30 L38 28 L46 32 L50 50 Z" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" fill={accent} fillOpacity="0.18" />
      <circle cx="24" cy="38" r="1.4" fill={stroke} />
      <circle cx="34" cy="34" r="1.4" fill={stroke} />
      <circle cx="42" cy="40" r="1.4" fill={stroke} />
    </>,
  );

export const IconDecaissement = () =>
  wrap(
    <>
      <path d="M6 34 L22 34 L26 44 L38 44 L42 34 L58 34" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 34 L6 52 L58 52 L58 34" stroke={stroke} strokeWidth="1.4" opacity="0.5" />
      <path d="M28 22 L32 30 L36 22" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L32 30" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );

export const IconNaturel = () =>
  wrap(
    <>
      <path d="M6 46 Q20 40 32 46 T58 46" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 46 L18 34 M26 46 L26 30 M36 46 L36 26 M46 46 L46 32" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="18" cy="32" r="3" fill={accent} fillOpacity="0.6" />
      <circle cx="26" cy="28" r="3" fill={accent} fillOpacity="0.7" />
      <circle cx="36" cy="24" r="3.4" fill={accent} fillOpacity="0.8" />
      <circle cx="46" cy="30" r="3" fill={accent} fillOpacity="0.6" />
    </>,
  );

export const IconInconnu = () =>
  wrap(
    <>
      <circle cx="32" cy="32" r="18" stroke={stroke} strokeWidth="1.8" />
      <path d="M26 26 Q26 20 32 20 Q38 20 38 26 Q38 30 32 32 L32 38" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="44" r="1.6" fill={stroke} />
    </>,
  );

/* ============== Structure ============== */
export const IconCompacte = () =>
  wrap(
    <>
      <rect x="10" y="10" width="44" height="44" rx="3" stroke={stroke} strokeWidth="1.8" />
      <path d="M14 22 L54 22 M14 32 L54 32 M14 42 L54 42" stroke={stroke} strokeWidth="1.2" opacity="0.55" />
      <path d="M20 14 L20 54 M32 14 L32 54 M44 14 L44 54" stroke={stroke} strokeWidth="1.2" opacity="0.55" />
    </>,
  );

export const IconGrumeleuse = () =>
  wrap(
    <>
      <circle cx="20" cy="24" r="6" stroke={stroke} strokeWidth="1.6" fill={accent} fillOpacity="0.2" />
      <circle cx="34" cy="18" r="4.5" stroke={stroke} strokeWidth="1.6" fill={accent} fillOpacity="0.2" />
      <circle cx="46" cy="26" r="5.5" stroke={stroke} strokeWidth="1.6" fill={accent} fillOpacity="0.2" />
      <circle cx="26" cy="38" r="5" stroke={stroke} strokeWidth="1.6" fill={accent} fillOpacity="0.2" />
      <circle cx="40" cy="42" r="6" stroke={stroke} strokeWidth="1.6" fill={accent} fillOpacity="0.2" />
      <circle cx="18" cy="48" r="4" stroke={stroke} strokeWidth="1.6" fill={accent} fillOpacity="0.2" />
    </>,
  );

export const IconParticulaire = () =>
  wrap(
    <>
      {[
        [16, 18], [26, 14], [36, 20], [46, 16], [22, 26], [32, 30], [42, 28],
        [18, 36], [28, 40], [38, 38], [48, 42], [20, 48], [30, 50], [40, 48], [46, 52],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.8" fill={stroke} />
      ))}
    </>,
  );

/* ============== Texture — boudin ============== */
export const IconBoudinSable = () =>
  wrap(
    <>
      <path d="M10 40 Q22 34 32 40 Q42 46 54 40" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" strokeDasharray="4 3" />
      <text x="32" y="56" textAnchor="middle" fontSize="7" fill={stroke} fontStyle="italic">s'effrite</text>
    </>,
  );

export const IconBoudinLimon = () =>
  wrap(
    <>
      <path d="M10 30 C 18 22, 46 22, 54 30 C 60 40, 40 46, 32 44 C 24 42, 6 38, 10 30 Z" stroke={stroke} strokeWidth="2" fill={accent} fillOpacity="0.15" />
      <text x="32" y="58" textAnchor="middle" fontSize="7" fill={stroke} fontStyle="italic">se casse</text>
    </>,
  );

export const IconBoudinArgile = () =>
  wrap(
    <>
      <path d="M14 34 C 14 22, 50 22, 50 34 C 50 46, 14 46, 14 34 Z" stroke={stroke} strokeWidth="2.2" fill={accent} fillOpacity="0.35" />
      <path d="M14 34 Q32 40 50 34" stroke={stroke} strokeWidth="1.2" fill="none" opacity="0.7" />
      <text x="32" y="58" textAnchor="middle" fontSize="7" fill={stroke} fontStyle="italic">tient plié</text>
    </>,
  );

/* ============== Vie du sol ============== */
export const IconVer = () =>
  wrap(
    <>
      <path d="M8 44 Q16 34 24 40 T40 36 T56 40" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="56" cy="40" r="2" fill={stroke} />
    </>,
  );

export const IconTaupiniere = () =>
  wrap(
    <>
      <path d="M6 50 L58 50" stroke={stroke} strokeWidth="1.6" />
      <path d="M14 50 Q24 30 34 50 Z" stroke={stroke} strokeWidth="1.8" fill={accent} fillOpacity="0.25" />
      <path d="M30 50 Q40 34 50 50 Z" stroke={stroke} strokeWidth="1.6" fill={accent} fillOpacity="0.15" />
    </>,
  );

export const IconRacines = () =>
  wrap(
    <>
      <path d="M32 6 L32 30" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M32 30 Q22 40 16 54 M32 30 Q42 40 48 54 M32 30 L32 56 M32 40 Q26 46 22 56 M32 40 Q38 46 42 56" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="6" r="3" fill={accent} />
    </>,
  );

export const IconMicrofaune = () =>
  wrap(
    <>
      <circle cx="20" cy="22" r="3" stroke={stroke} strokeWidth="1.4" />
      <path d="M20 19 L20 15 M20 25 L20 28 M17 22 L14 22 M23 22 L26 22" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="42" cy="30" r="4" stroke={stroke} strokeWidth="1.4" fill={accent} fillOpacity="0.3" />
      <path d="M42 26 L42 22 M42 34 L42 38 M38 30 L34 30 M46 30 L50 30" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="28" cy="46" r="2.5" stroke={stroke} strokeWidth="1.4" />
      <path d="M28 43 L28 40 M28 49 L28 52 M25 46 L22 46 M31 46 L34 46" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
    </>,
  );

export const IconMatiereOrganique = () =>
  wrap(
    <>
      <path d="M14 42 Q22 30 32 34 Q42 22 50 32 Q54 42 44 46 Q28 52 18 48 Q12 46 14 42 Z" stroke={stroke} strokeWidth="1.8" fill={accent} fillOpacity="0.35" />
      <path d="M24 38 L28 40 M36 34 L40 36 M32 44 L36 44" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </>,
  );

export const IconCO2 = () =>
  wrap(
    <>
      <path d="M18 44 Q10 32 22 24" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M22 22 L28 26 L22 30" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="40" cy="30" r="3" fill={accent} />
      <circle cx="46" cy="20" r="2.4" fill={accent} fillOpacity="0.75" />
      <circle cx="36" cy="18" r="2" fill={accent} fillOpacity="0.6" />
      <text x="32" y="54" textAnchor="middle" fontSize="9" fontWeight="700" fill={stroke}>CO₂</text>
    </>,
  );

/* ============== Hero band (haut de carte) ============== */
export const SoilHeroStrata: React.FC<{ variant?: 'strata' | 'cross' | 'sample' | 'roots' | 'ph' | 'life' }> = ({
  variant = 'strata',
}) => (
  <svg viewBox="0 0 320 90" className="w-full h-full" preserveAspectRatio="none" aria-hidden>
    <defs>
      <linearGradient id="soilTop" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={cream} />
        <stop offset="1" stopColor="hsl(var(--ds-forest))" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="soilMid" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={accent} stopOpacity="0.35" />
        <stop offset="1" stopColor="hsl(var(--ds-forest))" stopOpacity="0.25" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="320" height="90" fill="url(#soilTop)" />
    <path d="M0 60 Q80 50 160 58 T320 56 L320 90 L0 90 Z" fill="url(#soilMid)" />
    {variant === 'strata' && (
      <>
        <path d="M0 70 Q80 62 160 68 T320 66" stroke={stroke} strokeWidth="1" opacity="0.35" fill="none" />
        <path d="M0 80 Q80 74 160 78 T320 76" stroke={stroke} strokeWidth="1" opacity="0.25" fill="none" />
      </>
    )}
    {variant === 'sample' && (
      <>
        <circle cx="80" cy="72" r="7" fill={cream} stroke={stroke} strokeWidth="1.4" />
        <text x="80" y="75" textAnchor="middle" fontSize="9" fontWeight="700" fill={stroke}>A</text>
        <circle cx="160" cy="76" r="7" fill={cream} stroke={stroke} strokeWidth="1.4" />
        <text x="160" y="79" textAnchor="middle" fontSize="9" fontWeight="700" fill={stroke}>B</text>
        <circle cx="240" cy="70" r="7" fill={cream} stroke={stroke} strokeWidth="1.4" />
        <text x="240" y="73" textAnchor="middle" fontSize="9" fontWeight="700" fill={stroke}>C</text>
      </>
    )}
    {variant === 'cross' && (
      <>
        <rect x="130" y="30" width="60" height="45" fill={cream} stroke={stroke} strokeWidth="1.2" />
        <path d="M130 40 L190 40 M130 55 L190 55 M130 65 L190 65" stroke={stroke} strokeWidth="0.8" opacity="0.5" />
      </>
    )}
    {variant === 'roots' && (
      <>
        <path d="M60 30 L60 82 M60 50 Q50 60 44 78 M60 50 Q70 60 76 78" stroke={stroke} strokeWidth="1.2" fill="none" />
        <path d="M180 25 L180 82 M180 45 Q168 55 162 78 M180 45 Q192 55 198 78 M180 60 Q172 68 170 82 M180 60 Q188 68 190 82" stroke={stroke} strokeWidth="1.2" fill="none" />
        <path d="M270 35 L270 82 M270 55 Q260 65 254 82 M270 55 Q280 65 286 82" stroke={stroke} strokeWidth="1.2" fill="none" />
      </>
    )}
    {variant === 'ph' && (
      <>
        {Array.from({ length: 6 }).map((_, i) => {
          const x = 40 + i * 48;
          const hues = ['#c94a3a', '#d97a2b', '#e4b64a', '#6b9a3b', '#3e8074', '#2f5d7a'];
          return <circle key={i} cx={x} cy={45} r={9} fill={hues[i]} opacity={0.75} />;
        })}
      </>
    )}
    {variant === 'life' && (
      <>
        <path d="M40 70 Q60 62 80 70 T120 68" stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="140" cy="60" r="3" fill={accent} />
        <path d="M170 72 Q190 60 210 72" stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="240" cy="55" r="4" fill={accent} />
        <circle cx="260" cy="65" r="3" fill={accent} fillOpacity="0.7" />
        <circle cx="280" cy="55" r="3.5" fill={accent} fillOpacity="0.9" />
      </>
    )}
  </svg>
);
