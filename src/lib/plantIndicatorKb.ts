import { normalizeStructure, normalizeTexture } from '@/lib/soilVocabulary';

// Base de connaissance flore bio-indicatrice — Méthode D.S. (pages 9-13)
// Chaque plante porte 4 indices (Eau, Texture, Nutrition, pH) sur -3..+3
//   Eau       : -3 = très sec … +3 = très frais/humide
//   Texture   : -3 = sable/limon léger … +3 = argile lourde
//   Nutrition : -3 = pauvre … +3 = riche
//   pH        : -3 = acide … +3 = calcaire/basique

export type PlantFamily = 'herbacee' | 'arbuste' | 'liane' | 'arbre';

export interface PlantIndicator {
  id: string;
  nom: string;
  latin?: string;
  famille: PlantFamily;
  eau: number;      // hydrique
  texture: number;  // granulométrie
  nutri: number;    // richesse
  ph: number;       // acidité
}

export const PLANT_INDICATORS: PlantIndicator[] = [
  // Herbacées
  { id: 'ortie', nom: 'Ortie dioïque', latin: 'Urtica dioica', famille: 'herbacee', eau: 1, texture: 1, nutri: 3, ph: 1 },
  { id: 'renoncule-rampante', nom: 'Renoncule rampante', latin: 'Ranunculus repens', famille: 'herbacee', eau: 3, texture: 2, nutri: 1, ph: 0 },
  { id: 'pissenlit', nom: 'Pissenlit', latin: 'Taraxacum officinale', famille: 'herbacee', eau: 0, texture: 0, nutri: 2, ph: 1 },
  { id: 'chardon', nom: 'Chardon des champs', latin: 'Cirsium arvense', famille: 'herbacee', eau: 0, texture: 2, nutri: 2, ph: 1 },
  { id: 'plantain-lanceole', nom: 'Plantain lancéolé', latin: 'Plantago lanceolata', famille: 'herbacee', eau: -1, texture: 0, nutri: 0, ph: 0 },
  { id: 'trefle-blanc', nom: 'Trèfle blanc', latin: 'Trifolium repens', famille: 'herbacee', eau: 0, texture: 1, nutri: 1, ph: 1 },
  { id: 'rumex', nom: 'Rumex', latin: 'Rumex obtusifolius', famille: 'herbacee', eau: 1, texture: 2, nutri: 3, ph: 0 },
  { id: 'liseron', nom: 'Liseron des champs', latin: 'Convolvulus arvensis', famille: 'herbacee', eau: -1, texture: 1, nutri: 1, ph: 1 },
  { id: 'coquelicot', nom: 'Coquelicot', latin: 'Papaver rhoeas', famille: 'herbacee', eau: -1, texture: 0, nutri: 0, ph: 2 },
  { id: 'moutarde', nom: 'Moutarde des champs', latin: 'Sinapis arvensis', famille: 'herbacee', eau: 0, texture: 0, nutri: 2, ph: 2 },
  { id: 'digitale', nom: 'Digitale pourpre', latin: 'Digitalis purpurea', famille: 'herbacee', eau: 1, texture: -1, nutri: -1, ph: -3 },
  { id: 'genet', nom: 'Genêt à balais', latin: 'Cytisus scoparius', famille: 'herbacee', eau: -2, texture: -1, nutri: -2, ph: -2 },
  { id: 'oseille', nom: 'Petite oseille', latin: 'Rumex acetosella', famille: 'herbacee', eau: 0, texture: -2, nutri: -2, ph: -3 },
  { id: 'joncs', nom: 'Joncs', latin: 'Juncus spp.', famille: 'herbacee', eau: 3, texture: 2, nutri: 0, ph: -1 },
  { id: 'menthe-aquatique', nom: 'Menthe aquatique', latin: 'Mentha aquatica', famille: 'herbacee', eau: 3, texture: 1, nutri: 1, ph: 0 },
  { id: 'consoude', nom: 'Consoude', latin: 'Symphytum officinale', famille: 'herbacee', eau: 2, texture: 2, nutri: 3, ph: 1 },
  { id: 'achillee', nom: 'Achillée millefeuille', latin: 'Achillea millefolium', famille: 'herbacee', eau: -1, texture: 0, nutri: 0, ph: 0 },
  { id: 'fougere-aigle', nom: 'Fougère aigle', latin: 'Pteridium aquilinum', famille: 'herbacee', eau: 0, texture: -1, nutri: -1, ph: -3 },

  // Arbustes
  { id: 'ronce', nom: 'Ronce commune', latin: 'Rubus fruticosus', famille: 'arbuste', eau: 1, texture: 1, nutri: 2, ph: 0 },
  { id: 'sureau-noir', nom: 'Sureau noir', latin: 'Sambucus nigra', famille: 'arbuste', eau: 1, texture: 1, nutri: 3, ph: 1 },
  { id: 'noisetier', nom: 'Noisetier', latin: 'Corylus avellana', famille: 'arbuste', eau: 1, texture: 1, nutri: 2, ph: 1 },
  { id: 'aubepine', nom: 'Aubépine', latin: 'Crataegus monogyna', famille: 'arbuste', eau: 0, texture: 1, nutri: 1, ph: 2 },
  { id: 'prunellier', nom: 'Prunellier', latin: 'Prunus spinosa', famille: 'arbuste', eau: 0, texture: 1, nutri: 1, ph: 2 },
  { id: 'ajonc', nom: 'Ajonc d\'Europe', latin: 'Ulex europaeus', famille: 'arbuste', eau: -1, texture: -1, nutri: -2, ph: -2 },
  { id: 'bruyere', nom: 'Bruyère commune', latin: 'Calluna vulgaris', famille: 'arbuste', eau: 0, texture: -1, nutri: -2, ph: -3 },
  { id: 'buis', nom: 'Buis', latin: 'Buxus sempervirens', famille: 'arbuste', eau: -1, texture: 0, nutri: 0, ph: 3 },
  { id: 'cornouiller-sanguin', nom: 'Cornouiller sanguin', latin: 'Cornus sanguinea', famille: 'arbuste', eau: 1, texture: 1, nutri: 1, ph: 2 },

  // Lianes
  { id: 'lierre', nom: 'Lierre grimpant', latin: 'Hedera helix', famille: 'liane', eau: 1, texture: 0, nutri: 1, ph: 1 },
  { id: 'clematite', nom: 'Clématite des haies', latin: 'Clematis vitalba', famille: 'liane', eau: 0, texture: 1, nutri: 1, ph: 2 },
  { id: 'houblon', nom: 'Houblon', latin: 'Humulus lupulus', famille: 'liane', eau: 2, texture: 1, nutri: 3, ph: 1 },

  // Arbres
  { id: 'chene-pedoncule', nom: 'Chêne pédonculé', latin: 'Quercus robur', famille: 'arbre', eau: 1, texture: 1, nutri: 1, ph: 0 },
  { id: 'chene-vert', nom: 'Chêne vert', latin: 'Quercus ilex', famille: 'arbre', eau: -2, texture: 0, nutri: 0, ph: 2 },
  { id: 'chataignier', nom: 'Châtaignier', latin: 'Castanea sativa', famille: 'arbre', eau: 0, texture: -1, nutri: 0, ph: -2 },
  { id: 'bouleau', nom: 'Bouleau verruqueux', latin: 'Betula pendula', famille: 'arbre', eau: 0, texture: -1, nutri: -1, ph: -2 },
  { id: 'aulne-glutineux', nom: 'Aulne glutineux', latin: 'Alnus glutinosa', famille: 'arbre', eau: 3, texture: 1, nutri: 1, ph: 0 },
  { id: 'saule-blanc', nom: 'Saule blanc', latin: 'Salix alba', famille: 'arbre', eau: 3, texture: 2, nutri: 1, ph: 0 },
  { id: 'frene', nom: 'Frêne commun', latin: 'Fraxinus excelsior', famille: 'arbre', eau: 2, texture: 1, nutri: 2, ph: 1 },
  { id: 'erable-champetre', nom: 'Érable champêtre', latin: 'Acer campestre', famille: 'arbre', eau: 0, texture: 1, nutri: 1, ph: 2 },
  { id: 'pin-sylvestre', nom: 'Pin sylvestre', latin: 'Pinus sylvestris', famille: 'arbre', eau: -1, texture: -1, nutri: -1, ph: -1 },
  { id: 'hetre', nom: 'Hêtre', latin: 'Fagus sylvatica', famille: 'arbre', eau: 1, texture: 0, nutri: 1, ph: 0 },

  // === Cortège complémentaire de la méthode D.S. (pages 9-10) ===
  // Herbacées
  { id: 'epilobe-hirsute', nom: 'Épilobe hérissé', latin: 'Epilobium hirsutum', famille: 'herbacee', eau: 3, texture: 1, nutri: 3, ph: 1 },
  { id: 'gaillet-gratteron', nom: 'Gaillet gratteron', latin: 'Galium aparine', famille: 'herbacee', eau: 1, texture: 1, nutri: 3, ph: 1 },
  { id: 'lamier-blanc', nom: 'Lamier blanc', latin: 'Lamium album', famille: 'herbacee', eau: 1, texture: 1, nutri: 3, ph: 1 },
  { id: 'grande-bardane', nom: 'Grande bardane', latin: 'Arctium lappa', famille: 'herbacee', eau: 0, texture: 1, nutri: 3, ph: 1 },
  { id: 'thym-serpolet', nom: 'Thym serpolet', latin: 'Thymus serpyllum', famille: 'herbacee', eau: -3, texture: -2, nutri: -2, ph: 1 },
  { id: 'lotier-corniculé', nom: 'Lotier corniculé', latin: 'Lotus corniculatus', famille: 'herbacee', eau: -1, texture: 0, nutri: -1, ph: 1 },
  { id: 'carotte-sauvage', nom: 'Carotte sauvage', latin: 'Daucus carota', famille: 'herbacee', eau: -1, texture: 0, nutri: 0, ph: 2 },
  { id: 'senecon-jacobee', nom: 'Séneçon de Jacob', latin: 'Jacobaea vulgaris', famille: 'herbacee', eau: -1, texture: -1, nutri: -1, ph: 0 },
  // Arbustes
  { id: 'troene', nom: 'Troène commun', latin: 'Ligustrum vulgare', famille: 'arbuste', eau: 0, texture: 1, nutri: 1, ph: 3 },
  { id: 'cytise', nom: 'Cytise faux-ébénier', latin: 'Laburnum anagyroides', famille: 'arbuste', eau: -1, texture: 0, nutri: 0, ph: 2 },
  { id: 'cornouiller-male', nom: 'Cornouiller mâle', latin: 'Cornus mas', famille: 'arbuste', eau: 0, texture: 1, nutri: 1, ph: 3 },
  { id: 'camerisier', nom: 'Camérisier à balais', latin: 'Lonicera xylosteum', famille: 'arbuste', eau: 0, texture: 1, nutri: 1, ph: 2 },
  { id: 'eglantier', nom: 'Églantier', latin: 'Rosa canina', famille: 'arbuste', eau: 0, texture: 1, nutri: 1, ph: 1 },
  { id: 'poirier-cordata', nom: 'Poirier à feuilles en cœur', latin: 'Pyrus cordata', famille: 'arbuste', eau: -1, texture: 0, nutri: -1, ph: -1 },
  // Lianes
  { id: 'liseron-des-haies', nom: 'Liseron des haies', latin: 'Calystegia sepium', famille: 'liane', eau: 2, texture: 1, nutri: 3, ph: 1 },
  { id: 'chevrefeuille', nom: 'Chèvrefeuille des bois', latin: 'Lonicera periclymenum', famille: 'liane', eau: 1, texture: -1, nutri: 0, ph: -2 },
  // Arbres
  { id: 'sorbier', nom: 'Sorbier des oiseleurs', latin: 'Sorbus aucuparia', famille: 'arbre', eau: 0, texture: -1, nutri: -1, ph: -2 },
  { id: 'tremble', nom: 'Peuplier tremble', latin: 'Populus tremula', famille: 'arbre', eau: 1, texture: 0, nutri: 0, ph: 0 },
];


