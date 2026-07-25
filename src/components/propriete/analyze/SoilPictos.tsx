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

/* ============== Terrain / Remaniement — grammaire commune :
   cadre 64×64, ligne d'horizon y=44, ambre = intervention humaine,
   forêt = matière naturelle. Chaque picto = résumé de son hero. ============== */

const groundLine = (
  <path d="M4 44 L60 44" stroke={stroke} strokeWidth="1.1" opacity="0.55" />
);

export const IconRemanie = () =>
  wrap(
    <>
      {groundLine}
      {/* deux couches décalées + brassage */}
      <path d="M4 44 L28 42 L30 50 L4 52 Z" fill={accent} fillOpacity="0.28" stroke={stroke} strokeWidth="1" />
      <path d="M32 42 L60 44 L60 54 L34 52 Z" fill={stroke} fillOpacity="0.14" stroke={stroke} strokeWidth="1" />
      <path d="M28 42 L34 52" stroke={accent} strokeWidth="1.4" strokeDasharray="2 2" />
      {/* flèche circulaire de brassage */}
      <path
        d="M22 26 A10 10 0 1 1 42 26"
        stroke={stroke}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M42 26 L38 22 M42 26 L46 24" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </>,
  );

export const IconRemblai = () =>
  wrap(
    <>
      {groundLine}
      {/* monticule posé sur la ligne de sol */}
      <path
        d="M10 44 Q22 22 32 20 Q42 22 54 44 Z"
        fill={accent}
        fillOpacity="0.28"
        stroke={stroke}
        strokeWidth="1.4"
      />
      {/* cailloux ambre = matériaux hétérogènes */}
      <circle cx="22" cy="36" r="1.8" fill={stroke} opacity="0.7" />
      <circle cx="32" cy="30" r="2" fill={stroke} opacity="0.75" />
      <circle cx="40" cy="34" r="1.8" fill={stroke} opacity="0.7" />
      {/* sol d'origine pointillé sous le monticule */}
      <path d="M4 50 L60 50" stroke={stroke} strokeWidth="0.9" strokeDasharray="2 2" opacity="0.55" />
    </>,
  );

export const IconDecaissement = () =>
  wrap(
    <>
      {/* niveau d'origine retiré (pointillé haut) */}
      <path d="M4 22 L60 22" stroke={accent} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
      {/* sol restant avec cuvette */}
      <path
        d="M4 44 L20 44 Q26 44 28 50 L36 50 Q38 44 44 44 L60 44 L60 58 L4 58 Z"
        fill={stroke}
        fillOpacity="0.14"
        stroke={stroke}
        strokeWidth="1.3"
      />
      {/* flèche descendante ambre */}
      <g stroke={accent} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 26 L32 42" />
        <path d="M28 38 L32 44 L36 38" />
      </g>
    </>,
  );

export const IconNaturel = () =>
  wrap(
    <>
      {/* strates parallèles nettes */}
      <rect x="4" y="30" width="56" height="4" fill={accent} fillOpacity="0.35" />
      <rect x="4" y="34" width="56" height="6" fill={accent} fillOpacity="0.22" />
      <rect x="4" y="40" width="56" height="8" fill={stroke} fillOpacity="0.18" />
      <rect x="4" y="48" width="56" height="8" fill={stroke} fillOpacity="0.1" />
      {/* brins d'herbe en surface */}
      <path d="M14 30 Q13 24 15 20" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M22 30 Q23 22 21 18" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M32 30 Q31 22 33 18" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M44 30 Q45 24 43 20" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M52 30 Q51 24 53 22" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>,
  );

