/**
 * Référentiel BBCH (Carnet Phéno v1)
 * Sources : INRAE `phenologicalstages` + AgroPortal PPDO/PPD-GEN.
 *
 * 10 stades macro (BBCH 0–9), libellés FR, emoji adapté par culture.
 * `inatTaxonId` permet la détection auto via scientificName d'une observation.
 */

export type BbchCropKey =
  | 'grapevine'
  | 'wheat'
  | 'oilseedRape'
  | 'sunflower'
  | 'fabaBean'
  | 'beet'
  | 'hemp'
  | 'stoneFruits.cherry'
  | 'stoneFruits.plum'
  | 'stoneFruits.peach'
  | 'pomeFruits.pear'
  | 'strawberry'
  | 'oliveTree';

export interface BbchCrop {
  key: BbchCropKey;
  labelFr: string;
  scientificName: string;
  emoji: string;
  ontologyUri: string;
  /** Stades macro 0..9 surchargés (emoji + label). Fallback sur GENERIC_STAGES. */
  stages?: Partial<Record<number, { emoji: string; labelFr: string }>>;
}

export interface BbchStage {
  macro: number;
  emoji: string;
  labelFr: string;
  uri: string;
}

/** 10 stades macro génériques BBCH (PPD-GEN). */
const GENERIC_STAGES: Record<number, { emoji: string; labelFr: string }> = {
  0: { emoji: '🌰', labelFr: 'Germination / bourgeons' },
  1: { emoji: '🌱', labelFr: 'Levée / 1ʳᵉˢ feuilles' },
  2: { emoji: '🍃', labelFr: 'Talles / pousses latérales' },
  3: { emoji: '📏', labelFr: 'Élongation de la tige' },
  4: { emoji: '🌿', labelFr: 'Développement végétatif' },
  5: { emoji: '🌾', labelFr: 'Apparition inflorescence' },
  6: { emoji: '🌸', labelFr: 'Floraison' },
  7: { emoji: '🫐', labelFr: 'Fructification' },
  8: { emoji: '🍯', labelFr: 'Maturation' },
  9: { emoji: '🍂', labelFr: 'Sénescence / récolte' },
};

const PPD_BASE = 'https://opendata.inrae.fr/ppd-res';

export const BBCH_CROPS: BbchCrop[] = [
  {
    key: 'grapevine',
    labelFr: 'Vigne',
    scientificName: 'Vitis vinifera',
    emoji: '🍇',
    ontologyUri: `${PPD_BASE}/grapevine`,
    stages: {
      6: { emoji: '🌸', labelFr: 'Floraison (capuchons tombent)' },
      7: { emoji: '🍇', labelFr: 'Baies vertes / nouaison' },
      8: { emoji: '🍷', labelFr: 'Véraison / maturation' },
      9: { emoji: '🍂', labelFr: 'Chute des feuilles / vendange' },
    },
  },
  {
    key: 'wheat',
    labelFr: 'Blé',
    scientificName: 'Triticum aestivum',
    emoji: '🌾',
    ontologyUri: `${PPD_BASE}/cereals`,
    stages: {
      1: { emoji: '🌱', labelFr: 'Levée (1ʳᵉ feuille)' },
      2: { emoji: '🍃', labelFr: 'Tallage' },
      4: { emoji: '🛡️', labelFr: 'Gainage (dernière feuille)' },
      5: { emoji: '🌾', labelFr: 'Épiaison' },
      8: { emoji: '🌾', labelFr: 'Maturation du grain' },
    },
  },
  {
    key: 'oilseedRape',
    labelFr: 'Colza',
    scientificName: 'Brassica napus',
    emoji: '🌼',
    ontologyUri: `${PPD_BASE}/oilseedRape`,
    stages: {
      5: { emoji: '🟡', labelFr: 'Boutons accolés' },
      6: { emoji: '🌼', labelFr: 'Floraison (fleurs jaunes)' },
      7: { emoji: '🫛', labelFr: 'Formation des siliques' },
      8: { emoji: '🟤', labelFr: 'Maturation des graines' },
    },
  },
  {
    key: 'sunflower',
    labelFr: 'Tournesol',
    scientificName: 'Helianthus annuus',
    emoji: '🌻',
    ontologyUri: `${PPD_BASE}/sunflower`,
    stages: {
      5: { emoji: '🌿', labelFr: 'Bouton floral visible' },
      6: { emoji: '🌻', labelFr: 'Floraison (capitule ouvert)' },
      7: { emoji: '⚫', labelFr: 'Remplissage des akènes' },
      9: { emoji: '🍂', labelFr: 'Capitule mûr / récolte' },
    },
  },
  {
    key: 'fabaBean',
    labelFr: 'Féverole',
    scientificName: 'Vicia faba',
    emoji: '🫛',
    ontologyUri: `${PPD_BASE}/fabaBean`,
    stages: {
      6: { emoji: '🤍', labelFr: 'Floraison (fleurs blanches/noires)' },
      7: { emoji: '🫛', labelFr: 'Formation des gousses' },
      8: { emoji: '🟤', labelFr: 'Maturation des graines' },
    },
  },
  {
    key: 'beet',
    labelFr: 'Betterave',
    scientificName: 'Beta vulgaris',
    emoji: '🟣',
    ontologyUri: `${PPD_BASE}/beet`,
    stages: {
      4: { emoji: '🟣', labelFr: 'Grossissement de la racine' },
      9: { emoji: '🍂', labelFr: 'Récolte' },
    },
  },
  {
    key: 'hemp',
    labelFr: 'Chanvre',
    scientificName: 'Cannabis sativa',
    emoji: '🌿',
    ontologyUri: `${PPD_BASE}/hemp`,
  },
  {
    key: 'stoneFruits.cherry',
    labelFr: 'Cerisier',
    scientificName: 'Prunus avium',
    emoji: '🍒',
    ontologyUri: `${PPD_BASE}/stoneFruits`,
    stages: {
      0: { emoji: '🌰', labelFr: 'Bourgeons d\'hiver' },
      6: { emoji: '🌸', labelFr: 'Pleine floraison' },
      7: { emoji: '🍒', labelFr: 'Cerises vertes en formation' },
      8: { emoji: '🍒', labelFr: 'Maturation (rougissement)' },
    },
  },
  {
    key: 'stoneFruits.plum',
    labelFr: 'Prunier',
    scientificName: 'Prunus domestica',
    emoji: '🟣',
    ontologyUri: `${PPD_BASE}/stoneFruits`,
    stages: {
      6: { emoji: '🤍', labelFr: 'Floraison (fleurs blanches)' },
      7: { emoji: '🟢', labelFr: 'Prunes vertes en formation' },
      8: { emoji: '🟣', labelFr: 'Maturation (prunes bleues)' },
    },
  },
  {
    key: 'stoneFruits.peach',
    labelFr: 'Pêcher',
    scientificName: 'Prunus persica',
    emoji: '🍑',
    ontologyUri: `${PPD_BASE}/stoneFruits`,
    stages: {
      6: { emoji: '🌸', labelFr: 'Floraison (rose)' },
      7: { emoji: '🟢', labelFr: 'Pêches vertes' },
      8: { emoji: '🍑', labelFr: 'Maturation (coloration)' },
    },
  },
  {
    key: 'pomeFruits.pear',
    labelFr: 'Poirier',
    scientificName: 'Pyrus communis',
    emoji: '🍐',
    ontologyUri: `${PPD_BASE}/pomeFruits`,
    stages: {
      6: { emoji: '🤍', labelFr: 'Floraison' },
      7: { emoji: '🟢', labelFr: 'Jeunes poires' },
      8: { emoji: '🍐', labelFr: 'Maturation' },
    },
  },
  {
    key: 'strawberry',
    labelFr: 'Fraisier',
    scientificName: 'Fragaria vesca',
    emoji: '🍓',
    ontologyUri: `${PPD_BASE}/strawberry`,
    stages: {
      6: { emoji: '🤍', labelFr: 'Floraison' },
      7: { emoji: '🟢', labelFr: 'Fraises vertes' },
      8: { emoji: '🍓', labelFr: 'Maturation (rougissement)' },
    },
  },
  {
    key: 'oliveTree',
    labelFr: 'Olivier',
    scientificName: 'Olea europaea',
    emoji: '🫒',
    ontologyUri: `${PPD_BASE}/oliveTree`,
    stages: {
      6: { emoji: '🤍', labelFr: 'Floraison' },
      7: { emoji: '🟢', labelFr: 'Olives vertes' },
      8: { emoji: '🫒', labelFr: 'Véraison' },
    },
  },
];

