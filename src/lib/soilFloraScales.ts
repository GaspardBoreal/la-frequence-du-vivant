/**
 * Projection de lecture « quatre curseurs » — chantier VDTP P1.
 *
 * Ce module ne recalcule RIEN : il projette les niveaux déjà produits par
 * `computeConcordanceDetail` (méthode D.S., 8 lignes / 16 points) sur une
 * échelle qualitative à 5 crans par facteur. L'ICG et le tableau détaillé
 * restent la source de vérité ; les curseurs n'en sont qu'une lecture.
 */

import type { ConcordanceDetail, EcoPoleKey, ReadLevel } from '@/lib/plantIndicatorKb';

/** Position sur l'échelle à 5 crans (1 = pôle gauche marqué, 5 = pôle droit marqué) */
export type Scale5 = 1 | 2 | 3 | 4 | 5;

export type ScaleAxisId = 'eau' | 'nutri' | 'ph';

export interface ScaleAxisDef {
  id: ScaleAxisId;
  /** Nom du facteur, sans jargon */
  label: string;
  /** Question posée au site, une phrase courte */
  question: string;
  /** Libellé du cran 1 */
  left: string;
  /** Libellé du cran 5 */
  right: string;
  /** Token couleur du design system */
  token: string;
  /** Pôle qui tire vers la gauche / vers la droite */
  negKey: EcoPoleKey;
  posKey: EcoPoleKey;
  /** Mots des 5 crans, du plus à gauche au plus à droite */
  steps: [string, string, string, string, string];
}

export const SCALE_AXES: ScaleAxisDef[] = [
  {
    id: 'eau',
    label: 'Eau',
    question: 'Le sol garde-t-il l’humidité ?',
    left: 'Sec',
    right: 'Frais et humide',
    token: '--ds-eco-eau',
    negKey: 'eau_sec',
    posKey: 'eau_frais',
    steps: ['Très sec', 'Plutôt sec', 'Équilibré', 'Plutôt frais', 'Frais et humide'],
  },
  {
    id: 'nutri',
    label: 'Nutrition',
    question: 'Le milieu nourrit-il ses plantes ?',
    left: 'Pauvre',
    right: 'Riche',
    token: '--ds-eco-nutri',
    negKey: 'nutri_pauvre',
    posKey: 'nutri_riche',
    steps: ['Très pauvre', 'Plutôt pauvre', 'Moyen', 'Plutôt riche', 'Riche'],
  },
  {
    id: 'ph',
    label: 'pH',
    question: 'Quelle est la réaction du sol ?',
    left: 'Acide',
    right: 'Calcaire',
    token: '--ds-eco-ph',
    negKey: 'ph_acide',
    posKey: 'ph_calcaire',
    steps: ['Franchement acide', 'Plutôt acide', 'Neutre', 'Plutôt calcaire', 'Calcaire'],
  },
];

/** Écart entre les deux voix, du plus concordant au plus divergent */
export type ScaleGap = 'accord' | 'nuance' | 'ecart' | 'na';

export const GAP_LABEL: Record<ScaleGap, string> = {
  accord: 'Les deux voix se rejoignent',
  nuance: 'Une nuance entre les deux voix',
  ecart: 'Les deux voix divergent',
  na: 'Le sol n’est pas encore renseigné',
};

export const GAP_TOKEN: Record<ScaleGap, string> = {
  accord: '--ds-verdict-oui',
  nuance: '--ds-verdict-partiel',
  ecart: '--ds-verdict-non',
  na: '--ds-verdict-na',
};

export function scaleGap(soil: Scale5 | null, flora: Scale5 | null): ScaleGap {
  if (soil == null || flora == null) return 'na';
  const d = Math.abs(soil - flora);
  if (d === 0) return 'accord';
  if (d === 1) return 'nuance';
  return 'ecart';
}

/**
 * Deux niveaux opposés (1..3 chacun) → une position unique sur 5 crans.
 * 3 + (droite − gauche) : l'écart maximal (3 vs 1) donne bien 1 ou 5.
 */
const combine = (neg: ReadLevel | null, pos: ReadLevel | null): Scale5 | null => {
  if (neg == null || pos == null) return null;
  const v = 3 + (pos - neg);
  return Math.min(5, Math.max(1, v)) as Scale5;
};

