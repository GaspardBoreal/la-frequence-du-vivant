/**
 * Envergure adulte et lecture des strates végétales.
 *
 * Le Scénographe pose des espèces sur un plan à l'échelle réelle : une pastille
 * n'a de sens que si son halo correspond à l'emprise que la plante occupera
 * réellement. Faute de donnée d'envergure fiable pour toutes les espèces, on
 * cascade : valeur saisie → valeur connue par strate → défaut prudent.
 */

export type Strate =
  | 'couvre-sol'
  | 'herbacee'
  | 'sous-arbrisseau'
  | 'arbuste'
  | 'arbre'
  | 'grimpante'
  | 'aquatique';

export interface StrateInfo {
  key: Strate;
  label: string;
  /** Envergure adulte par défaut, en mètres (diamètre). */
  spreadM: number;
  /** Hauteur indicative, en mètres. */
  heightM: number;
  color: string;
  glyph: string;
}

export const STRATES: Record<Strate, StrateInfo> = {
  'couvre-sol': { key: 'couvre-sol', label: 'Couvre-sol', spreadM: 0.4, heightM: 0.2, color: '#7fae5a', glyph: '🌾' },
  herbacee: { key: 'herbacee', label: 'Herbacée', spreadM: 0.6, heightM: 0.7, color: '#5f9e6e', glyph: '🌿' },
  'sous-arbrisseau': { key: 'sous-arbrisseau', label: 'Sous-arbrisseau', spreadM: 1, heightM: 1, color: '#4a8b70', glyph: '🪴' },
  arbuste: { key: 'arbuste', label: 'Arbuste', spreadM: 2.2, heightM: 2.5, color: '#3d7a63', glyph: '🌳' },
  arbre: { key: 'arbre', label: 'Arbre', spreadM: 6, heightM: 9, color: '#2f6350', glyph: '🌲' },
  grimpante: { key: 'grimpante', label: 'Grimpante', spreadM: 1.2, heightM: 3, color: '#6f9d8a', glyph: '🍃' },
  aquatique: { key: 'aquatique', label: 'Aquatique', spreadM: 0.8, heightM: 0.4, color: '#5aa2ae', glyph: '💧' },
};

export const STRATE_ORDER: Strate[] = [
  'couvre-sol',
  'herbacee',
  'sous-arbrisseau',
  'arbuste',
  'grimpante',
  'arbre',
  'aquatique',
];

const norm = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Lit une strate depuis un libellé libre (colonne « strate » d'un tableau IA). */
export function parseStrate(raw?: string | null): Strate {
  const t = norm(raw || '');
  if (!t) return 'herbacee';
  if (t.includes('couvre')) return 'couvre-sol';
  if (t.includes('sous-arbr') || t.includes('sous arbr')) return 'sous-arbrisseau';
  if (t.includes('arbust') || t.includes('buisson') || t.includes('haie')) return 'arbuste';
  if (t.includes('arbre') || t.includes('canope') || t.includes('haute tige')) return 'arbre';
  if (t.includes('grimp') || t.includes('liane')) return 'grimpante';
  if (t.includes('aquat') || t.includes('hélophyte') || t.includes('helophyte') || t.includes('berge'))
    return 'aquatique';
  if (t.includes('herbac') || t.includes('vivace') || t.includes('annuelle')) return 'herbacee';
  return 'herbacee';
}

/** Lit une hauteur en mètres depuis « 50 cm », « 1,2 m », « 80 » … */
export function parseHeightM(raw?: string | null): number | null {
  if (!raw) return null;
  const t = norm(raw).replace(',', '.');
  const m = t.match(/([\d.]+)\s*(cm|m\b|metre|mètre)?/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (!Number.isFinite(v)) return null;
  if (m[2] === 'cm') return v / 100;
  if (!m[2] && v > 10) return v / 100; // « 50 » lu en centimètres
  return v;
}

/** Envergure adulte retenue pour une espèce (diamètre en mètres). */
export function spreadFor(strate: Strate, heightM?: number | null): number {
  const base = STRATES[strate].spreadM;
  if (!heightM || !Number.isFinite(heightM)) return base;
  // Un port plus haut que la moyenne de sa strate s'étale généralement davantage.
  const ratio = heightM / STRATES[strate].heightM;
  return Math.round(Math.max(0.2, Math.min(base * 2.5, base * (0.6 + 0.4 * ratio))) * 10) / 10;
}

/** Familles de fonctions écologiques repérables dans un texte libre. */
export const ECO_FUNCTIONS = [
  { key: 'mellifere', label: 'Mellifère', glyph: '🐝', match: ['mellif', 'nectar', 'pollinis', 'butin'] },
  { key: 'nourricier', label: 'Nourricier', glyph: '🍒', match: ['comestible', 'nourric', 'fruit', 'aromat', 'potag'] },
  { key: 'azote', label: 'Fixatrice d’azote', glyph: '⚡', match: ['azote', 'fixatrice', 'legumin', 'légumin'] },
  { key: 'couverture', label: 'Couverture du sol', glyph: '🛡️', match: ['couvertur', 'tapis', 'paillage', 'anti-ero', 'anti ero'] },
  { key: 'refuge', label: 'Refuge / abri', glyph: '🐦', match: ['refuge', 'abri', 'gite', 'gîte', 'nidif', 'invertebr', 'invertébr'] },
  { key: 'accumulatrice', label: 'Accumulatrice', glyph: '🧪', match: ['accumul', 'mineral', 'minéral', 'bio-indic'] },
  { key: 'structure', label: 'Structure / port', glyph: '🏛️', match: ['structur', 'architectur', 'graphique', 'volume', 'ponctuation'] },
] as const;

export type EcoFunctionKey = (typeof ECO_FUNCTIONS)[number]['key'];

/** Détecte les fonctions écologiques mentionnées dans un texte libre. */
export function parseEcoFunctions(...texts: Array<string | null | undefined>): EcoFunctionKey[] {
  const t = norm(texts.filter(Boolean).join(' · '));
  if (!t) return [];
  return ECO_FUNCTIONS.filter((f) => f.match.some((m) => t.includes(norm(m)))).map((f) => f.key);
}

export const ecoLabel = (k: EcoFunctionKey) => ECO_FUNCTIONS.find((f) => f.key === k)!;
