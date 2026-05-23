/**
 * Référentiel des fonctions écologiques (services rendus par une espèce).
 *
 * Couche **multi-étiquettes** orthogonale aux catégories de curation
 * (`indigene/eee/patrimoniale/...`) et aux niveaux trophiques.
 * Une même espèce peut porter 0..N fonctions.
 *
 * Sert de socle aux parcours "Partons à la découverte des arbres / mellifères /
 * fixateurs d'azote…" générés dynamiquement à partir des observations.
 */

export type EcoFunction =
  // 🌳 Architecture vivante
  | 'arbre'
  | 'haie_bocage'
  | 'vieil_arbre'
  // 🐝 Pollinisation & nourrissage
  | 'mellifere'
  | 'pollinisateur'
  | 'nourricier_oiseaux'
  | 'plante_hote_papillons'
  // 🌱 Fertilité & sol vivant
  | 'fixateur_azote'
  | 'ameliorant_sol'
  | 'decomposeur'
  // 💧 Régulation & résilience
  | 'phytoremediation'
  | 'refuge_faune';

export type EcoFamily = 'architecture' | 'pollinisation' | 'fertilite' | 'regulation';

export interface EcoFunctionMeta {
  value: EcoFunction;
  family: EcoFamily;
  /** Court (utilisé dans pastilles) */
  shortLabel: string;
  /** Phrase "Partons à la découverte des…" */
  journeyLabel: string;
  /** Phrase singulier pour micro-toast (+1) */
  singularLabel: string;
  /** Pourquoi ça compte — phrase courte storytelling */
  service: string;
  emoji: string;
  /** Gradient Tailwind utilitaire (from-… to-…) — utilise tokens HSL semantic */
  gradient: string;
  /** Poids dans l'indice de fertilité du lieu (0 = neutre) */
  fertilityWeight: number;
}

