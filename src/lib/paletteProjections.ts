/**
 * Projections de la palette végétale recommandée — Étape 5.
 *
 * Trois lectures d'un même vivier d'espèces (`plantPaletteKb`), réparties en
 * quatre strates : Herbacées · Arbustes · Lianes · Arbres.
 *
 *  1. « En harmonie avec le sol »  → concordance stricte au profil du site.
 *  2. « Le garde-manger »          → comestibles, mellifères, fixatrices d'azote.
 *  3. « Le climat de demain »      → tenue à la sécheresse et aux canicules.
 *
 * Tout est déterministe et calculé en mémoire, sans appel réseau.
 */

import { PALETTE_KB, type PaletteSpecies } from './plantPaletteKb';
import { scoreSpecies, type SiteProfile, type ScoredSpecies } from './paletteEngine';

/* ── Strates d'affichage (regroupement éditorial) ────────────────────────── */

export type DisplayStrate = 'herbacee' | 'arbuste' | 'liane' | 'arbre';

export const DISPLAY_STRATE_ORDER: DisplayStrate[] = ['herbacee', 'arbuste', 'liane', 'arbre'];

export const DISPLAY_STRATE_LABEL: Record<DisplayStrate, string> = {
  herbacee: 'Herbacées',
  arbuste: 'Arbustes',
  liane: 'Lianes',
  arbre: 'Arbres',
};

export const DISPLAY_STRATE_HINT: Record<DisplayStrate, string> = {
  herbacee: 'Le tapis vivant, du couvre-sol à la vivace haute',
  arbuste: 'La strate de la haie, entre un et quatre mètres',
  liane: 'Ce qui grimpe, palisse et occupe la verticale',
  arbre: 'La canopée, l’ombre et le temps long',
};

export function toDisplayStrate(sp: PaletteSpecies): DisplayStrate {
  if (sp.strate === 'grimpante') return 'liane';
  if (sp.strate === 'arbre') return 'arbre';
  if (sp.strate === 'arbuste') return 'arbuste';
  return 'herbacee'; // herbacee + couvre_sol
}

/* ── Projections ─────────────────────────────────────────────────────────── */

export type ProjectionId = 'sol' | 'garde_manger' | 'climat';

export const PROJECTIONS: Array<{
  id: ProjectionId;
  label: string;
  tagline: string;
}> = [
  {
    id: 'sol',
    label: 'En harmonie avec le sol',
    tagline: 'Ce que la lecture du site autorise, sans assistance.',
  },
  {
    id: 'garde_manger',
    label: 'Le garde-manger',
    tagline: 'Nourrir la maison et les pollinisateurs, mois après mois.',
  },
  {
    id: 'climat',
    label: 'Le climat de demain',
    tagline: 'Ce qui tiendra encore debout dans les étés à venir.',
  },
];

/* ── 2. Garde-manger : récolte et vocation nourricière ───────────────────── */

export interface FoodTraits {
  /** Mois de production / récolte, 1 = janvier. */
  months: number[];
  /** Ce que l'on récolte réellement. */
  yieldLabel: string;
  edible: boolean;
  melliferous: boolean;
  nitrogen: boolean;
}

const MONTH_LABEL = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
export const MONTH_FULL = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];
export const monthShort = (m: number) => MONTH_LABEL[m - 1];

