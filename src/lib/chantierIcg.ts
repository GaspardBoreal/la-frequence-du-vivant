/**
 * Le Chantier — lecture ICG d'un lot d'ouvrages, avant et après travaux.
 *
 * Rien n'est réinventé ici : on réutilise le périmètre géométrique de
 * `ouvrageScope` (ray casting sur le tracé réel, jamais un disque autour du
 * centroïde), l'appariement des bio-indicatrices de `plantIndicatorMatcher`
 * et, surtout, le barème D.S. page 12 déjà en service dans « J'identifie »
 * (`computeConcordanceDetail`). Le Chantier ne change pas le calcul : il le
 * restreint au lot et le rejoue sur trois états — avant, projeté, constaté.
 */
import { classifyObservations, EDGE_TOLERANCE_M } from '@/lib/ouvrageScope';
import { matchPlantsWithPool } from '@/lib/plantIndicatorMatcher';
import {
  computeConcordanceDetail,
  type ConcordanceDetail,
  type ConcordanceRow,
  type SoilLite,
} from '@/lib/plantIndicatorKb';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';

/** Rigueur du périmètre, identique au curseur du Scénographe. */
export type ChantierRigour = 'strict' | 'lisiere' | 'voisinage';

export const RIGOUR_LABEL: Record<ChantierRigour, string> = {
  strict: 'Emprise stricte',
  lisiere: `Emprise + lisière ${EDGE_TOLERANCE_M} m`,
  voisinage: 'Emprise + voisinage 15 m',
};

const NEIGHBOUR_M = 15;

/** Observations retenues pour un lot d'ouvrages, dédupliquées par identifiant. */
export function scopeWaypoints(
  geometries: any[],
  waypoints: PropertyWaypoint[],
  rigour: ChantierRigour,
): PropertyWaypoint[] {
  const seen = new Set<string>();
  const out: PropertyWaypoint[] = [];
  for (const geometry of geometries) {
    if (!geometry) continue;
    const res = classifyObservations(
      geometry,
      waypoints,
      rigour === 'voisinage' ? NEIGHBOUR_M : 0,
      rigour === 'strict' ? 0 : EDGE_TOLERANCE_M,
    );
    const keep = [
      ...res.dedans,
      ...(rigour === 'strict' ? [] : res.lisiere),
      ...(rigour === 'voisinage' ? res.voisinage : []),
    ];
    for (const s of keep) {
      if (seen.has(s.item.id)) continue;
      seen.add(s.item.id);
      out.push(s.item);
    }
  }
  return out;
}

/** Regroupe des observations en espèces, au format attendu par l'appariement. */
export function poolFromWaypoints(waypoints: PropertyWaypoint[]): BiodiversitySpecies[] {
  const by = new Map<string, BiodiversitySpecies>();
  for (const w of waypoints) {
    const key = (w.scientificName || '').trim().toLowerCase();
    if (!key) continue;
    const prev = by.get(key);
    if (prev) {
      prev.observations += 1;
      if (w.observationDate && (!prev.lastSeen || w.observationDate > prev.lastSeen))
        prev.lastSeen = w.observationDate;
      if (w.photoUrl && prev.photos.length < 6) prev.photos.push(w.photoUrl);
      if (!prev.commonName && w.commonName) prev.commonName = w.commonName;
      continue;
    }
    by.set(key, {
      id: key,
      scientificName: w.scientificName,
      commonName: w.commonName || '',
      family: '',
      kingdom: (w.kingdom as any) || 'Other',
      observations: 1,
      lastSeen: w.observationDate || '',
      photos: w.photoUrl ? [w.photoUrl] : [],
      source: w.source === 'marcheur' ? 'marcheur' : 'inaturalist',
      attributions: [],
    } as BiodiversitySpecies);
  }
  return Array.from(by.values());
}

/** Bio-indicatrices réellement reconnues dans un pool d'espèces. */
export function observedIndicatorIds(pool: BiodiversitySpecies[]): string[] {
  const { matches } = matchPlantsWithPool(pool);
  return matches.filter((m) => m.confidence !== 'none').map((m) => m.plant.id);
}