export interface ScaleReading {
  axis: ScaleAxisDef;
  /** Position du sol (Étape 2), null si la donnée manque */
  soil: Scale5 | null;
  /** Position de la flore (Étape 3), null si aucune plante observée */
  flora: Scale5 | null;
  gap: ScaleGap;
  /** Mot du cran retenu pour la lecture dominante (flore si présente, sinon sol) */
  word: string | null;
}

/**
 * Lecture des trois curseurs à partir du détail de concordance déjà calculé.
 * `hasFlora` = au moins une plante cochée ; sinon on n'affiche pas de repère flore
 * (les niveaux flore valent 1 par défaut et laisseraient croire à un sol très sec).
 */
export function buildScaleReadings(detail: ConcordanceDetail, hasFlora: boolean): ScaleReading[] {
  const row = (key: EcoPoleKey) => detail.rows.find((r) => r.key === key) ?? null;

  return SCALE_AXES.map((axis) => {
    const neg = row(axis.negKey);
    const pos = row(axis.posKey);

    const soil = combine(neg?.soilLevel ?? null, pos?.soilLevel ?? null);
    const flora = hasFlora ? combine(neg?.floraLevel ?? null, pos?.floraLevel ?? null) : null;

    const dominant = flora ?? soil;
    return {
      axis,
      soil,
      flora,
      gap: scaleGap(soil, flora),
      word: dominant == null ? null : axis.steps[dominant - 1],
    };
  });
}

// ------------------------------------------------------------------
// Texture : un mot, plus un triangle
// ------------------------------------------------------------------

export type TextureKey = 'argile' | 'limon' | 'sable';

export const TEXTURE_PART_LABEL: Record<TextureKey, string> = {
  argile: 'Argile',
  limon: 'Limon',
  sable: 'Sable',
};

export interface TextureReading {
  /** Libellé composé, ex. « argilo-limoneux » */
  word: string | null;
  /** Parts en % (somme = 100), dans l'ordre argile / limon / sable */
  shares: Array<{ key: TextureKey; pct: number }>;
  /** Nombre de prélèvements qui fondent la lecture */
  samples: number;
}

const ADJ: Record<TextureKey, string> = {
  argile: 'argileux',
  limon: 'limoneux',
  sable: 'sableux',
};

const PREFIX: Record<TextureKey, string> = {
  argile: 'argilo',
  limon: 'limono',
  sable: 'sablo',
};

/**
 * Répartition des textures dominantes relevées prélèvement par prélèvement
 * → un mot composé et trois jauges. Aucune granulométrie n'est inventée :
 * les parts sont des fréquences d'observation, pas des pourcentages mesurés.
 */
export function buildTextureReading(counts: Record<TextureKey, number>): TextureReading {
  const order: TextureKey[] = ['argile', 'limon', 'sable'];
  const total = order.reduce((s, k) => s + (counts[k] || 0), 0);

  if (total === 0) {
    return { word: null, shares: order.map((key) => ({ key, pct: 0 })), samples: 0 };
  }

  const raw = order.map((key) => ({ key, pct: ((counts[key] || 0) / total) * 100 }));
  // Arrondi qui conserve une somme de 100
  const shares = raw.map((s) => ({ ...s, pct: Math.round(s.pct) }));
  const drift = 100 - shares.reduce((s, x) => s + x.pct, 0);
  if (drift !== 0) {
    const biggest = shares.reduce((a, b) => (b.pct > a.pct ? b : a), shares[0]);
    biggest.pct += drift;
  }

  const ranked = [...shares].filter((s) => s.pct > 0).sort((a, b) => b.pct - a.pct);
  const [first, second] = ranked;

  let word: string;
  if (!second || first.pct >= 70) {
    word = ADJ[first.key];
  } else if (Math.abs(first.pct - second.pct) <= 5) {
    word = `${PREFIX[first.key]}-${ADJ[second.key]} (à parts égales)`;
  } else {
    word = `${PREFIX[second.key]}-${ADJ[first.key]}`;
  }

  return { word, shares, samples: total };
}

/** Phrase de synthèse, sans jargon ni chiffre agronomique */
export function narrateScales(readings: ScaleReading[], texture: TextureReading): string {
  const parts = readings
    .filter((r) => r.word)
    .map((r) => `${r.axis.label.toLowerCase()} ${r.word!.toLowerCase()}`);

  if (parts.length === 0 && !texture.word) return '';

  const head = parts.length > 0 ? `Ce site se lit ${parts.join(', ')}` : 'Ce site se lit';
  const tail = texture.word ? `, sur une terre ${texture.word.replace(' (à parts égales)', '')}` : '';
  return `${head}${tail}.`;
}