export const ECO_FUNCTIONS: EcoFunctionMeta[] = [
  // Architecture
  {
    value: 'arbre',
    family: 'architecture',
    shortLabel: 'Arbre',
    journeyLabel: 'arbres',
    singularLabel: 'arbre',
    service: 'Canopée, ombrage, mémoire longue du paysage.',
    emoji: '🌳',
    gradient: 'from-emerald-500/15 to-emerald-700/5',
    fertilityWeight: 1,
  },
  {
    value: 'haie_bocage',
    family: 'architecture',
    shortLabel: 'Haie',
    journeyLabel: 'espèces du bocage',
    singularLabel: 'haie / bocage',
    service: 'Maillage bocager : corridors écologiques et brise-vent.',
    emoji: '🌿',
    gradient: 'from-lime-500/15 to-emerald-600/5',
    fertilityWeight: 1,
  },
  {
    value: 'vieil_arbre',
    family: 'architecture',
    shortLabel: 'Arbre remarquable',
    journeyLabel: 'arbres remarquables',
    singularLabel: 'arbre remarquable',
    service: 'Cavités, lichens, micro-habitats irremplaçables.',
    emoji: '🪵',
    gradient: 'from-amber-700/15 to-emerald-700/5',
    fertilityWeight: 2,
  },
  // Pollinisation
  {
    value: 'mellifere',
    family: 'pollinisation',
    shortLabel: 'Mellifère',
    journeyLabel: 'plantes mellifères',
    singularLabel: 'plante mellifère',
    service: 'Nourrit abeilles, bourdons, syrphes.',
    emoji: '🌼',
    gradient: 'from-yellow-400/20 to-amber-500/5',
    fertilityWeight: 1,
  },
  {
    value: 'pollinisateur',
    family: 'pollinisation',
    shortLabel: 'Pollinisateur',
    journeyLabel: 'pollinisateurs',
    singularLabel: 'pollinisateur',
    service: 'Assure la reproduction des plantes à fleurs.',
    emoji: '🐝',
    gradient: 'from-yellow-500/20 to-orange-500/5',
    fertilityWeight: 1,
  },
  {
    value: 'nourricier_oiseaux',
    family: 'pollinisation',
    shortLabel: 'Nourricier oiseaux',
    journeyLabel: 'plantes nourricières des oiseaux',
    singularLabel: 'plante nourricière',
    service: 'Baies et graines pour l\'avifaune hivernale.',
    emoji: '🐦',
    gradient: 'from-rose-500/15 to-amber-500/5',
    fertilityWeight: 0,
  },
  {
    value: 'plante_hote_papillons',
    family: 'pollinisation',
    shortLabel: 'Plante-hôte',
    journeyLabel: 'plantes-hôtes de papillons',
    singularLabel: 'plante-hôte',
    service: 'Nourrit les chenilles, condition à la présence des papillons.',
    emoji: '🦋',
    gradient: 'from-violet-500/15 to-pink-500/5',
    fertilityWeight: 0,
  },
  // Fertilité
  {
    value: 'fixateur_azote',
    family: 'fertilite',
    shortLabel: 'Fixateur azote',
    journeyLabel: 'fixateurs d\'azote',
    singularLabel: 'fixateur d\'azote',
    service: 'Enrichit le sol en azote via symbioses racinaires.',
    emoji: '🌱',
    gradient: 'from-green-500/20 to-emerald-600/5',
    fertilityWeight: 3,
  },
  {
    value: 'ameliorant_sol',
    family: 'fertilite',
    shortLabel: 'Améliorant sol',
    journeyLabel: 'plantes améliorantes du sol',
    singularLabel: 'plante améliorante',
    service: 'Racines profondes, couvre-sol, mycorhizes — structure le sol.',
    emoji: '🪴',
    gradient: 'from-amber-500/15 to-green-600/5',
    fertilityWeight: 1,
  },
  {
    value: 'decomposeur',
    family: 'fertilite',
    shortLabel: 'Décomposeur',
    journeyLabel: 'décomposeurs',
    singularLabel: 'décomposeur',
    service: 'Recycle la matière morte — referme le cycle du vivant.',
    emoji: '⟲',
    gradient: 'from-stone-500/15 to-amber-700/5',
    fertilityWeight: 2,
  },
  // Régulation
  {
    value: 'phytoremediation',
    family: 'regulation',
    shortLabel: 'Phytoremédiation',
    journeyLabel: 'espèces dépolluantes',
    singularLabel: 'espèce dépolluante',
    service: 'Épure eau et sols (métaux lourds, nitrates).',
    emoji: '💧',
    gradient: 'from-sky-500/15 to-teal-600/5',
    fertilityWeight: 1,
  },
  {
    value: 'refuge_faune',
    family: 'regulation',
    shortLabel: 'Refuge faune',
    journeyLabel: 'refuges de faune',
    singularLabel: 'refuge',
    service: 'Cavités, ronciers, friches — gîte pour la petite faune.',
    emoji: '🏡',
    gradient: 'from-emerald-600/15 to-stone-500/5',
    fertilityWeight: 1,
  },
];

export const ECO_FAMILIES: Record<EcoFamily, { label: string; emoji: string }> = {
  architecture: { label: 'Architecture vivante', emoji: '🌳' },
  pollinisation: { label: 'Pollinisation & nourrissage', emoji: '🐝' },
  fertilite: { label: 'Fertilité & sol vivant', emoji: '🌱' },
  regulation: { label: 'Régulation & résilience', emoji: '💧' },
};

export const getEcoFunction = (v: EcoFunction): EcoFunctionMeta | undefined =>
  ECO_FUNCTIONS.find(f => f.value === v);

/** Formule indice de fertilité du lieu — score brut 0..N, normalisé côté UI. */
export function computeFertilityScore(buckets: Record<EcoFunction, unknown[]>): number {
  let s = 0;
  ECO_FUNCTIONS.forEach(f => {
    s += (buckets[f.value]?.length || 0) * f.fertilityWeight;
  });
  return s;
}