/** Récoltes documentées, espèce par espèce (mois de production). */
const HARVEST: Record<string, { months: number[]; label: string }> = {
  'prunus-avium': { months: [6, 7], label: 'Cerises' },
  'sorbus-domestica': { months: [9, 10], label: 'Cormes blettes' },
  'sorbus-torminalis': { months: [9, 10], label: 'Alises' },
  'sorbus-aucuparia': { months: [8, 9, 10], label: 'Baies (transformées)' },
  'juglans-regia': { months: [9, 10], label: 'Noix' },
  'castanea-sativa': { months: [10, 11], label: 'Châtaignes' },
  'malus-sylvestris': { months: [9, 10, 11], label: 'Pommes à cuire' },
  'pyrus-pyraster': { months: [9, 10], label: 'Poires à blettir' },
  'corylus-avellana': { months: [8, 9], label: 'Noisettes' },
  'prunus-spinosa': { months: [10, 11], label: 'Prunelles après gel' },
  'cornus-mas': { months: [8, 9], label: 'Cornouilles' },
  'sambucus-nigra': { months: [6, 8, 9], label: 'Fleurs puis baies' },
  'rosa-canina': { months: [10, 11, 12], label: 'Cynorhodons' },
  'hippophae-rhamnoides': { months: [9, 10], label: 'Argouses' },
  'amelanchier-ovalis': { months: [7, 8], label: 'Amélanches' },
  'rubus-fruticosus': { months: [8, 9], label: 'Mûres' },
  'ribes-rubrum': { months: [6, 7], label: 'Groseilles' },
  'ribes-nigrum': { months: [7, 8], label: 'Cassis' },
  'prunus-mahaleb': { months: [7, 8], label: 'Fruits à liqueur' },
  'vitis-vinifera': { months: [9, 10], label: 'Raisin' },
  'humulus-lupulus': { months: [9, 10], label: 'Cônes de houblon' },
  'fragaria-vesca': { months: [6, 7, 8], label: 'Fraises des bois' },
  'malva-sylvestris': { months: [6, 7, 8, 9], label: 'Feuilles et fleurs' },
  'sanguisorba-minor': { months: [4, 5, 6, 9, 10], label: 'Jeunes feuilles' },
  'origanum-vulgare': { months: [7, 8, 9], label: 'Origan séché' },
  'rosmarinus-officinalis': { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], label: 'Rameaux toute l’année' },
  'lavandula-angustifolia': { months: [7, 8], label: 'Fleurs à sécher' },
  'thymus-serpyllum': { months: [5, 6, 7, 8, 9], label: 'Feuilles aromatiques' },
  'hypericum-perforatum': { months: [6, 7], label: 'Sommités fleuries' },
  'borago-officinalis': { months: [6, 7, 8, 9], label: 'Fleurs comestibles' },
  'symphytum-officinale': { months: [5, 6, 7, 8, 9], label: 'Purin fertilisant' },
  'mentha-aquatica': { months: [6, 7, 8, 9], label: 'Feuilles aromatiques' },
  'primula-veris': { months: [3, 4], label: 'Fleurs comestibles' },
  'ilex-aquifolium': { months: [], label: '' },
};

