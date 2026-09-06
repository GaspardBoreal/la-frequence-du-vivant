import React from 'react';

/**
 * Petite bibliothèque de croquis pédagogiques dessinés dans l'application.
 * Tout est en `currentColor` / tokens sémantiques : le thème clair et le thème
 * sombre fonctionnent sans retouche.
 */

export const SCHEMA_KEYS = [
  'strates',
  'lisiere',
  'bois-mort',
  'point-eau',
  'ourlet',
  'sol-couvert',
  'hotel-insectes',
  'prairie-fleurie',
  'tas-feuilles',
  'compost',
  'haie',
  'refuge-non-tondu',
] as const;

export type SchemaKey = (typeof SCHEMA_KEYS)[number];

export const SCHEMA_LABELS: Record<SchemaKey, string> = {
  strates: 'Strates de végétation',
  lisiere: 'Lisière étagée',
  'bois-mort': 'Tas de bois mort',
  'point-eau': "Point d'eau",
  ourlet: 'Ourlet non fauché',
  'sol-couvert': 'Sol couvert / paillage',
  'hotel-insectes': 'Hôtel à insectes',
  'prairie-fleurie': 'Prairie fleurie',
  'tas-feuilles': 'Tas de feuilles',
  compost: 'Compost',
  haie: 'Haie champêtre',
  'refuge-non-tondu': 'Zone refuge non tondue',
};

const S = 'currentColor';

const Ground: React.FC<{ y?: number }> = ({ y = 86 }) => (
  <line x1="4" y1={y} x2="156" y2={y} stroke={S} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
);