export const FAMILY_META: Record<PlantFamily, { label: string; hint: string }> = {
  herbacee: { label: 'Herbacées', hint: 'Cortège du sol vif' },
  arbuste:  { label: 'Arbustes',  hint: 'Ourlets, haies, lisières' },
  liane:    { label: 'Lianes',    hint: 'Grimpantes & indicateurs frais' },
  arbre:    { label: 'Arbres',    hint: 'Signature climatique du lieu' },
};

// Convertit une valeur d'indice (-3..+3) en libellé lisible
const LABELS: Record<'eau' | 'texture' | 'nutri' | 'ph', [string, string]> = {
  eau:     ['Sec', 'Frais / humide'],
  texture: ['Sableux / léger', 'Argileux / lourd'],
  nutri:   ['Pauvre', 'Riche'],
  ph:      ['Acide', 'Calcaire'],
};

export interface FloraProfile {
  eau: number;      // moyenne pondérée -3..+3
  texture: number;
  nutri: number;
  ph: number;
  count: number;
}

export function computeFloraProfile(observedIds: string[]): FloraProfile {
  const plants = PLANT_INDICATORS.filter((p) => observedIds.includes(p.id));
  if (plants.length === 0) return { eau: 0, texture: 0, nutri: 0, ph: 0, count: 0 };
  const sum = plants.reduce(
    (acc, p) => ({
      eau: acc.eau + p.eau,
      texture: acc.texture + p.texture,
      nutri: acc.nutri + p.nutri,
      ph: acc.ph + p.ph,
    }),
    { eau: 0, texture: 0, nutri: 0, ph: 0 }
  );
  return {
    eau: sum.eau / plants.length,
    texture: sum.texture / plants.length,
    nutri: sum.nutri / plants.length,
    ph: sum.ph / plants.length,
    count: plants.length,
  };
}

