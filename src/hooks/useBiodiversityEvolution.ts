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
  customRange?: CustomRange;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function resolvePeriodRange(
  period: EvolutionPeriod,
  customRange?: CustomRange,
): { fromISO?: string; toISO?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'all':
      return {};
    case 'today':
      return { fromISO: toISO(today), toISO: toISO(today) };
    case '7d': {
      const from = new Date(today); from.setDate(from.getDate() - 6);
      return { fromISO: toISO(from), toISO: toISO(today) };
    }
    case '30d': {
      const from = new Date(today); from.setDate(from.getDate() - 29);
      return { fromISO: toISO(from), toISO: toISO(today) };
    }
    case 'last_month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { fromISO: toISO(from), toISO: toISO(to) };
    }
    case 'last_quarter': {
      const curQ = Math.floor(today.getMonth() / 3); // 0..3
      const prevQStartMonth = (curQ - 1) * 3;
      const year = prevQStartMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
      const startMonth = (prevQStartMonth + 12) % 12;
      const from = new Date(year, startMonth, 1);
      const to = new Date(year, startMonth + 3, 0);
      return { fromISO: toISO(from), toISO: toISO(to) };
    }
    case '6m': {
      const from = new Date(today); from.setMonth(from.getMonth() - 6);
      return { fromISO: toISO(from), toISO: toISO(today) };
    }
    case 'year': {
      const from = new Date(today.getFullYear(), 0, 1);
      return { fromISO: toISO(from), toISO: toISO(today) };
    }
    case '12m': {
      const from = new Date(today); from.setFullYear(from.getFullYear() - 1);
      return { fromISO: toISO(from), toISO: toISO(today) };
    }
    case 'custom':
      return { fromISO: customRange?.from, toISO: customRange?.to };
    default:
      return {};
  }
}

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
  opts: UseEvolutionOpts,
  marcheurObs?: any[] | null,
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
    (marcheurObs || []).forEach((o: any) => {
      const sci = (o?.species_scientific_name || '').toString().trim();
      if (!sci || seen.has(sci)) return;
      seen.add(sci);
      list.push({ scientificName: sci, commonName: null });
    });
    return list;
  }, [snapshots, marcheurObs]);
  const { data: frMap } = useFrenchSpeciesNamesAuto(speciesForFr);

  return useMemo(() => {
    const empty: EvolutionResult = {
      series: [],
      byDay: new Map(),
      totalSpecies: 0,
      totalObservations: 0,
    };
    if (!snapshots?.length && !marcheurObs?.length) return empty;

    const { dateSource, metric, period } = opts;

    // Build per-day buckets across ALL snapshots ∪ marcheur_observations,
    // déduplication par originalUrl (iNat) pour ne jamais compter deux fois
    // la même observation présente dans les deux sources.
    const byDay = new Map<string, DayBucket>();
    const firstDayBySpecies = new Map<string, string>();
    const seenObsKeys = new Set<string>();

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

    const pushObs = (day: string, obs: DayObservation, dedupKey?: string) => {
      if (dedupKey) {
        if (seenObsKeys.has(dedupKey)) return;
        seenObsKeys.add(dedupKey);
      }
      const bucket = ensureBucket(day);
      bucket.observations.push(obs);
      if (obs.marcheId) bucket.marcheIds.add(obs.marcheId);
      if (obs.observerName) {
        const c = bucket.contributors.get(obs.observerName) || {
          name: obs.observerName,
          count: 0,
          profileUrl: inatProfileUrl(obs.observerLogin),
          avatar: obs.observerAvatar,
        };
        c.count += 1;
        bucket.contributors.set(obs.observerName, c);
      }
      const sciKey = obs.scientificName.toLowerCase();
      const firstDay = firstDayBySpecies.get(sciKey);
      if (!firstDay || day < firstDay) firstDayBySpecies.set(sciKey, day);
    };

    (snapshots || []).forEach((snap: any) => {
      const sd = snap?.species_data;
      if (!sd || !Array.isArray(sd)) return;
      const snapDay = toDayISO(snap.snapshot_date) || toDayISO(snap.created_at);

      sd.forEach((sp: any) => {
        const sciName = (sp?.scientificName || sp?.commonName || sp?.id || '').trim();
        if (!sciName) return;

        const attributions: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];

        if (dateSource === 'observation' && attributions.length > 0) {
          attributions.forEach(att => {
            const day = toDayISO(att?.date);
            if (!day) return;
            const dedupKey = att?.originalUrl
              ? `url:${att.originalUrl}`
              : `snap:${sciName}|${att?.observerName || ''}|${day}`;
            pushObs(day, {
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
            }, dedupKey);
          });
        } else {
          const day = snapDay;
          if (!day) return;
          pushObs(day, {
            scientificName: sciName,
            commonName: sp.commonName,
            commonNameFr: frMap?.get(sciName)?.commonNameFr ?? sp.commonNameFr ?? null,
            kingdom: sp.kingdom,
            photo: Array.isArray(sp.photos) && sp.photos[0] ? sp.photos[0] : undefined,
            marcheId: snap.marche_id,
            isNewSpecies: false,
          });
        }
      });
    });

    // ── marcheur_observations : fusion sur le même axe temporel ──
    // Indispensable : les obs très récentes (iNat backfill ou upload marcheur)
    // n'ont pas encore atterri dans biodiversity_snapshots. Sans cette boucle
    // elles disparaissent du « Pouls du vivant » alors qu'elles comptent
    // bien dans l'inventaire (get_exploration_species_count).
    (marcheurObs || []).forEach((o: any) => {
      const sciName = (o?.species_scientific_name || '').trim();
      if (!sciName) return;
      const inatId = o?.inaturalist_observation_id;
      const day = toDayISO(o?.observation_date) || toDayISO(o?.created_at);
      if (!day) return;
      const dedupKey = inatId
        ? `url:https://www.inaturalist.org/observations/${inatId}`
        : `mo:${o.id || `${sciName}|${day}|${o?.marche_id || ''}`}`;
      const crew = o?.exploration_marcheurs;
      const observerName = `${crew?.prenom || ''} ${crew?.nom || ''}`.trim()
        || (inatId ? 'Contributeur iNaturalist' : 'Marcheur');
      pushObs(day, {
        scientificName: sciName,
        commonName: null,
        commonNameFr: frMap?.get(sciName)?.commonNameFr ?? null,
        kingdom: undefined,
        photo: o?.photo_url || undefined,
        observerName,
        observerLogin: guessLogin(observerName),
        source: inatId ? 'inaturalist' : 'marcheur',
        originalUrl: inatId ? `https://www.inaturalist.org/observations/${inatId}` : undefined,
        marcheId: o?.marche_id,
        isNewSpecies: false,
      }, dedupKey);
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

    // Apply period filter (calendar-aware)
    const { fromISO, toISO: toISOEnd } = resolvePeriodRange(period, opts.customRange);
    let filteredDays = sortedDays;
    if (fromISO) filteredDays = filteredDays.filter(d => d >= fromISO);
    if (toISOEnd) filteredDays = filteredDays.filter(d => d <= toISOEnd);


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
  }, [snapshots, marcheurObs, opts.dateSource, opts.metric, opts.period, opts.customRange?.from, opts.customRange?.to, frMap]);
}