/** Floraison mellifère approximative pour les espèces sans récolte propre. */
const BLOOM: Record<string, number[]> = {
  'salix-caprea': [2, 3],
  'salix-alba': [3, 4],
  'cornus-mas': [2, 3],
  'acer-campestre': [4, 5],
  'crataegus-monogyna': [5],
  'tilia-cordata': [6, 7],
  'ligustrum-vulgare': [6, 7],
  'frangula-alnus': [5, 6, 7, 8],
  'hedera-helix': [9, 10, 11],
  'lonicera-periclymenum': [6, 7, 8],
  'rosa-arvensis': [6, 7],
  'cytisus-scoparius': [4, 5],
  'ulex-europaeus': [1, 2, 3, 4, 12],
  'colutea-arborescens': [5, 6, 7],
  'coronilla-emerus': [4, 5, 6],
  'spartium-junceum': [5, 6, 7],
  'echium-vulgare': [5, 6, 7, 8],
  'phacelia-tanacetifolia': [5, 6, 7, 8, 9],
  'trifolium-pratense': [5, 6, 7, 8, 9],
  'lotus-corniculatus': [5, 6, 7, 8],
  'medicago-lupulina': [4, 5, 6, 7, 8],
  'achillea-millefolium': [6, 7, 8, 9],
  'centaurea-jacea': [6, 7, 8, 9],
  'knautia-arvensis': [6, 7, 8],
  'salvia-pratensis': [5, 6, 7],
  'leucanthemum-vulgare': [5, 6, 7],
  'scabiosa-columbaria': [7, 8, 9],
  'succisa-pratensis': [8, 9, 10],
  'daucus-carota': [6, 7, 8, 9],
  'dianthus-carthusianorum': [6, 7, 8],
  'galium-verum': [6, 7, 8],
  'silene-vulgaris': [5, 6, 7, 8],
  'verbascum-thapsus': [6, 7, 8],
  'nepeta-racemosa': [5, 6, 7, 8, 9],
  'perovskia-atriplicifolia': [7, 8, 9],
  'geranium-sanguineum': [5, 6, 7],
  'helianthemum-nummularium': [5, 6, 7],
  'prunella-vulgaris': [6, 7, 8],
  'ajuga-reptans': [4, 5, 6],
  'pulmonaria-officinalis': [3, 4],
  'digitalis-purpurea': [6, 7],
  'campanula-trachelium': [7, 8],
  'allium-sphaerocephalon': [6, 7],
  'stachys-byzantina': [6, 7],
  'sedum-acre': [6, 7],
  'filipendula-ulmaria': [6, 7, 8],
  'lythrum-salicaria': [7, 8, 9],
  'alnus-glutinosa': [2, 3],
  'corylus-avellana': [1, 2],
  'prunus-avium': [4],
  'malus-sylvestris': [4, 5],
  'pyrus-pyraster': [4],
  'amelanchier-ovalis': [4],
  'prunus-spinosa': [3, 4],
  'rosa-canina': [6],
  'rubus-fruticosus': [6, 7],
  'lavandula-angustifolia': [6, 7, 8],
  'origanum-vulgare': [7, 8],
  'thymus-serpyllum': [6, 7, 8],
  'cistus-albidus': [4, 5],
  'stipa-pennata': [5, 6],
  'symphytum-officinale': [5, 6, 7],
  'borago-officinalis': [5, 6, 7, 8, 9],
  'sanguisorba-minor': [5, 6],
  'malva-sylvestris': [6, 7, 8, 9],
  'hypericum-perforatum': [6, 7, 8],
  'primula-veris': [3, 4],
  'ribes-rubrum': [4],
  'ribes-nigrum': [4],
  'humulus-lupulus': [7, 8],
  'vitis-vinifera': [5, 6],
  'sambucus-nigra': [5, 6],
  'juglans-regia': [4, 5],
  'castanea-sativa': [6, 7],
  'prunus-mahaleb': [4, 5],
  'fragaria-vesca': [4, 5, 6],
  'rosmarinus-officinalis': [2, 3, 4, 9, 10],
  'santolina-chamaecyparissus': [6, 7],
  'mentha-aquatica': [7, 8, 9],
};

export function foodTraits(sp: PaletteSpecies): FoodTraits {
  const harvest = HARVEST[sp.id];
  const melliferous = sp.services.some((s) => s.includes('mellif') || s.includes('pollen'));
  const nitrogen = sp.services.some((s) => s.includes('fixateur'));
  const edible = Boolean(harvest?.months.length) ||
    sp.services.some((s) => s.includes('fruits') || s.includes('comestible') || s.includes('aromat'));

  if (harvest?.months.length) {
    return { months: harvest.months, yieldLabel: harvest.label, edible, melliferous, nitrogen };
  }
  const bloom = BLOOM[sp.id] ?? [];
  return {
    months: bloom,
    yieldLabel: melliferous ? 'Floraison nourricière' : nitrogen ? 'Azote pour le sol' : '',
    edible,
    melliferous,
    nitrogen,
  };
}

/** Score nourricier 0 → 100, pondéré par la concordance au sol. */
function foodScore(scored: ScoredSpecies): number {
  const t = foodTraits(scored.species);
  let v = 0;
  if (t.edible) v += 55;
  if (t.melliferous) v += 25;
  if (t.nitrogen) v += 18;
  v += Math.min(12, t.months.length * 2);
  // On ne recommande jamais contre le sol : la concordance reste un facteur.
  return Math.round(v * 0.6 + scored.score * 0.4);
}