function axisLabel(axis: 'eau' | 'texture' | 'nutri' | 'ph', v: number): string {
  const [lo, hi] = LABELS[axis];
  if (v <= -1.5) return `${lo} (marqué)`;
  if (v < -0.3) return `${lo} (tendance)`;
  if (v > 1.5) return `${hi} (marqué)`;
  if (v > 0.3) return `${hi} (tendance)`;
  return 'Équilibré';
}

export function narrateFloraProfile(profile: FloraProfile): string {
  if (profile.count === 0) return '';
  return [
    `Ambiance hydrique : ${axisLabel('eau', profile.eau)}.`,
    `Texture pressentie : ${axisLabel('texture', profile.texture)}.`,
    `Richesse : ${axisLabel('nutri', profile.nutri)}.`,
    `Acidité : ${axisLabel('ph', profile.ph)}.`,
  ].join(' ');
}

// ============================================================
// Concordance avec les résultats de l'Étape 2 (sol)
// ============================================================
export interface SoilLite {
  structure?: string | null;   // compacte | grumeleuse | particulaire
  texture?: string | null;     // sable_limon | limon_moyen | limon_argile
  boudin_shape?: string | null;
  ph?: number | null;          // 4..9
  life_signs?: string[];
}

export type AxisMatch = 'oui' | 'partiel' | 'non' | 'na';