export const IconInconnu = () =>
  wrap(
    <>
      {/* strates partielles */}
      <path d="M4 32 L26 32" stroke={stroke} strokeWidth="1" opacity="0.55" />
      <path d="M4 40 L22 40" stroke={stroke} strokeWidth="1" opacity="0.5" />
      <path d="M4 48 L18 48" stroke={stroke} strokeWidth="1" opacity="0.45" />
      <path d="M42 34 L60 34" stroke={stroke} strokeWidth="1" opacity="0.5" />
      <path d="M46 46 L60 46" stroke={stroke} strokeWidth="1" opacity="0.4" />
      {/* voile */}
      <rect x="4" y="14" width="56" height="46" fill={cream} opacity="0.35" />
      {/* point d'interrogation intégré */}
      <path
        d="M27 26 Q27 20 32 20 Q37 20 37 26 Q37 30 32 32 L32 38"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="44" r="1.6" fill={stroke} />
    </>,
  );


/* ============== Structure — grammaire commune :
   silhouette de motte (contour arrondi) posée sur un trait de paume,
   remplissage traduisant l'état (bloc / grumeaux / grains). ============== */

const palmLine = (
  <path d="M8 54 Q32 50 56 54" stroke={stroke} strokeWidth="0.9" opacity="0.5" fill="none" />
);

const mottePath = 'M18 22 Q22 12 32 12 Q42 12 46 22 L48 48 Q44 52 32 52 Q20 52 16 48 Z';

export const IconCompacte = () =>
  wrap(
    <>
      {palmLine}
      {/* motte massive pleine */}
      <path d={mottePath} fill={stroke} fillOpacity="0.35" stroke={stroke} strokeWidth="1.4" />
      {/* fissure unique nette */}
      <path
        d="M28 14 L32 30 L28 44 L34 52"
        stroke={accent}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* point d'impact */}
      <circle cx="30" cy="15" r="1.4" fill={accent} />
    </>,
  );

export const IconGrumeleuse = () =>
  wrap(
    <>
      {palmLine}
      {/* motte-silhouette masquant les agrégats */}
      <defs>
        <clipPath id="motte-grum">
          <path d={mottePath} />
        </clipPath>
      </defs>
      <path d={mottePath} stroke={stroke} strokeWidth="1.4" fill={cream} fillOpacity="0.35" />
      <g clipPath="url(#motte-grum)">
        {[
          { cx: 24, cy: 22, r: 6 },
          { cx: 38, cy: 20, r: 5 },
          { cx: 44, cy: 30, r: 5.5 },
          { cx: 22, cy: 34, r: 5 },
          { cx: 34, cy: 34, r: 5.5 },
          { cx: 28, cy: 46, r: 4.5 },
          { cx: 40, cy: 44, r: 5 },
        ].map((a, i) => (
          <circle
            key={i}
            cx={a.cx}
            cy={a.cy}
            r={a.r}
            fill={stroke}
            fillOpacity="0.28"
            stroke={stroke}
            strokeWidth="0.9"
          />
        ))}
        {/* pores */}
        <circle cx="30" cy="26" r="1" fill={cream} />
        <circle cx="40" cy="36" r="1" fill={cream} />
        <circle cx="26" cy="42" r="0.9" fill={cream} />
      </g>
    </>,
  );

export const IconParticulaire = () =>
  wrap(
    <>
      {palmLine}
      {/* silhouette fantôme de la motte disparue */}
      <path
        d="M20 22 Q24 14 32 14 Q40 14 44 22"
        stroke={stroke}
        strokeWidth="0.9"
        strokeDasharray="2 3"
        fill="none"
        opacity="0.55"
      />
      {/* cascade de grains qui coulent */}
      {[
        [22, 22, 1.4],
        [30, 20, 1.2],
        [38, 22, 1.4],
        [20, 30, 1.2],
        [28, 30, 1.6],
        [36, 30, 1.2],
        [44, 30, 1.4],
        [24, 38, 1.4],
        [32, 40, 1.2],
        [40, 38, 1.4],
        [18, 46, 1.2],
        [28, 48, 1.4],
        [36, 48, 1.2],
        [46, 46, 1.4],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x as number}
          cy={y as number}
          r={r as number}
          fill={i % 3 === 0 ? accent : stroke}
          opacity={i % 3 === 0 ? 0.85 : 0.7}
        />
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
