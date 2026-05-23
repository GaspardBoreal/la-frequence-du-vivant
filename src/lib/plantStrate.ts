/**
 * Classification de la strate végétale (arbre / arbuste / herbacée) pour
 * découper le parcours mellifère en 3 sous-parcours narratifs.
 *
 * Pipeline (priorité décroissante) :
 *  1. Override espèce (SPECIES_STRATE) — cas où le genre est ambigu
 *  2. Règle par genre (GENUS_STRATE)
 *  3. Règle par famille (FAMILY_STRATE)
 *  4. Fallback : 'herbacee' (toute mellifère sans indice ligneux)
 *
 * 100% client, mémoïsable. Aucun appel réseau.
 */

export type PlantStrate = 'arbre' | 'arbuste' | 'herbacee';

export interface StrateMeta {
  value: PlantStrate;
  emoji: string;
  /** Pluriel utilisé dans les titres de section */
  pluralLabel: string;
  /** Phrase narrative courte sous le titre */
  narrative: string;
  gradient: string;
}

export const STRATE_META: Record<PlantStrate, StrateMeta> = {
  arbre: {
    value: 'arbre',
    emoji: '🌳',
    pluralLabel: 'arbres mellifères',
    narrative: 'Floraisons précoces et ressources massives pour les colonies.',
    gradient: 'from-emerald-500/15 to-emerald-700/5',
  },
  arbuste: {
    value: 'arbuste',
    emoji: '🌿',
    pluralLabel: 'arbustes mellifères',
    narrative: 'Floraisons étalées en haie et lisière, le buffet du paysage.',
    gradient: 'from-lime-500/15 to-emerald-600/5',
  },
  herbacee: {
    value: 'herbacee',
    emoji: '🌼',
    pluralLabel: 'plantes mellifères',
    narrative: 'Nectar de proximité pour syrphes, papillons et abeilles solitaires.',
    gradient: 'from-yellow-400/20 to-amber-500/5',
  },
};

/** Cas espèces où le genre seul ne suffit pas (Prunus, Salix, Malva…). */
const SPECIES_STRATE: Record<string, PlantStrate> = {
  // Prunus : arbres vs arbustes
  'Prunus avium': 'arbre',
  'Prunus persica': 'arbre',
  'Prunus dulcis': 'arbre',
  'Prunus armeniaca': 'arbre',
  'Prunus domestica': 'arbre',
  'Prunus cerasus': 'arbre',
  'Prunus mahaleb': 'arbre',
  'Prunus padus': 'arbre',
  'Prunus laurocerasus': 'arbuste',
  'Prunus spinosa': 'arbuste',
  // Salix
  'Salix alba': 'arbre',
  'Salix caprea': 'arbre',
  'Salix cinerea': 'arbuste',
  'Salix integra': 'arbuste',
  'Salix purpurea': 'arbuste',
  'Salix viminalis': 'arbuste',
  // Cas KB DEVIAT
  'Ficus carica': 'arbre',
  'Cercis siliquastrum': 'arbre',
  'Sambucus nigra': 'arbuste',
  'Buddleja davidii': 'arbuste',
  'Weigela florida': 'arbuste',
  'Parthenocissus inserta': 'arbuste',
  // Romarin : ligneux mais traité comme herbacée aromatique en usage jardin
  'Salvia rosmarinus': 'herbacee',
  'Rosmarinus officinalis': 'herbacee',
};