export interface ConcordanceReport {
  eau: AxisMatch;
  texture: AxisMatch;
  nutri: AxisMatch;
  ph: AxisMatch;
  icg: number; // 0..100
}

// Points : oui=2, partiel=1, non=0, na exclu du dénominateur
function scoreMatch(m: AxisMatch): number {
  return m === 'oui' ? 2 : m === 'partiel' ? 1 : 0;
}

export function computeConcordance(flora: FloraProfile, soil: SoilLite): ConcordanceReport {
  // Texture : flora.texture (+ = argile) vs soil.texture
  const soilTextureVal =
    soil.texture === 'limon_argile' ? 2 :
    soil.texture === 'limon_moyen' ? 0 :
    soil.texture === 'sable_limon' ? -2 : null;

  const texMatch: AxisMatch = soilTextureVal == null ? 'na'
    : Math.sign(flora.texture) === Math.sign(soilTextureVal) && Math.abs(flora.texture) > 0.3
      ? (Math.abs(flora.texture - soilTextureVal / 2) < 1.2 ? 'oui' : 'partiel')
      : Math.abs(flora.texture) < 0.4 && soilTextureVal === 0 ? 'oui'
      : 'non';

  // pH : convertir soil.ph (4..9) en axe -3..+3 (7 = neutre)
  const soilPhAxis = soil.ph == null ? null : (soil.ph - 7) * (3 / 2); // 4→-4.5 clampable ; on garde le signe
  const phMatch: AxisMatch = soilPhAxis == null ? 'na'
    : Math.sign(flora.ph || 0) === Math.sign(soilPhAxis) || Math.abs(flora.ph) < 0.4
      ? (Math.abs(flora.ph - Math.max(-3, Math.min(3, soilPhAxis))) < 1.5 ? 'oui' : 'partiel')
      : 'non';

  // Nutrition : proxy via signes de vie (biomasse) + structure grumeleuse
  const lifeCount = soil.life_signs?.length ?? 0;
  const soilNutriHint = lifeCount >= 3 ? 2 : lifeCount >= 1 ? 1 : soil.structure ? -1 : null;
  const nutriMatch: AxisMatch = soilNutriHint == null ? 'na'
    : Math.sign(flora.nutri) === Math.sign(soilNutriHint) || Math.abs(flora.nutri) < 0.4
      ? (Math.abs(flora.nutri - soilNutriHint) < 1.5 ? 'oui' : 'partiel')
      : 'non';

  // Eau : proxy via structure (compacte = eau stagnante, particulaire = drainant)
  const soilEauHint =
    soil.structure === 'compacte' ? 2 :
    soil.structure === 'particulaire' ? -2 :
    soil.structure === 'grumeleuse' ? 0 : null;
  const eauMatch: AxisMatch = soilEauHint == null ? 'na'
    : Math.sign(flora.eau) === Math.sign(soilEauHint) || Math.abs(flora.eau) < 0.4
      ? (Math.abs(flora.eau - soilEauHint) < 1.6 ? 'oui' : 'partiel')
      : 'non';

  // ICG /100 : total pts / total max
  const axes = [eauMatch, texMatch, nutriMatch, phMatch];
  const active = axes.filter((a) => a !== 'na');
  const pts = active.reduce((s, a) => s + scoreMatch(a), 0);
  const max = active.length * 2;
  const icg = max === 0 ? 0 : Math.round((pts / max) * 100);

  return { eau: eauMatch, texture: texMatch, nutri: nutriMatch, ph: phMatch, icg };
}

