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