/** Index par nom scientifique (lower-case, trimé). */
const CROP_BY_SCI = new Map<string, BbchCrop>(
  BBCH_CROPS.map((c) => [c.scientificName.toLowerCase().trim(), c]),
);

/** Détection auto : retourne la culture BBCH si l'espèce observée en fait partie. */
export function findCropByScientificName(scientificName?: string | null): BbchCrop | null {
  if (!scientificName) return null;
  const key = scientificName.toLowerCase().trim();
  if (CROP_BY_SCI.has(key)) return CROP_BY_SCI.get(key)!;
  // Match au genre (ex: "Triticum sp." → blé)
  const genus = key.split(/\s+/)[0];
  for (const crop of BBCH_CROPS) {
    if (crop.scientificName.toLowerCase().startsWith(genus + ' ')) return crop;
  }
  return null;
}

export function getCropByKey(key: string): BbchCrop | null {
  return BBCH_CROPS.find((c) => c.key === key) ?? null;
}

/** Renvoie les 10 stades pour une culture, après application des surcharges. */
export function getStagesForCrop(crop: BbchCrop): BbchStage[] {
  const out: BbchStage[] = [];
  for (let macro = 0; macro <= 9; macro++) {
    const override = crop.stages?.[macro];
    const base = GENERIC_STAGES[macro];
    out.push({
      macro,
      emoji: override?.emoji ?? base.emoji,
      labelFr: override?.labelFr ?? base.labelFr,
      uri: `${crop.ontologyUri}#stage-${macro}`,
    });
  }
  return out;
}

/** Couleur d'accent par stade (gradient germination → récolte). */
export function getStageColor(macro: number): string {
  const palette = [
    'hsl(45 30% 55%)',   // 0 germination
    'hsl(95 50% 50%)',   // 1 levée
    'hsl(120 55% 45%)',  // 2
    'hsl(140 55% 42%)',  // 3
    'hsl(160 55% 40%)',  // 4
    'hsl(55 75% 50%)',   // 5
    'hsl(40 85% 55%)',   // 6 floraison
    'hsl(25 80% 55%)',   // 7
    'hsl(15 75% 50%)',   // 8 maturation
    'hsl(25 25% 45%)',   // 9 sénescence
  ];
  return palette[Math.max(0, Math.min(9, macro))];
}