// ============================================================
// Grille de lecture écologique (méthode D.S. — page 10)
// 4 critères × 2 pôles = 8 colonnes ; intensité 0..3
//   3 = forte · 2 = moyenne · 1 = faible · 0 = neutre
// ============================================================

export type EcoAxis = 'eau' | 'texture' | 'nutri' | 'ph';
export type EcoPoleKey =
  | 'eau_frais' | 'eau_sec'
  | 'tex_limon_sable' | 'tex_argile_limon'
  | 'nutri_riche' | 'nutri_pauvre'
  | 'ph_acide' | 'ph_calcaire';

export interface EcoPole {
  key: EcoPoleKey;
  axis: EcoAxis;
  label: string;
  short: string;
  /** signe de la valeur signée du KB qui alimente ce pôle */
  sign: 1 | -1;
}

export const ECO_AXES: Record<EcoAxis, { label: string; token: string }> = {
  eau:     { label: 'Eau',       token: '--ds-eco-eau' },
  texture: { label: 'Texture',   token: '--ds-eco-texture' },
  nutri:   { label: 'Nutrition', token: '--ds-eco-nutri' },
  ph:      { label: 'pH',        token: '--ds-eco-ph' },
};

export const ECO_POLES: EcoPole[] = [
  { key: 'eau_frais',        axis: 'eau',     label: 'Frais / humide',    short: 'Frais',    sign: 1 },
  { key: 'eau_sec',          axis: 'eau',     label: 'Sec',               short: 'Sec',      sign: -1 },
  { key: 'tex_limon_sable',  axis: 'texture', label: 'Limoneux / sableux', short: 'Limon/sable', sign: -1 },
  { key: 'tex_argile_limon', axis: 'texture', label: 'Argileux / limoneux', short: 'Argile', sign: 1 },
  { key: 'nutri_riche',      axis: 'nutri',   label: 'Riche',             short: 'Riche',    sign: 1 },
  { key: 'nutri_pauvre',     axis: 'nutri',   label: 'Pauvre',            short: 'Pauvre',   sign: -1 },
  { key: 'ph_acide',         axis: 'ph',      label: 'Acide',             short: 'Acide',    sign: -1 },
  { key: 'ph_calcaire',      axis: 'ph',      label: 'Calcaire',          short: 'Calcaire', sign: 1 },
];

