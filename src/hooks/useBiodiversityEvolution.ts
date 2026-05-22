import { useMemo } from 'react';
import { useFrenchSpeciesNamesAuto } from './useFrenchSpeciesNamesAuto';

export type DateSource = 'observation' | 'collection';
export type EvolutionMetric = 'species' | 'observations';
export type EvolutionPeriod =
  | 'all'
  | 'today'
  | '7d'
  | '30d'
  | 'last_month'
  | 'last_quarter'
  | '6m'
  | 'year'
  | '12m'
  | 'custom';

export interface CustomRange {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface DayObservation {
  scientificName: string;
  commonName?: string;
  commonNameFr?: string | null;
  kingdom?: string;
  photo?: string;
  observerName?: string;
  observerLogin?: string;
  observerAvatar?: string;
  source?: string;
  originalUrl?: string;
  marcheId?: string;
  isNewSpecies: boolean;
}

export interface DayBucket {
  date: string; // YYYY-MM-DD
  newSpecies: Map<string, DayObservation>; // sciName -> first obs
  reSpecies: Map<string, DayObservation>; // sciName -> sample obs
  observations: DayObservation[];
  marcheIds: Set<string>;
  contributors: Map<string, { name: string; count: number; profileUrl?: string; avatar?: string }>;
}

export interface EvolutionPoint {
  date: string;
  cumulative: number;
  daily: number;
  newSpeciesCount: number;
  observationsDaily: number;
}

export interface EvolutionResult {
  series: EvolutionPoint[];
  byDay: Map<string, DayBucket>;
  firstDate?: string;
  lastDate?: string;
  totalSpecies: number;
  totalObservations: number;
}

interface UseEvolutionOpts {
  dateSource: DateSource;
  metric: EvolutionMetric;
  period: EvolutionPeriod;
}

const periodToDays: Record<EvolutionPeriod, number | null> = {
  all: null,
  '12m': 365,
  '6m': 183,
  '3m': 92,
  '30d': 30,
};

const toDayISO = (d: string | Date | undefined | null): string | null => {
  if (!d) return null;
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

const inatProfileUrl = (login?: string) =>
  login ? `https://www.inaturalist.org/people/${encodeURIComponent(login)}` : undefined;

const guessLogin = (name?: string, originalUrl?: string): string | undefined => {
  // Try to extract login from observation URL? iNat URLs don't include it typically.
  // Fallback: slugify name.
  if (!name) return undefined;
  return name.trim().replace(/\s+/g, '_').toLowerCase();
};

export function useBiodiversityEvolution(
  snapshots: any[] | undefined | null,
  opts: UseEvolutionOpts
): EvolutionResult {
  // Collect species list once for the FR resolver (auto-fills DB cache in bg)
  const speciesForFr = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ scientificName: string; commonName: string | null }> = [];
    (snapshots || []).forEach((snap: any) => {
      const sd = snap?.species_data;
      if (!Array.isArray(sd)) return;
      sd.forEach((sp: any) => {
        const sci = (sp?.scientificName || sp?.commonName || '').toString().trim();
        if (!sci || seen.has(sci)) return;
        seen.add(sci);
        list.push({ scientificName: sci, commonName: sp?.commonName?.toString().trim() || null });
      });
    });
    return list;
  }, [snapshots]);
  const { data: frMap } = useFrenchSpeciesNamesAuto(speciesForFr);

  return useMemo(() => {
    const empty: EvolutionResult = {
      series: [],
      byDay: new Map(),
      totalSpecies: 0,
      totalObservations: 0,
    };
    if (!snapshots?.length) return empty;

    const { dateSource, metric, period } = opts;

    // Build per-day buckets across ALL snapshots, deduping species globally.
    const byDay = new Map<string, DayBucket>();
    // Track first appearance day per scientific name (cumulative species)
    const firstDayBySpecies = new Map<string, string>();

    const ensureBucket = (day: string): DayBucket => {
      let b = byDay.get(day);
      if (!b) {
        b = {
          date: day,
          newSpecies: new Map(),
          reSpecies: new Map(),
          observations: [],
          marcheIds: new Set(),
          contributors: new Map(),
        };
        byDay.set(day, b);
      }
      return b;
    };

    snapshots.forEach((snap: any) => {
      const sd = snap?.species_data;
      if (!sd || !Array.isArray(sd)) return;
      const snapDay = toDayISO(snap.snapshot_date) || toDayISO(snap.created_at);

      sd.forEach((sp: any) => {
        const sciName = (sp?.scientificName || sp?.commonName || sp?.id || '').trim();
        if (!sciName) return;
        const sciKey = sciName.toLowerCase();

        const attributions: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];

        if (dateSource === 'observation' && attributions.length > 0) {
          attributions.forEach(att => {
            const day = toDayISO(att?.date);
            if (!day) return;
            const obs: DayObservation = {
              scientificName: sciName,
              commonName: sp.commonName,
              commonNameFr: frMap?.get(sciName)?.commonNameFr ?? sp.commonNameFr ?? null,
              kingdom: sp.kingdom,
              photo: Array.isArray(sp.photos) && sp.photos[0] ? sp.photos[0] : undefined,
              observerName: att.observerName,
              observerLogin: guessLogin(att.observerName, att.originalUrl),
              source: att.source,
              originalUrl: att.originalUrl,
              marcheId: snap.marche_id,
              isNewSpecies: false,
            };
            const bucket = ensureBucket(day);
            bucket.observations.push(obs);
            if (snap.marche_id) bucket.marcheIds.add(snap.marche_id);
            if (obs.observerName) {
              const c = bucket.contributors.get(obs.observerName) || {
                name: obs.observerName,
                count: 0,
                profileUrl: inatProfileUrl(obs.observerLogin),
              };
              c.count += 1;
              bucket.contributors.set(obs.observerName, c);
            }
            // Track first appearance
            const firstDay = firstDayBySpecies.get(sciKey);
            if (!firstDay || day < firstDay) {
              firstDayBySpecies.set(sciKey, day);
            }
          });
        } else {
          // Collection date mode (or no attributions): one observation on snapshot day
          const day = snapDay;
          if (!day) return;
          const obs: DayObservation = {
            scientificName: sciName,
            commonName: sp.commonName,
            commonNameFr: frMap?.get(sciName)?.commonNameFr ?? sp.commonNameFr ?? null,
            kingdom: sp.kingdom,
            photo: Array.isArray(sp.photos) && sp.photos[0] ? sp.photos[0] : undefined,
            marcheId: snap.marche_id,
            isNewSpecies: false,
          };
          const bucket = ensureBucket(day);
          bucket.observations.push(obs);
          if (snap.marche_id) bucket.marcheIds.add(snap.marche_id);
          const firstDay = firstDayBySpecies.get(sciKey);
          if (!firstDay || day < firstDay) {
            firstDayBySpecies.set(sciKey, day);
          }
        }
      });
    });

    // Now: split observations per bucket into newSpecies (first day appearance) vs reSpecies
    byDay.forEach((bucket, day) => {
      bucket.observations.forEach(obs => {
        const sciKey = obs.scientificName.toLowerCase();
        const firstDay = firstDayBySpecies.get(sciKey);
        const isNew = firstDay === day;
        obs.isNewSpecies = isNew;
        const target = isNew ? bucket.newSpecies : bucket.reSpecies;
        if (!target.has(sciKey)) target.set(sciKey, obs);
      });
    });

    // Build sorted series
    const sortedDays = Array.from(byDay.keys()).sort();
    if (sortedDays.length === 0) return empty;

    // Apply period filter
    const cutoffDays = periodToDays[period];
    let filteredDays = sortedDays;
    if (cutoffDays != null) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - cutoffDays);
      const cutoffISO = cutoff.toISOString().slice(0, 10);
      filteredDays = sortedDays.filter(d => d >= cutoffISO);
    }

    // Cumulative is computed across ALL history up to that day (absolute cumulative),
    // even for filtered period — narrative continuity.
    const cumulativeByDay = new Map<string, number>();
    const seenSpecies = new Set<string>();
    sortedDays.forEach(day => {
      const bucket = byDay.get(day)!;
      bucket.newSpecies.forEach((_, k) => seenSpecies.add(k));
      cumulativeByDay.set(day, seenSpecies.size);
    });

    const series: EvolutionPoint[] = filteredDays.map(day => {
      const bucket = byDay.get(day)!;
      const dailySpecies = bucket.newSpecies.size + bucket.reSpecies.size;
      return {
        date: day,
        cumulative: cumulativeByDay.get(day) || 0,
        daily: metric === 'species' ? dailySpecies : bucket.observations.length,
        newSpeciesCount: bucket.newSpecies.size,
        observationsDaily: bucket.observations.length,
      };
    });

    // Total observations across all snapshots (within filtered period for header)
    let totalObs = 0;
    filteredDays.forEach(d => { totalObs += byDay.get(d)?.observations.length || 0; });

    return {
      series,
      byDay,
      firstDate: sortedDays[0],
      lastDate: sortedDays[sortedDays.length - 1],
      totalSpecies: seenSpecies.size,
      totalObservations: totalObs,
    };
  }, [snapshots, opts.dateSource, opts.metric, opts.period, frMap]);
}