/* ── 3. Climat de demain : tenue à l'aridité ─────────────────────────────── */

export interface ClimateTraits {
  /** -3 (exige la fraîcheur) → +3 (prospère en aridité). */
  aridity: number;
  /** 0 → 100 : tenue estimée à l'horizon choisi. */
  hold: number;
  note: string;
}

/**
 * Horizon 0 = aujourd'hui, 1 = 2050. Le déficit hydrique estival se creuse :
 * on décale la fenêtre de confort vers l'aridité.
 */
export const CLIMATE_SHIFT_MAX = 1.8;

export function climateTraits(sp: PaletteSpecies, horizon: number): ClimateTraits {
  const drought = sp.services.some((s) => s.includes('sécheresse'));
  // Optimum hydrique inversé : eau basse = tolérance à l'aridité.
  const aridity = Math.max(-3, Math.min(3, -sp.optima.eau + (drought ? 1 : 0)));
  const shift = horizon * CLIMATE_SHIFT_MAX;
  // Le site s'assèche : les espèces d'optimum humide décrochent.
  const gap = Math.max(0, sp.optima.eau + shift - 0.5);
  const hold = Math.round(Math.max(0, 100 - (gap / 4.5) * 100));
  const note =
    aridity >= 2
      ? 'Tient l’été sec sans arrosage'
      : aridity >= 0
        ? 'Supporte des étés moyennement secs'
        : 'Demande une terre qui reste fraîche';
  return { aridity, hold, note };
}

/* ── Composition d'une projection ────────────────────────────────────────── */

export interface ProjectedSpecies extends ScoredSpecies {
  display: DisplayStrate;
  /** Score de la projection courante, 0 → 100. */
  rank: number;
  /** Donnée manquante pour le critère de la projection : affichée en retrait. */
  incomplete: boolean;
}

export interface ProjectedStrate {
  strate: DisplayStrate;
  species: ProjectedSpecies[];
}

const PER_STRATE: Record<DisplayStrate, number> = {
  herbacee: 8,
  arbuste: 6,
  liane: 3,
  arbre: 5,
};

export function projectPalette(
  profile: SiteProfile,
  projection: ProjectionId,
  opts?: { exclude?: string[]; horizon?: number },
): ProjectedStrate[] {
  const excluded = new Set(opts?.exclude ?? []);
  const horizon = opts?.horizon ?? 0;

  const all: ProjectedSpecies[] = PALETTE_KB.filter((s) => !excluded.has(s.id)).map((sp) => {
    const scored = scoreSpecies(profile, sp);
    let rank = scored.score;
    let incomplete = false;

    if (projection === 'garde_manger') {
      const t = foodTraits(sp);
      rank = foodScore(scored);
      incomplete = !t.edible && !t.melliferous && !t.nitrogen;
      if (incomplete) rank = Math.round(rank * 0.35);
    } else if (projection === 'climat') {
      const c = climateTraits(sp, horizon);
      rank = Math.round(c.hold * 0.65 + scored.score * 0.35);
    }

    return { ...scored, display: toDisplayStrate(sp), rank, incomplete };
  });

  return DISPLAY_STRATE_ORDER.map((strate) => ({
    strate,
    species: all
      .filter((s) => s.display === strate)
      .sort(
        (a, b) =>
          Number(a.incomplete) - Number(b.incomplete) ||
          b.rank - a.rank ||
          (a.species.origin === 'indigene' ? -1 : 1),
      )
      .slice(0, PER_STRATE[strate]),
  })).filter((s) => s.species.length > 0);
}

/** Espèces retenues, tous étages confondus, pour les vues transverses. */
export function flatten(strates: ProjectedStrate[]): ProjectedSpecies[] {
  return strates.flatMap((s) => s.species);
}