export type EcoIntensity = 0 | 1 | 2 | 3;

export const INTENSITY_LABEL: Record<EcoIntensity, string> = {
  0: 'Neutre',
  1: 'Faible',
  2: 'Moyenne',
  3: 'Forte',
};

/** Intensité 0..3 d'une plante sur un pôle donné */
export function poleIntensity(plant: PlantIndicator, pole: EcoPole): EcoIntensity {
  const v = plant[pole.axis];
  if (pole.sign === 1 ? v <= 0 : v >= 0) return 0;
  const a = Math.min(3, Math.round(Math.abs(v)));
  return a as EcoIntensity;
}

/** Grille complète d'une plante (8 valeurs) */
export function plantGrid(plant: PlantIndicator): Record<EcoPoleKey, EcoIntensity> {
  const out = {} as Record<EcoPoleKey, EcoIntensity>;
  for (const p of ECO_POLES) out[p.key] = poleIntensity(plant, p);
  return out;
}

export type EcoLevel = 'tres_faible' | 'faible' | 'moyen' | 'fort' | 'tres_fort';

export const LEVEL_LABEL: Record<EcoLevel, string> = {
  tres_faible: 'Très faible',
  faible: 'Faible',
  moyen: 'Moyen',
  fort: 'Fort',
  tres_fort: 'Très fort',
};

export interface PoleScore {
  pole: EcoPole;
  points: number;      // somme des intensités du cortège coché
  ratio: number;       // 0..1 (points / max théorique)
  level: EcoLevel;
  contributors: number; // nb de plantes qui alimentent ce pôle
}

function levelFromRatio(ratio: number): EcoLevel {
  if (ratio < 0.12) return 'tres_faible';
  if (ratio < 0.28) return 'faible';
  if (ratio < 0.48) return 'moyen';
  if (ratio < 0.68) return 'fort';
  return 'tres_fort';
}

/** Somme des indices par pôle sur les plantes cochées (page 11) */
export function computePoleScores(observedIds: string[]): PoleScore[] {
  const plants = PLANT_INDICATORS.filter((p) => observedIds.includes(p.id));
  const max = Math.max(1, plants.length * 3);
  return ECO_POLES.map((pole) => {
    let points = 0;
    let contributors = 0;
    for (const p of plants) {
      const i = poleIntensity(p, pole);
      if (i > 0) {
        points += i;
        contributors += 1;
      }
    }
    const ratio = points / max;
    return { pole, points, ratio, level: levelFromRatio(ratio), contributors };
  });
}

export function poleScore(scores: PoleScore[], key: EcoPoleKey): PoleScore {
  return scores.find((s) => s.pole.key === key)!;
}

/** Phrase de synthèse à partir des dominantes par critère */
export function narratePoleScores(scores: PoleScore[]): string {
  if (scores.every((s) => s.points === 0)) return '';
  const pick = (a: EcoPoleKey, b: EcoPoleKey) => {
    const sa = poleScore(scores, a);
    const sb = poleScore(scores, b);
    if (sa.points === 0 && sb.points === 0) return null;
    if (Math.abs(sa.points - sb.points) <= 1) return 'équilibré';
    return (sa.points > sb.points ? sa : sb).pole.label.toLowerCase();
  };
  const eau = pick('eau_frais', 'eau_sec');
  const tex = pick('tex_argile_limon', 'tex_limon_sable');
  const nut = pick('nutri_riche', 'nutri_pauvre');
  const ph = pick('ph_calcaire', 'ph_acide');
  const parts: string[] = [];
  if (eau) parts.push(`une ambiance hydrique ${eau === 'équilibré' ? 'équilibrée' : eau}`);
  if (tex) parts.push(`une texture plutôt ${tex === 'équilibré' ? 'intermédiaire' : tex}`);
  if (nut) parts.push(`une richesse ${nut === 'équilibré' ? 'moyenne' : nut}`);
  if (ph) parts.push(`une réaction ${ph === 'équilibré' ? 'neutre' : ph}`);
  return `D'après la flore en place, le sol présenterait ${parts.join(', ')}.`;
}