const drawings: Record<SchemaKey, React.ReactNode> = {
  strates: (
    <>
      <Ground />
      <path d="M22 86V44M22 44c-9 0-14-7-14-13 0-8 7-13 14-13s14 5 14 13c0 6-5 13-14 13z" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M66 86V56M52 62c0-9 6-14 14-14s14 5 14 14c0 7-6 11-14 11s-14-4-14-11z" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M104 86V70M96 74c0-6 4-9 8-9s8 3 8 9c0 4-4 6-8 6s-8-2-8-6z" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M126 86l3-8M134 86l2-6M142 86l3-9M148 86l2-5" stroke={S} strokeWidth="1.4" strokeLinecap="round" />
      <text x="8" y="98" fontSize="7" fill={S} opacity="0.7">arbre</text>
      <text x="54" y="98" fontSize="7" fill={S} opacity="0.7">arbuste</text>
      <text x="94" y="98" fontSize="7" fill={S} opacity="0.7">buisson</text>
      <text x="126" y="98" fontSize="7" fill={S} opacity="0.7">herbes</text>
    </>
  ),
  lisiere: (
    <>
      <Ground />
      <path d="M8 86V30M8 30c-6 0-9-6-9-10" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M18 86V34c0-10 8-16 16-16s16 6 16 16v52" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M56 86V52c0-9 6-14 13-14s13 5 13 14v34" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M88 86V68c0-7 5-11 10-11s10 4 10 11v18" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M116 86l3-10M124 86l2-8M132 86l3-11M140 86l2-7M148 86l3-9" stroke={S} strokeWidth="1.4" strokeLinecap="round" />
      <text x="8" y="98" fontSize="7" fill={S} opacity="0.7">bois</text>
      <text x="118" y="98" fontSize="7" fill={S} opacity="0.7">prairie</text>
    </>
  ),
  'bois-mort': (
    <>
      <Ground />
      <path d="M30 86h96" stroke={S} strokeWidth="1.5" />
      <ellipse cx="52" cy="78" rx="24" ry="7" fill="none" stroke={S} strokeWidth="1.5" />
      <ellipse cx="98" cy="79" rx="20" ry="6" fill="none" stroke={S} strokeWidth="1.5" />
      <ellipse cx="72" cy="66" rx="22" ry="7" fill="none" stroke={S} strokeWidth="1.5" />
      <circle cx="52" cy="78" r="2.4" fill="none" stroke={S} strokeWidth="1.2" />
      <circle cx="72" cy="66" r="2.4" fill="none" stroke={S} strokeWidth="1.2" />
      <path d="M92 58c3-4 8-4 10 0M96 58v4" stroke={S} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <text x="30" y="98" fontSize="7" fill={S} opacity="0.7">bûches empilées à l'ombre</text>
    </>
  ),
  'point-eau': (
    <>
      <path d="M12 62c14-22 44-30 68-30s54 10 66 30c-16 20-42 28-66 28S26 82 12 62z" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M34 62h92M42 72h76" stroke={S} strokeWidth="1.2" opacity="0.6" />
      <path d="M22 62c6-4 12-4 18 0" stroke={S} strokeWidth="1.3" fill="none" />
      <path d="M126 44l-4 12M132 42l-2 12" stroke={S} strokeWidth="1.3" strokeLinecap="round" />
      <text x="12" y="100" fontSize="7" fill={S} opacity="0.7">berge en pente douce, un côté seulement</text>
    </>
  ),
  ourlet: (
    <>
      <Ground />
      <path d="M8 86v-6h56v6" fill="none" stroke={S} strokeWidth="1.4" opacity="0.6" />
      <path d="M72 86l3-24M80 86l2-20M88 86l3-26M96 86l2-18M104 86l3-24M112 86l2-21M120 86l3-25M128 86l2-19M136 86l3-23M144 86l2-18" stroke={S} strokeWidth="1.4" strokeLinecap="round" />
      <text x="10" y="98" fontSize="7" fill={S} opacity="0.7">tondu</text>
      <text x="80" y="98" fontSize="7" fill={S} opacity="0.7">ourlet laissé haut</text>
    </>
  ),
  'sol-couvert': (
    <>
      <rect x="8" y="62" width="144" height="26" rx="3" fill="none" stroke={S} strokeWidth="1.5" />
      <path d="M14 70h20M40 70h24M70 70h18M94 70h26M126 70h18M18 78h26M52 78h22M82 78h20M110 78h30" stroke={S} strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
      <path d="M40 62V44M40 44c-6 0-9-4-9-7M40 50c6 0 9-4 9-7" fill="none" stroke={S} strokeWidth="1.5" />
      <path d="M104 62V46M104 46c-6 0-9-4-9-7" fill="none" stroke={S} strokeWidth="1.5" />
      <text x="8" y="100" fontSize="7" fill={S} opacity="0.7">paillage 5–8 cm, jamais de sol nu</text>
    </>
  ),
  'hotel-insectes': (
    <>
      <rect x="42" y="26" width="76" height="60" rx="3" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M38 26l42-16 42 16" fill="none" stroke={S} strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="42" y1="48" x2="118" y2="48" stroke={S} strokeWidth="1.3" />
      <line x1="42" y1="68" x2="118" y2="68" stroke={S} strokeWidth="1.3" />
      <line x1="80" y1="48" x2="80" y2="86" stroke={S} strokeWidth="1.3" />
      <circle cx="54" cy="38" r="3" fill="none" stroke={S} strokeWidth="1.1" />
      <circle cx="66" cy="38" r="3" fill="none" stroke={S} strokeWidth="1.1" />
      <circle cx="78" cy="38" r="3" fill="none" stroke={S} strokeWidth="1.1" />
      <path d="M46 74h28M46 80h28" stroke={S} strokeWidth="1.1" />
      <path d="M86 54l26 8M86 62l26-8" stroke={S} strokeWidth="1.1" />
      <text x="34" y="98" fontSize="7" fill={S} opacity="0.7">plein sud, adossé, à 1 m du sol</text>
    </>
  ),
  'prairie-fleurie': (
    <>
      <Ground />
      <path d="M18 86V60M30 86V54M44 86V64M58 86V52M72 86V62M86 86V56M100 86V66M114 86V54M128 86V62M142 86V58" stroke={S} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="30" cy="50" r="4" fill="none" stroke={S} strokeWidth="1.3" />
      <circle cx="58" cy="48" r="4" fill="none" stroke={S} strokeWidth="1.3" />
      <circle cx="86" cy="52" r="4" fill="none" stroke={S} strokeWidth="1.3" />
      <circle cx="114" cy="50" r="4" fill="none" stroke={S} strokeWidth="1.3" />
      <circle cx="142" cy="54" r="4" fill="none" stroke={S} strokeWidth="1.3" />
      <path d="M96 30c4-3 8-3 10 1" stroke={S} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <text x="14" y="98" fontSize="7" fill={S} opacity="0.7">fauche tardive, export du foin</text>
    </>
  ),
  'tas-feuilles': (
    <>
      <Ground />
      <path d="M34 86c0-16 14-26 46-26s46 10 46 26z" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M52 76c4-4 8-4 12 0M74 70c4-4 8-4 12 0M96 76c4-4 8-4 12 0" stroke={S} strokeWidth="1.2" fill="none" />
      <path d="M120 56c4 0 6 3 6 6" stroke={S} strokeWidth="1.2" fill="none" />
      <text x="30" y="98" fontSize="7" fill={S} opacity="0.7">refuge d'hiver, à ne pas déranger</text>
    </>
  ),
  compost: (
    <>
      <path d="M36 86V44h88v42" fill="none" stroke={S} strokeWidth="1.6" />
      <path d="M36 56h88M36 68h88" stroke={S} strokeWidth="1.2" opacity="0.7" />
      <path d="M44 44c8-6 18-6 26 0M84 44c8-6 18-6 26 0" fill="none" stroke={S} strokeWidth="1.3" />
      <path d="M56 78c6-4 12-4 18 0M84 78c6-4 12-4 18 0" fill="none" stroke={S} strokeWidth="1.2" opacity="0.7" />
      <Ground />
      <text x="30" y="98" fontSize="7" fill={S} opacity="0.7">alterner vert et brun, garder humide</text>
    </>
  ),
  haie: (
    <>
      <Ground />
      <path d="M10 86V52c0-10 8-16 16-16s16 6 16 16v34" fill="none" stroke={S} strokeWidth="1.5" />
      <path d="M46 86V44c0-11 9-18 18-18s18 7 18 18v42" fill="none" stroke={S} strokeWidth="1.5" />
      <path d="M86 86V54c0-10 8-16 16-16s16 6 16 16v32" fill="none" stroke={S} strokeWidth="1.5" />
      <path d="M122 86V48c0-10 8-16 16-16s16 6 16 16v38" fill="none" stroke={S} strokeWidth="1.5" />
      <text x="10" y="98" fontSize="7" fill={S} opacity="0.7">essences locales mélangées, taille hors nidification</text>
    </>
  ),
  'refuge-non-tondu': (
    <>
      <Ground />
      <rect x="56" y="46" width="52" height="40" rx="4" fill="none" stroke={S} strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M62 86V54M70 86V50M78 86V56M86 86V48M94 86V54M102 86V52" stroke={S} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 80h40M114 80h38" stroke={S} strokeWidth="1.3" opacity="0.6" />
      <text x="10" y="98" fontSize="7" fill={S} opacity="0.7">un carré jamais tondu, déplacé chaque année</text>
    </>
  ),
};

export const GardenSchema: React.FC<{ schemaKey?: string | null; className?: string }> = ({
  schemaKey,
  className,
}) => {
  if (!schemaKey || !(SCHEMA_KEYS as readonly string[]).includes(schemaKey)) return null;
  const key = schemaKey as SchemaKey;
  return (
    <figure className={className}>
      <svg
        viewBox="0 0 160 104"
        role="img"
        aria-label={SCHEMA_LABELS[key]}
        className="w-full max-w-[280px] text-primary"
      >
        {drawings[key]}
      </svg>
      <figcaption className="mt-1 text-[11px] text-muted-foreground">{SCHEMA_LABELS[key]}</figcaption>
    </figure>
  );
};

export default GardenSchema;
