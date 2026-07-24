import { PLANT_INDICATORS, type PlantIndicator } from './plantIndicatorKb';
import type { BiodiversitySpecies } from '@/types/biodiversity';

const norm = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+(spp?|sp)\.?$/i, '')
    .trim();

const genus = (s: string | null | undefined): string => norm(s).split(/\s+/)[0] || '';

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';
export type Freshness = 'fresh' | 'aging' | 'stale';

export interface FloraMatch {
  plant: PlantIndicator;
  species?: BiodiversitySpecies;
  observations: number;
  lastSeen: string | null;
  photos: string[];
  confidence: MatchConfidence;
  freshness: Freshness;
  matchKind: 'exact' | 'genus' | 'common' | 'none';
}

const now = () => Date.now();
const MONTH = 30 * 24 * 3600 * 1000;

function computeFreshness(lastSeen: string | null): Freshness {
  if (!lastSeen) return 'stale';
  const t = new Date(lastSeen).getTime();
  if (Number.isNaN(t)) return 'stale';
  const age = now() - t;
  if (age < 3 * MONTH) return 'fresh';
  if (age < 12 * MONTH) return 'aging';
  return 'stale';
}

function computeConfidence(obs: number, fresh: Freshness, kind: FloraMatch['matchKind']): MatchConfidence {
  if (obs === 0 || kind === 'none') return 'none';
  if (kind === 'exact' && (obs >= 2 || fresh === 'fresh')) return 'high';
  if (kind === 'exact') return 'medium';
  if (kind === 'genus') return obs >= 2 && fresh !== 'stale' ? 'medium' : 'low';
  return 'low';
}

export interface FloraMatchStats {
  totalPlants: number;
  revealed: number;   // high
  weak: number;       // medium/low
  hidden: number;     // none
  totalObservations: number;
  lastObservationDate: string | null;
  freshness: Freshness;
}

export function matchPlantsWithPool(pool: BiodiversitySpecies[]): {
  matches: FloraMatch[];
  stats: FloraMatchStats;
} {
  // index pool by normalized scientific name AND by genus
  const byExact = new Map<string, BiodiversitySpecies>();
  const byGenus = new Map<string, BiodiversitySpecies[]>();
  const byCommon = new Map<string, BiodiversitySpecies>();

  for (const sp of pool) {
    const n = norm(sp.scientificName);
    if (n) byExact.set(n, mergePick(byExact.get(n), sp));
    const g = genus(sp.scientificName);
    if (g) {
      const arr = byGenus.get(g) || [];
      arr.push(sp);
      byGenus.set(g, arr);
    }
    const c = norm(sp.commonName);
    if (c && !byCommon.has(c)) byCommon.set(c, sp);
  }

  const matches: FloraMatch[] = PLANT_INDICATORS.map((plant) => {
    const nLatin = norm(plant.latin);
    const gLatin = genus(plant.latin);
    const nNom = norm(plant.nom);

    let kind: FloraMatch['matchKind'] = 'none';
    let species: BiodiversitySpecies | undefined;
    let observations = 0;
    let lastSeen: string | null = null;
    let photos: string[] = [];

    if (nLatin && byExact.has(nLatin)) {
      species = byExact.get(nLatin);
      kind = 'exact';
    } else if (gLatin && byGenus.has(gLatin)) {
      const arr = byGenus.get(gLatin)!;
      // aggregate all species of same genus
      observations = arr.reduce((s, x) => s + (x.observations || 0), 0);
      lastSeen = arr
        .map((x) => x.lastSeen)
        .filter(Boolean)
        .sort()
        .reverse()[0] || null;
      photos = Array.from(new Set(arr.flatMap((x) => x.photos || []))).slice(0, 6);
      species = arr[0];
      kind = 'genus';
    } else if (nNom && byCommon.has(nNom)) {
      species = byCommon.get(nNom);
      kind = 'common';
    }

    if (species && kind !== 'genus') {
      observations = species.observations || 0;
      lastSeen = species.lastSeen || null;
      photos = (species.photos || []).slice(0, 6);
    }

    const freshness = computeFreshness(lastSeen);
    const confidence = computeConfidence(observations, freshness, kind);

    return { plant, species, observations, lastSeen, photos, confidence, freshness, matchKind: kind };
  });

  const revealed = matches.filter((m) => m.confidence === 'high').length;
  const weak = matches.filter((m) => m.confidence === 'medium' || m.confidence === 'low').length;
  const hidden = matches.filter((m) => m.confidence === 'none').length;
  const totalObservations = matches.reduce((s, m) => s + m.observations, 0);
  const lastObservationDate =
    matches
      .map((m) => m.lastSeen)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

  return {
    matches,
    stats: {
      totalPlants: PLANT_INDICATORS.length,
      revealed,
      weak,
      hidden,
      totalObservations,
      lastObservationDate,
      freshness: computeFreshness(lastObservationDate),
    },
  };
}

function mergePick(a: BiodiversitySpecies | undefined, b: BiodiversitySpecies): BiodiversitySpecies {
  if (!a) return b;
  return {
    ...a,
    observations: (a.observations || 0) + (b.observations || 0),
    lastSeen: (b.lastSeen || '') > (a.lastSeen || '') ? b.lastSeen : a.lastSeen,
    photos: Array.from(new Set([...(a.photos || []), ...(b.photos || [])])),
  };
}