/**
 * Le jury des espèces — contribution nette d'une bio-indicatrice à l'ICG.
 *
 * Méthode : retrait à un. On recalcule le même barème D.S. sans l'espèce,
 * sur le même sol ; l'écart est sa contribution signée. Aucun barème n'est
 * dupliqué : c'est `computeConcordanceDetail` qui tranche, comme partout.
 */
export interface SpeciesVerdict {
  plantId: string;
  plantName: string;
  latin: string | null;
  /** Nom scientifique observé sur le terrain (peut différer du latin de la fiche). */
  scientificName: string;
  commonName: string | null;
  photoUrl: string | null;
  observations: number;
  /** Pôles écologiques sur lesquels l'espèce pèse réellement. */
  poles: Array<{ key: string; short: string; intensity: number }>;
  deltaPoints: number;
  deltaIcg: number;
  direction: 'up' | 'down' | 'flat';
}

export interface SpeciesJuryResult {
  verdicts: SpeciesVerdict[];
  up: SpeciesVerdict[];
  down: SpeciesVerdict[];
  flat: SpeciesVerdict[];
  /** Espèces observées sans fiche bio-indicatrice : elles ne pèsent pas sur l'ICG. */
  unmatched: Array<{ scientificName: string; commonName: string | null; observations: number }>;
  /** Phrase de synthèse, écrite en clair. */
  sentence: string;
}

export function speciesIcgJury(pool: BiodiversitySpecies[], soil: SoilLite): SpeciesJuryResult {
  const { matches } = matchPlantsWithPool(pool);
  const kept = matches.filter((m) => m.confidence !== 'none');
  const ids = kept.map((m) => m.plant.id);
  const full = computeConcordanceDetail(ids, soil);

  const verdicts: SpeciesVerdict[] = kept.map((m) => {
    const without = computeConcordanceDetail(
      ids.filter((id) => id !== m.plant.id),
      soil,
    );
    const deltaPoints = full.points - without.points;
    const deltaIcg = full.icg - without.icg;
    return {
      plantId: m.plant.id,
      plantName: m.plant.nom,
      latin: m.plant.latin ?? null,
      scientificName: m.species?.scientificName || m.plant.latin || m.plant.nom,
      commonName: m.species?.commonName || null,
      photoUrl: m.photos?.[0] ?? null,
      observations: m.observations,
      poles: ECO_POLES.map((p) => ({
        key: p.key,
        short: p.short,
        intensity: poleIntensity(m.plant, p),
      })).filter((p) => p.intensity > 0),
      deltaPoints,
      deltaIcg,
      direction: deltaPoints > 0 ? 'up' : deltaPoints < 0 ? 'down' : 'flat',
    };
  });

  const matchedNames = new Set(
    kept
      .map((m) => (m.species?.scientificName || '').trim().toLowerCase())
      .filter(Boolean),
  );
  const unmatched = pool
    .filter((s) => !matchedNames.has((s.scientificName || '').trim().toLowerCase()))
    .map((s) => ({
      scientificName: s.scientificName,
      commonName: s.commonName || null,
      observations: s.observations,
    }));

  const byWeight = (a: SpeciesVerdict, b: SpeciesVerdict) =>
    Math.abs(b.deltaPoints) - Math.abs(a.deltaPoints);
  const up = verdicts.filter((v) => v.direction === 'up').sort(byWeight);
  const down = verdicts.filter((v) => v.direction === 'down').sort(byWeight);
  const flat = verdicts.filter((v) => v.direction === 'flat');

  const named = (list: SpeciesVerdict[]) =>
    list.slice(0, 2).map((v) => v.plantName).join(' et ');
  const parts: string[] = [];
  if (up.length)
    parts.push(
      `${up.length} espèce${up.length > 1 ? 's confirment' : ' confirme'} la lecture du sol${up.length ? ` (surtout ${named(up)})` : ''}`,
    );
  if (down.length)
    parts.push(
      `${down.length} ${down.length > 1 ? 'la contredisent' : 'la contredit'} (${named(down)})`,
    );
  if (!parts.length)
    parts.push('aucune bio-indicatrice reconnue ne déplace le score sur ce périmètre');

  return {
    verdicts,
    up,
    down,
    flat,
    unmatched,
    sentence: `${parts.join(' · ')}.`,
  };
}

