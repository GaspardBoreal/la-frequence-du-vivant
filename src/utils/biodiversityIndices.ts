/**
 * Biodiversity diversity indices (Shannon, Simpson, Pielou).
 *
 * Built from the species_data.attributions arrays already present in
 * biodiversity_snapshots.
 */
import { countIndividuals, type AttributionLike } from './speciesIndividualCount';

export type CountMode = 'individuals' | 'observations';

export interface SpeciesAbundance {
  scientificName: string;
  commonName: string;
  kingdom: string;
  n: number;
}

export interface BiodiversityIndices {
  S: number;
  N: number;
  /** Simpson dominance D = Σ p² */
  D: number;
  /** Simpson diversity 1 - D */
  simpsonDiversity: number;
  /** Shannon entropy H' */
  H: number;
  /** Shannon max H'_max = ln(S) */
  Hmax: number;
  /** Pielou evenness J = H/Hmax (0 if S<=1) */
  J: number;
  /** Effective species number e^H */
  effectiveSpecies: number;
  /** Share (0..1) of the dominant species */
  topShare: number;
  topSpecies: SpeciesAbundance | null;
  /** Per-species share, sorted desc */
  shares: Array<SpeciesAbundance & { p: number }>;
}

export interface RawSpecies {
  scientificName?: string | null;
  commonName?: string | null;
  kingdom?: string | null;
  rank?: string | null;
  taxonRank?: string | null;
  attributions?: AttributionLike[] | null;
  observations?: number | null;
}

const isSpeciesLevel = (sp: RawSpecies): boolean => {
  const r = (sp.rank || sp.taxonRank || '').toString().toLowerCase();
  if (!r) {
    // No rank info: assume species-level if scientificName has 2+ words
    const name = (sp.scientificName || '').trim();
    return name.split(/\s+/).length >= 2;
  }
  return r === 'species' || r === 'subspecies' || r === 'variety';
};

export function computeAbundance(
  species: RawSpecies[],
  mode: CountMode,
  options: { clusterRadiusMeters?: number; speciesLevelOnly?: boolean } = {},
): SpeciesAbundance[] {
  const speciesLevelOnly = options.speciesLevelOnly ?? true;
  const out: SpeciesAbundance[] = [];
  for (const sp of species || []) {
    if (speciesLevelOnly && !isSpeciesLevel(sp)) continue;
    const attrs = Array.isArray(sp.attributions) ? sp.attributions : [];
    let n: number;
    if (mode === 'individuals') {
      const r = countIndividuals(attrs, { clusterRadiusMeters: options.clusterRadiusMeters });
      n = r.individuals || (sp.observations ?? attrs.length ?? 0) || 0;
    } else {
      n = attrs.length || sp.observations || 0;
    }
    if (n <= 0) continue;
    out.push({
      scientificName: sp.scientificName || '',
      commonName: sp.commonName || sp.scientificName || '',
      kingdom: sp.kingdom || 'Other',
      n,
    });
  }
  return out.sort((a, b) => b.n - a.n);
}

export function computeIndices(abundance: SpeciesAbundance[]): BiodiversityIndices {
  const S = abundance.length;
  const N = abundance.reduce((s, a) => s + a.n, 0);
  if (S === 0 || N === 0) {
    return {
      S: 0, N: 0, D: 0, simpsonDiversity: 0,
      H: 0, Hmax: 0, J: 0, effectiveSpecies: 0,
      topShare: 0, topSpecies: null, shares: [],
    };
  }
  const shares = abundance.map((a) => ({ ...a, p: a.n / N }));
  const D = shares.reduce((s, a) => s + a.p * a.p, 0);
  const H = -shares.reduce((s, a) => s + (a.p > 0 ? a.p * Math.log(a.p) : 0), 0);
  const Hmax = S > 1 ? Math.log(S) : 0;
  const J = Hmax > 0 ? H / Hmax : (S === 1 ? 1 : 0);
  return {
    S, N, D,
    simpsonDiversity: 1 - D,
    H, Hmax, J,
    effectiveSpecies: Math.exp(H),
    topShare: shares[0]?.p ?? 0,
    topSpecies: abundance[0] ?? null,
    shares,
  };
}

export type IndexLevel = 'critical' | 'dominated' | 'balanced' | 'harmony';

export interface IndexInterpretation {
  level: IndexLevel;
  headline: string;
  story: string;
  toneClass: string;
}

export function interpretSimpson(value1MinusD: number, top: SpeciesAbundance | null): IndexInterpretation {
  const v = value1MinusD;
  if (v >= 0.8) {
    return {
      level: 'harmony',
      headline: 'Diversité élevée',
      story: 'Aucun taxon n\'écrase les autres : deux individus tirés au hasard ont de fortes chances d\'appartenir à des espèces différentes.',
      toneClass: 'text-emerald-500',
    };
  }
  if (v >= 0.4) {
    return {
      level: 'balanced',
      headline: 'Quelques espèces dominent',
      story: 'Le peuplement est diversifié mais une poignée de taxons concentrent une part notable des effectifs.',
      toneClass: 'text-amber-500',
    };
  }
  return {
    level: v >= 0.2 ? 'dominated' : 'critical',
    headline: top ? `Forte dominance de ${top.commonName || top.scientificName}` : 'Forte dominance',
    story: 'Une espèce concentre l\'essentiel des effectifs : signe d\'une vulnérabilité écologique (faible résilience face aux pathogènes ou variations climatiques).',
    toneClass: 'text-red-500',
  };
}

export function interpretShannon(H: number, S: number): IndexInterpretation {
  const eff = Math.exp(H);
  if (H >= 2.5) {
    return {
      level: 'harmony',
      headline: 'Hétérogénéité remarquable',
      story: `Votre territoire équivaut à un milieu de ≈ ${eff.toFixed(1)} espèces parfaitement équilibrées.`,
      toneClass: 'text-emerald-500',
    };
  }
  if (H >= 1.5) {
    return {
      level: 'balanced',
      headline: 'Hétérogénéité modérée',
      story: `Diversité équivalente à ≈ ${eff.toFixed(1)} espèces équilibrées sur ${S} observées.`,
      toneClass: 'text-amber-500',
    };
  }
  return {
    level: H >= 0.7 ? 'dominated' : 'critical',
    headline: 'Hétérogénéité faible',
    story: 'L\'indice chute : une ou deux espèces écrasent la richesse réelle du territoire.',
    toneClass: 'text-red-500',
  };
}

export function interpretPielou(J: number, top: SpeciesAbundance | null, topShare: number): IndexInterpretation {
  if (J >= 0.85) {
    return {
      level: 'harmony',
      headline: 'Harmonie',
      story: 'Toutes les espèces ont des effectifs comparables — répartition très régulière.',
      toneClass: 'text-emerald-500',
    };
  }
  if (J >= 0.6) {
    return {
      level: 'balanced',
      headline: 'Répartition équilibrée',
      story: 'La distribution reste équilibrée mais quelques espèces tirent leur épingle du jeu.',
      toneClass: 'text-amber-500',
    };
  }
  const pct = Math.round(topShare * 100);
  const name = top?.commonName || top?.scientificName || 'une espèce';
  return {
    level: J >= 0.4 ? 'dominated' : 'critical',
    headline: 'Répartition déséquilibrée',
    story: `${name} représente à elle seule ${pct} % des individus et écrase la dynamique des autres populations.`,
    toneClass: 'text-red-500',
  };
}