// ============================================================
// Concordance détaillée sol / flore — 8 lignes (page 12)
// ============================================================

/** Niveau normalisé de lecture, identique pour le sol et la flore (méthode D.S. p.12) */
export type ReadLevel = 1 | 2 | 3; // 1 Faible · 2 Moyen · 3 Fort

export const READ_LEVEL_LABEL: Record<ReadLevel, string> = {
  1: 'Faible',
  2: 'Moyen',
  3: 'Fort',
};

export interface ConcordanceRow {
  key: EcoPoleKey;
  axis: EcoAxis;
  label: string;
  soil: string;   // lecture Étape 2 (texte)
  flora: string;  // lecture Étape 3 (texte)
  /** niveau normalisé 1..3 — null si la donnée sol est absente */
  soilLevel: ReadLevel | null;
  floraLevel: ReadLevel;
  floraPoints: number;
  match: AxisMatch;
  /** points de la ligne : 2 / 1 / 0 */
  rowPoints: number;
}

export type IcgBand = 'bonne' | 'moyenne' | 'faible';

export const ICG_BAND_LABEL: Record<IcgBand, string> = {
  bonne: 'Bonne cohérence',
  moyenne: 'Cohérence moyenne',
  faible: 'Faible cohérence',
};

export function icgBand(icg: number): IcgBand {
  if (icg >= 80) return 'bonne';
  if (icg >= 60) return 'moyenne';
  return 'faible';
}

export interface ConcordanceDetail {
  rows: ConcordanceRow[];
  points: number;   // score obtenu, /16
  max: number;      // toujours 16 (4 critères × 2 niveaux × 2 pts)
  icg: number;      // 0..100 = points ÷ 16 × 100
  band: IcgBand;
  /** nb de lignes réellement évaluées (données sol présentes) */
  evaluated: number;
  /** fiabilité = lignes évaluées ÷ 8, en % */
  reliability: number;
  counts: { oui: number; partiel: number; non: number; na: number };
}

/**
 * Lecture du sol (Étape 2) traduite sur chaque pôle : 0 absent d'intensité, 1..3 intensité, null = non renseigné.
 * La structure et la texture sont normalisées : les prélèvements écrivent « limon / sable / argile »,
 * le champ global hérité « limoneux / sableux / argileux ». Sans cette normalisation, une texture
 * pourtant renseignée était lue comme « Donnée manquante » et faisait chuter l'ICG.
 */
function soilPoleValue(soil: SoilLite, key: EcoPoleKey): number | null {
  const structure = normalizeStructure(soil.structure);
  const texture = normalizeTexture(soil.texture);
  switch (key) {
    case 'eau_frais':
      return structure === 'compacte' ? 3 : structure === 'grumeleuse' ? 1 : structure === 'particulaire' ? 0 : null;
    case 'eau_sec':
      return structure === 'particulaire' ? 3 : structure === 'grumeleuse' ? 1 : structure === 'compacte' ? 0 : null;
    case 'tex_argile_limon':
      return texture === 'limon_argile' ? 3 : texture === 'limon_moyen' ? 1 : texture === 'sable_limon' ? 0 : null;
    case 'tex_limon_sable':
      return texture === 'sable_limon' ? 3 : texture === 'limon_moyen' ? 1 : texture === 'limon_argile' ? 0 : null;
    case 'nutri_riche': {
      const n = soil.life_signs?.length ?? 0;
      return n === 0 && !structure ? null : n >= 3 ? 3 : n >= 1 ? 2 : 0;
    }
    case 'nutri_pauvre': {
      const n = soil.life_signs?.length ?? 0;
      return n === 0 && !structure ? null : n === 0 ? 3 : n <= 1 ? 1 : 0;
    }
    case 'ph_acide':
      return soil.ph == null ? null : soil.ph <= 5.5 ? 3 : soil.ph <= 6.5 ? 2 : soil.ph < 7 ? 1 : 0;
    case 'ph_calcaire':
      return soil.ph == null ? null : soil.ph >= 7.8 ? 3 : soil.ph >= 7.2 ? 2 : soil.ph > 7 ? 1 : 0;
  }
}

