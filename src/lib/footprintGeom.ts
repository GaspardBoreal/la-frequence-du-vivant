/**
 * Empreintes réelles : construction d'anneaux GeoJSON à partir de dimensions
 * exprimées en mètres (cercle, rectangle, hexagone), pour donner à un ouvrage
 * ponctuel (citerne, composteur, ruche…) sa taille réelle au sol.
 *
 * Aucune dépendance carto : purement géométrique, réutilisable à l'impression.
 */

import { closeRing, type Ring } from '@/lib/geomTransform';

const M_PER_DEG_LAT = 111320;

const mPerDegLng = (lat: number) => Math.max(1e-6, M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));

export type FootprintShape = 'circle' | 'rect' | 'hex';

export interface FootprintSpec {
  shape: FootprintShape;
  /** Diamètre (cercle/hexagone) ou longueur (rectangle), en mètres. */
  a: number;
  /** Largeur du rectangle, en mètres (ignoré pour cercle/hexagone). */
  b?: number;
  /** Orientation en degrés (rectangle / hexagone). */
  rotation?: number;
}

const toRing = (
  center: [number, number],
  pts: Array<[number, number]>, // offsets en mètres [est, nord]
  rotationDeg = 0,
): Ring => {
  const [lng, lat] = center;
  const kLng = mPerDegLng(lat);
  const r = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return closeRing(
    pts.map(([e, n]) => {
      const x = e * cos - n * sin;
      const y = e * sin + n * cos;
      return [lng + x / kLng, lat + y / M_PER_DEG_LAT] as [number, number];
    }),
  );
};

/** Cercle réel de diamètre `diameterM` autour d'un point [lng, lat]. */
export const circleFootprint = (center: [number, number], diameterM: number, sides = 48): Ring => {
  const rad = Math.max(0.05, diameterM / 2);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < sides; i++) {
    const t = (i / sides) * Math.PI * 2;
    pts.push([Math.cos(t) * rad, Math.sin(t) * rad]);
  }
  return toRing(center, pts);
};

/** Rectangle réel `lengthM × widthM`, orienté. */
export const rectFootprint = (
  center: [number, number],
  lengthM: number,
  widthM: number,
  rotationDeg = 0,
): Ring => {
  const L = Math.max(0.05, lengthM) / 2;
  const W = Math.max(0.05, widthM) / 2;
  return toRing(center, [[-L, -W], [L, -W], [L, W], [-L, W]], rotationDeg);
};

/** Hexagone réel (composteur, ruche, bac) de largeur `diameterM`. */
export const hexFootprint = (center: [number, number], diameterM: number, rotationDeg = 0): Ring => {
  const rad = Math.max(0.05, diameterM / 2);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    pts.push([Math.cos(t) * rad, Math.sin(t) * rad]);
  }
  return toRing(center, pts, rotationDeg);
};

/** Construit l'anneau correspondant à une spécification d'emprise. */
export const footprintRing = (center: [number, number], spec: FootprintSpec): Ring => {
  if (spec.shape === 'rect') return rectFootprint(center, spec.a, spec.b ?? spec.a, spec.rotation ?? 0);
  if (spec.shape === 'hex') return hexFootprint(center, spec.a, spec.rotation ?? 0);
  return circleFootprint(center, spec.a);
};

/** Surface théorique de l'emprise, en m². */
export const footprintArea = (spec: FootprintSpec): number => {
  if (spec.shape === 'rect') return spec.a * (spec.b ?? spec.a);
  if (spec.shape === 'hex') return (3 * Math.sqrt(3) / 8) * spec.a * spec.a;
  return Math.PI * (spec.a / 2) ** 2;
};

export interface FootprintPreset {
  label: string;
  hint?: string;
  spec: Omit<FootprintSpec, 'rotation'>;
}

const GENERIC: FootprintPreset[] = [
  { label: 'Petit ouvrage', hint: '1 × 1 m', spec: { shape: 'rect', a: 1, b: 1 } },
  { label: 'Moyen', hint: '2 × 1,5 m', spec: { shape: 'rect', a: 2, b: 1.5 } },
  { label: 'Grand', hint: '4 × 3 m', spec: { shape: 'rect', a: 4, b: 3 } },
  { label: 'Rond', hint: '⌀ 2 m', spec: { shape: 'circle', a: 2 } },
];

/** Gabarits métier par outil : dimensions réelles courantes du terrain. */
export const FOOTPRINT_PRESETS: Record<string, FootprintPreset[]> = {
  citerne: [
    { label: 'Cuve IBC 1 000 L', hint: '1,20 × 1,00 m', spec: { shape: 'rect', a: 1.2, b: 1 } },
    { label: 'Citerne 3 000 L', hint: '⌀ 1,60 m', spec: { shape: 'circle', a: 1.6 } },
    { label: 'Citerne 5 000 L', hint: '⌀ 1,90 m', spec: { shape: 'circle', a: 1.9 } },
    { label: 'Citerne 10 000 L', hint: '⌀ 2,40 m', spec: { shape: 'circle', a: 2.4 } },
    { label: 'Enterrée 20 m³', hint: '6,00 × 2,40 m', spec: { shape: 'rect', a: 6, b: 2.4 } },
  ],
  composteur: [
    { label: 'Bac 400 L', hint: '0,80 × 0,80 m', spec: { shape: 'rect', a: 0.8, b: 0.8 } },
    { label: 'Trois bacs', hint: '3,00 × 1,00 m', spec: { shape: 'rect', a: 3, b: 1 } },
    { label: 'Silo rond', hint: '⌀ 1,20 m', spec: { shape: 'hex', a: 1.2 } },
  ],
  ruche: [
    { label: 'Ruche Dadant', hint: '0,55 × 0,45 m', spec: { shape: 'rect', a: 0.55, b: 0.45 } },
    { label: 'Rucher 3 ruches', hint: '2,40 × 0,80 m', spec: { shape: 'rect', a: 2.4, b: 0.8 } },
  ],
  'arbre-remarquable': [
    { label: 'Jeune couronne', hint: '⌀ 4 m', spec: { shape: 'circle', a: 4 } },
    { label: 'Arbre adulte', hint: '⌀ 8 m', spec: { shape: 'circle', a: 8 } },
    { label: 'Vieil arbre', hint: '⌀ 14 m', spec: { shape: 'circle', a: 14 } },
  ],
};

export const presetsFor = (toolKey?: string | null): FootprintPreset[] =>
  (toolKey && FOOTPRINT_PRESETS[toolKey]) || GENERIC;

export const fmtMeters = (m: number): string =>
  `${m.toLocaleString('fr-FR', { minimumFractionDigits: m < 10 ? 2 : 1, maximumFractionDigits: 2 })} m`;