/** Genres dont toutes les espèces partagent (en pratique) la même strate. */
const GENUS_STRATE: Record<string, PlantStrate> = {
  // Arbres
  Quercus: 'arbre',
  Fagus: 'arbre',
  Tilia: 'arbre',
  Castanea: 'arbre',
  Populus: 'arbre',
  Alnus: 'arbre',
  Fraxinus: 'arbre',
  Carpinus: 'arbre',
  Acer: 'arbre',
  Betula: 'arbre',
  Juglans: 'arbre',
  Ulmus: 'arbre',
  Robinia: 'arbre',
  Sorbus: 'arbre',
  Aesculus: 'arbre',
  Pinus: 'arbre',
  Cedrus: 'arbre',
  Abies: 'arbre',
  Picea: 'arbre',
  Platanus: 'arbre',
  Liquidambar: 'arbre',
  Liriodendron: 'arbre',
  Corylus: 'arbre', // noisetier = petit arbre / grand arbuste, traité arbre
  // Arbustes
  Crataegus: 'arbuste',
  Rosa: 'arbuste',
  Rubus: 'arbuste',
  Cornus: 'arbuste',
  Ligustrum: 'arbuste',
  Viburnum: 'arbuste',
  Lonicera: 'arbuste',
  Hedera: 'arbuste',
  Ilex: 'arbuste',
  Euonymus: 'arbuste',
  Berberis: 'arbuste',
  Hypericum: 'arbuste',
  Hibiscus: 'arbuste',
  Spiraea: 'arbuste',
  Forsythia: 'arbuste',
  Syringa: 'arbuste',
  Pyracantha: 'arbuste',
  Cotoneaster: 'arbuste',
  Mahonia: 'arbuste',
  // Herbacées mellifères classiques
  Lavandula: 'herbacee',
  Thymus: 'herbacee',
  Origanum: 'herbacee',
  Salvia: 'herbacee',
  Mentha: 'herbacee',
  Echium: 'herbacee',
  Borago: 'herbacee',
  Phacelia: 'herbacee',
  Trifolium: 'herbacee',
  Medicago: 'herbacee',
  Lotus: 'herbacee',
  Vicia: 'herbacee',
  Centaurea: 'herbacee',
  Taraxacum: 'herbacee',
  Helianthus: 'herbacee',
  Symphytum: 'herbacee',
  Papaver: 'herbacee',
  Nigella: 'herbacee',
  Anacamptis: 'herbacee',
  Centranthus: 'herbacee',
  Muscari: 'herbacee',
  Primula: 'herbacee',
  Malva: 'herbacee',
};

/** Familles : fallback large. */
const FAMILY_STRATE: Record<string, PlantStrate> = {
  Fagaceae: 'arbre',
  Betulaceae: 'arbre',
  Salicaceae: 'arbre',
  Juglandaceae: 'arbre',
  Aceraceae: 'arbre',
  Sapindaceae: 'arbre',
  Pinaceae: 'arbre',
  Cupressaceae: 'arbre',
  Oleaceae: 'arbre',
  Ulmaceae: 'arbre',
  Tiliaceae: 'arbre',
  Moraceae: 'arbre',
  // Plutôt arbustifs
  Ericaceae: 'arbuste',
  Caprifoliaceae: 'arbuste',
  Adoxaceae: 'arbuste',
  Cornaceae: 'arbuste',
  // Herbacées par défaut
  Asteraceae: 'herbacee',
  Lamiaceae: 'herbacee',
  Boraginaceae: 'herbacee',
  Apiaceae: 'herbacee',
  Brassicaceae: 'herbacee',
  Fabaceae: 'herbacee', // majoritairement (overridé par Robinia/Cercis au genre/espèce)
  Papaveraceae: 'herbacee',
  Ranunculaceae: 'herbacee',
  Orchidaceae: 'herbacee',
  Malvaceae: 'herbacee',
  Primulaceae: 'herbacee',
  Asparagaceae: 'herbacee',
};

export interface ClassifyStrateInput {
  scientificName?: string | null;
  family?: string | null;
}

/**
 * Renvoie la strate végétale d'une espèce, ou null si totalement inconnu.
 * Pour le drawer mellifère, on traite `null` comme 'herbacee' (fallback narratif).
 */
export function classifyStrate(sp: ClassifyStrateInput): PlantStrate | null {
  const sn = (sp.scientificName || '').trim();
  if (sn && SPECIES_STRATE[sn]) return SPECIES_STRATE[sn];

  const genus = sn.split(/\s+/)[0];
  if (genus && GENUS_STRATE[genus]) return GENUS_STRATE[genus];

  const family = (sp.family || '').trim();
  if (family && FAMILY_STRATE[family]) return FAMILY_STRATE[family];

  return null;
}

/** Variante "résolue" : null → 'herbacee' (fallback narratif mellifère). */
export function resolveStrate(sp: ClassifyStrateInput): PlantStrate {
  return classifyStrate(sp) || 'herbacee';
}