const soilWord = (v: number | null): string =>
  v == null ? 'Donnée manquante' : v >= 3 ? 'Marqué' : v === 2 ? 'Présent' : v === 1 ? 'Léger' : 'Non observé';

const floraWord = (level: EcoLevel, points: number): string =>
  points === 0 ? 'Aucun indice' : `${LEVEL_LABEL[level]} · ${points} pt${points > 1 ? 's' : ''}`;

/** Sol 0..3 → niveau normalisé 1..3 (0 « non observé » et 1 « léger » = Faible) */
const soilToLevel = (v: number): ReadLevel => (v >= 3 ? 3 : v === 2 ? 2 : 1);

/** Flore (ratio du pôle) → niveau normalisé 1..3 */
const floraToLevel = (points: number, ratio: number): ReadLevel =>
  points === 0 ? 1 : ratio >= 0.48 ? 3 : ratio >= 0.28 ? 2 : 1;

/**
 * Concordance sur les 8 lignes — méthode D.S. page 12.
 * Même niveau → OUI (2 pts) · un cran d'écart → PARTIEL (1 pt) · deux crans → NON (0 pt).
 * Une ligne sans donnée sol n'est pas évaluée : elle vaut 0 point et reste comptée
 * dans le dénominateur fixe de 16 (le guide ne réduit jamais le maximum).
 * ICG = (score obtenu ÷ 16) × 100.
 *
 * IMPORTANT — cohérence de l'ICG dans toute l'application : le `soil` passé ici
 * doit TOUJOURS être construit par `soilLiteFromState()` (les prélèvements de
 * l'Étape 2 priment, les champs globaux hérités ne servent que de repli).
 * Passer un `PropertySoilState` brut donne un ICG divergent d'un écran à l'autre.
 */
export function computeConcordanceDetail(observedIds: string[], soil: SoilLite): ConcordanceDetail {
  const scores = computePoleScores(observedIds);
  const rows: ConcordanceRow[] = ECO_POLES.map((pole) => {
    const s = poleScore(scores, pole.key);
    const sv = soilPoleValue(soil, pole.key);
    const floraLevel = floraToLevel(s.points, s.ratio);
    const soilLevel = sv == null ? null : soilToLevel(sv);

    let match: AxisMatch;
    if (soilLevel == null) match = 'na';
    else {
      const gap = Math.abs(soilLevel - floraLevel);
      match = gap === 0 ? 'oui' : gap === 1 ? 'partiel' : 'non';
    }
    const rowPoints = match === 'oui' ? 2 : match === 'partiel' ? 1 : 0;

    return {
      key: pole.key,
      axis: pole.axis,
      label: pole.label,
      soil: soilWord(sv),
      flora: floraWord(s.level, s.points),
      soilLevel,
      floraLevel,
      floraPoints: s.points,
      match,
      rowPoints,
    };
  });

  const counts = { oui: 0, partiel: 0, non: 0, na: 0 };
  let points = 0;
  for (const r of rows) {
    counts[r.match] += 1;
    points += r.rowPoints;
  }
  const max = rows.length * 2; // 16, fixe
  const icg = Math.round((points / max) * 100);
  const evaluated = rows.length - counts.na;
  const reliability = Math.round((evaluated / rows.length) * 100);
  return { rows, points, max, icg, band: icgBand(icg), evaluated, reliability, counts };
}


export const ECO_SOURCE =
  'Source des données écologiques : CNPF — 2018 — G. Dumé ; C. Gauberville ; D. Mansion ; J.-C. Rameau — Flore forestière française, Guide écologique illustré — 1 Plaines et Collines.';