/** Les espèces posées dans un scénario deviennent la flore attendue après travaux. */
export function poolFromPlantings(plantings: Planting[]): BiodiversitySpecies[] {
  const today = new Date().toISOString().slice(0, 10);
  const by = new Map<string, BiodiversitySpecies>();
  for (const p of plantings) {
    const key = (p.scientificName || '').trim().toLowerCase();
    if (!key) continue;
    const prev = by.get(key);
    if (prev) {
      prev.observations += 1;
      continue;
    }
    by.set(key, {
      id: key,
      scientificName: p.scientificName,
      commonName: p.commonNameFr || '',
      family: '',
      kingdom: 'Plantae',
      observations: 1,
      lastSeen: today,
      photos: p.photoUrl ? [p.photoUrl] : [],
      source: 'inaturalist',
      attributions: [],
    } as BiodiversitySpecies);
  }
  return Array.from(by.values());
}

export interface IcgReading {
  detail: ConcordanceDetail;
  speciesCount: number;
  indicatorCount: number;
  /** Phrase du calcul, écrite en toutes lettres. */
  sentence: string;
}

export function readIcg(
  pool: BiodiversitySpecies[],
  soil: SoilLite,
): IcgReading {
  const ids = observedIndicatorIds(pool);
  const detail = computeConcordanceDetail(ids, soil);
  return {
    detail,
    speciesCount: pool.length,
    indicatorCount: ids.length,
    sentence: `${detail.points} point${detail.points > 1 ? 's' : ''} sur ${detail.max} → ${detail.icg} / 100 · ${detail.evaluated} critère${detail.evaluated > 1 ? 's' : ''} sur 8 réellement évalué${detail.evaluated > 1 ? 's' : ''}.`,
  };
}

export interface IcgDeltaRow {
  key: string;
  label: string;
  before: ConcordanceRow;
  after: ConcordanceRow;
  gain: number;
}

export interface IcgDelta {
  rows: IcgDeltaRow[];
  points: number;
  icg: number;
  /** Les lignes qui expliquent l'essentiel du gain (ou de la perte). */
  drivers: IcgDeltaRow[];
}

export function icgDelta(before: ConcordanceDetail, after: ConcordanceDetail): IcgDelta {
  const rows: IcgDeltaRow[] = before.rows.map((b, i) => {
    const a = after.rows[i];
    return { key: b.key, label: b.label, before: b, after: a, gain: a.rowPoints - b.rowPoints };
  });
  const drivers = rows
    .filter((r) => r.gain !== 0)
    .sort((x, y) => Math.abs(y.gain) - Math.abs(x.gain))
    .slice(0, 3);
  return {
    rows,
    points: after.points - before.points,
    icg: after.icg - before.icg,
    drivers,
  };
}

export const MATCH_LABEL: Record<string, string> = {
  oui: 'Concordance',
  partiel: 'Concordance partielle',
  non: 'Discordance',
  na: 'Donnée sol manquante',
};

/** Phase d'un média par rapport à la date des travaux. */
export type MediaPhase = 'avant' | 'pendant' | 'apres';

export const PHASE_LABEL: Record<MediaPhase, string> = {
  avant: 'Avant travaux',
  pendant: 'Pendant',
  apres: 'Après travaux',
};

/**
 * Phase déduite de la date de prise de vue : le jour même des travaux est
 * « pendant », avant c'est l'existant, après c'est le résultat.
 */
export function phaseFromDate(
  takenAt: string | null | undefined,
  workDate: string | null | undefined,
): MediaPhase {
  if (!workDate) return 'avant';
  if (!takenAt) return 'avant';
  const t = takenAt.slice(0, 10);
  const w = workDate.slice(0, 10);
  if (t < w) return 'avant';
  if (t === w) return 'pendant';
  return 'apres';
}

/** Observation postérieure aux travaux ? (ICG constaté) */
export const isAfterWorks = (
  date: string | null | undefined,
  workDate: string | null | undefined,
): boolean => {
  if (!workDate || !date) return false;
  return date.slice(0, 10) > workDate.slice(0, 10);
};
