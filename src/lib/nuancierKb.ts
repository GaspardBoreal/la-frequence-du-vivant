/**
 * Nuancier horticole — grammaire chromatique des massifs.
 *
 * Le paysagiste ne compose pas seulement des formes : il compose des
 * couleurs, et une couleur n'existe que quelques semaines par an. Ce module
 * fournit :
 *  - les teintes horticoles de référence (position sur la roue chromatique)
 *  - la déduction automatique du TYPE de massif à partir des teintes retenues
 *    (monochrome / camaïeu / bicolore / polychrome)
 *  - les règles d'harmonie et de dissonance
 *  - la lecture du calendrier de floraison (continuité florale, mois creux)
 *
 * Les données vivent dans `propriete_objets.meta` :
 *   meta.teintes  : string[]  (clés de TEINTES)
 *   meta.floraison: number[]  (mois 1..12)
 */

export type TeinteKey =
  | 'blanc'
  | 'jaune'
  | 'orange'
  | 'rouge'
  | 'rose'
  | 'mauve'
  | 'bleu'
  | 'pourpre'
  | 'argente'
  | 'vert';

export interface Teinte {
  key: TeinteKey;
  label: string;
  hex: string;
  /** position sur la roue chromatique, en degrés (null = achromatique) */
  angle: number | null;
  /** lecture sensible de la teinte au jardin */
  lecture: string;
}

export const TEINTES: Teinte[] = [
  { key: 'blanc', label: 'Blanc', hex: '#f6f3ea', angle: null, lecture: 'Éclaire l’ombre, prolonge le jardin au crépuscule.' },
  { key: 'argente', label: 'Argenté', hex: '#c3cbc2', angle: null, lecture: 'Feuillage gris : lie les teintes qui jurent, tient la sécheresse.' },
  { key: 'jaune', label: 'Jaune', hex: '#e8bf3f', angle: 55, lecture: 'Avance vers l’œil, réveille les fonds sombres.' },
  { key: 'orange', label: 'Orange', hex: '#dd8236', angle: 30, lecture: 'Chaleur d’arrière-saison, tient tête au feuillage pourpre.' },
  { key: 'rouge', label: 'Rouge', hex: '#b23a34', angle: 5, lecture: 'Ponctuation : par touches, jamais en nappe.' },
  { key: 'rose', label: 'Rose', hex: '#d98aa4', angle: 340, lecture: 'Adoucit, fait reculer les limites du jardin.' },
  { key: 'mauve', label: 'Mauve', hex: '#9b7cc0', angle: 285, lecture: 'La teinte des pollinisateurs : mellifère par excellence.' },
  { key: 'bleu', label: 'Bleu', hex: '#5b83b4', angle: 225, lecture: 'Recule, creuse la profondeur, rafraîchit le plein soleil.' },
  { key: 'pourpre', label: 'Pourpre', hex: '#6d3b52', angle: 320, lecture: 'Feuillage sombre : socle qui fait vibrer les clairs.' },
  { key: 'vert', label: 'Vert', hex: '#6d8f5a', angle: 130, lecture: 'La couleur qui reste douze mois sur douze.' },
];

export const TEINTE_BY_KEY: Record<string, Teinte> = Object.fromEntries(
  TEINTES.map((t) => [t.key, t]),
);

export const hexOf = (k: string) => TEINTE_BY_KEY[k]?.hex ?? '#8d8d8d';
export const labelOf = (k: string) => TEINTE_BY_KEY[k]?.label ?? k;

/* ── Type de massif déduit ───────────────────────────────────── */

export type HarmonieKey = 'monochrome' | 'camaieu' | 'bicolore' | 'polychrome' | 'vide';

export interface Harmonie {
  key: HarmonieKey;
  label: string;
  principe: string;
  /** conseil de composition propre à cette harmonie */
  conseil: string;
}

export const HARMONIES: Record<HarmonieKey, Harmonie> = {
  vide: {
    key: 'vide',
    label: 'Nuancier à composer',
    principe: 'Aucune teinte retenue pour l’instant.',
    conseil: 'Choisissez d’abord la teinte dominante, puis ce qui l’accompagne.',
  },
  monochrome: {
    key: 'monochrome',
    label: 'Massif monochromatique',
    principe: 'Une seule teinte, déclinée par les textures et les hauteurs.',
    conseil:
      'Le calme naît de la masse : au moins 7 pieds par espèce, et laissez la nuance venir du feuillage, pas de la fleur.',
  },
  camaieu: {
    key: 'camaieu',
    label: 'Massif en camaïeu',
    principe: 'Des teintes voisines sur la roue : la transition est insensible.',
    conseil:
      'Passez du clair au foncé dans le sens de la lumière du soir ; un feuillage argenté sert de respiration entre deux nuances.',
  },
  bicolore: {
    key: 'bicolore',
    label: 'Massif bicolore',
    principe: 'Deux teintes en dialogue : contraste ou complémentarité.',
    conseil:
      'Tenez une proportion 70 / 30 — une dominante, une ponctuation. À 50 / 50 le massif se coupe en deux.',
  },
  polychrome: {
    key: 'polychrome',
    label: 'Massif polychromatique',
    principe: 'Plusieurs teintes mêlées : effet prairie, lecture naturaliste.',
    conseil:
      'Le désordre se compose : une teinte fil rouge répétée partout, du blanc ou de l’argenté pour apaiser les chocs.',
  },
};

const angleDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Écart chromatique maximal entre les teintes colorées retenues. */
export function spreadOf(keys: string[]): number {
  const angles = keys
    .map((k) => TEINTE_BY_KEY[k]?.angle)
    .filter((a): a is number => typeof a === 'number');
  if (angles.length < 2) return 0;
  let max = 0;
  for (let i = 0; i < angles.length; i++)
    for (let j = i + 1; j < angles.length; j++)
      max = Math.max(max, angleDist(angles[i], angles[j]));
  return max;
}

/** Déduit l'harmonie à partir des teintes retenues. */
export function harmonieOf(keys: string[]): Harmonie {
  const uniq = Array.from(new Set(keys.filter((k) => TEINTE_BY_KEY[k])));
  if (uniq.length === 0) return HARMONIES.vide;
  if (uniq.length === 1) return HARMONIES.monochrome;
  if (uniq.length === 2) return HARMONIES.bicolore;
  return spreadOf(uniq) <= 60 ? HARMONIES.camaieu : HARMONIES.polychrome;
}

/** Nom auto-généré du massif : « Massif bicolore mauve × jaune ». */
export function nuancierName(keys: string[]): string {
  const uniq = Array.from(new Set(keys.filter((k) => TEINTE_BY_KEY[k])));
  const h = harmonieOf(uniq);
  if (!uniq.length) return h.label;
  const noms = uniq.map(labelOf).map((s) => s.toLowerCase());
  const suite = noms.length <= 3 ? noms.join(' × ') : `${noms.slice(0, 2).join(' × ')} +${noms.length - 2}`;
  return `${h.label} ${suite}`;
}

/* ── Harmonie / dissonance ───────────────────────────────────── */

export interface Dissonance {
  pair: [string, string];
  message: string;
  remede: string;
}

const NEUTRES: TeinteKey[] = ['blanc', 'argente', 'vert'];

const CLASHES: Array<{ a: TeinteKey; b: TeinteKey; message: string; remede: string }> = [
  { a: 'rouge', b: 'rose', message: 'Rouge et rose froid se salissent mutuellement.', remede: 'Intercalez un feuillage argenté, ou basculez le rose vers un rose corail.' },
  { a: 'orange', b: 'mauve', message: 'Orange et mauve se neutralisent en vibration sale.', remede: 'Gardez l’un des deux en simple ponctuation (moins de 15 % de la surface).' },
  { a: 'orange', b: 'rose', message: 'Orange et rose tendre se contredisent en pleine lumière.', remede: 'Passez le rose en pourpre foncé, ou l’orange en jaune abricot.' },
  { a: 'rouge', b: 'mauve', message: 'Rouge et mauve s’assombrissent l’un l’autre à l’ombre.', remede: 'Ajoutez du blanc pour créer la respiration entre les deux.' },
];

export function dissonancesOf(keys: string[]): Dissonance[] {
  const set = new Set(keys);
  const out: Dissonance[] = [];
  for (const c of CLASHES) {
    if (set.has(c.a) && set.has(c.b)) {
      out.push({ pair: [c.a, c.b], message: c.message, remede: c.remede });
    }
  }
  return out;
}

/** Une teinte apaisante est-elle présente ? */
export const hasNeutre = (keys: string[]) => keys.some((k) => NEUTRES.includes(k as TeinteKey));

/** Teinte complémentaire suggérée pour la dominante. */
export function complementaireOf(key: string): Teinte | null {
  const t = TEINTE_BY_KEY[key];
  if (!t || t.angle === null) return null;
  const target = (t.angle + 180) % 360;
  let best: Teinte | null = null;
  let bestD = 999;
  for (const c of TEINTES) {
    if (c.angle === null || c.key === key) continue;
    const d = angleDist(c.angle, target);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/* ── Calendrier de floraison ─────────────────────────────────── */

export const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
export const MOIS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export interface FloraisonLecture {
  /** mois couverts (1..12) */
  couverts: number[];
  /** mois sans aucune floraison (1..12) */
  creux: number[];
  /** 0..1 */
  continuite: number;
  phrase: string;
}

export function lireFloraison(moisList: number[][]): FloraisonLecture {
  const set = new Set<number>();
  for (const arr of moisList) for (const m of arr || []) if (m >= 1 && m <= 12) set.add(m);
  const couverts = Array.from(set).sort((a, b) => a - b);
  const creux = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !set.has(m));
  const continuite = couverts.length / 12;
  const phrase = couverts.length
    ? `Votre jardin est fleuri ${couverts.length} mois sur 12${
        creux.length
          ? ` — il reste ${creux.length === 1 ? 'un creux' : `${creux.length} creux`} en ${creux
              .map((m) => MOIS_LONG[m - 1])
              .join(', ')}.`
          : ' — la floraison ne s’interrompt jamais.'
      }`
    : 'Aucune floraison renseignée pour l’instant.';
  return { couverts, creux, continuite, phrase };
}

/** Clés d'outils portant un nuancier. */
export const CHROMATIC_TOOL_KEYS = [
  'massif-monochrome',
  'massif-camaieu',
  'massif-bicolore',
  'massif-polychrome',
  'bordure-fleurie',
  'massif-ombre',
];

export const isChromaticTool = (key: string) => CHROMATIC_TOOL_KEYS.includes(key);

/** Teintes lues depuis meta, avec repli. */
export const teintesOf = (meta: any): string[] =>
  Array.isArray(meta?.teintes) ? (meta.teintes as string[]).filter((k) => TEINTE_BY_KEY[k]) : [];

export const floraisonOf = (meta: any): number[] =>
  Array.isArray(meta?.floraison)
    ? (meta.floraison as number[]).filter((m) => m >= 1 && m <= 12)
    : [];
