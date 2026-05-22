import { useMemo } from 'react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import {
  resolvePeriodRange,
  type CustomRange,
  type DateSource,
  type EvolutionPeriod,
} from './useBiodiversityEvolution';

interface Opts {
  period: EvolutionPeriod;
  customRange?: CustomRange;
  dateSource?: DateSource;
}

const toDayISO = (d: string | undefined | null): string | null => {
  if (!d) return null;
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

/**
 * Re-projects a species list through the chart's period filter:
 * - keeps only attributions whose date falls in the [from, to] window
 * - recomputes the species' `observations` count
 * - excludes any species with zero attributions in window
 *
 * `period === 'all'` (or no bounds) is a pass-through for performance.
 * Note: the filter relies on `attribution.date` (terrain date) regardless of
 * `dateSource` — there is no per-attribution collection date available
 * downstream of the snapshot pipeline.
 */
export function useSpeciesFilteredByPeriod(
  species: BiodiversitySpecies[],
  { period, customRange }: Opts,
): BiodiversitySpecies[] {
  return useMemo(() => {
    if (!species?.length) return species || [];
    const { fromISO, toISO } = resolvePeriodRange(period, customRange);
    if (!fromISO && !toISO) return species;

    const result: BiodiversitySpecies[] = [];
    for (const sp of species) {
      const attrs = sp.attributions || [];
      const kept = attrs.filter((a) => {
        const d = toDayISO(a?.date);
        if (!d) return false;
        if (fromISO && d < fromISO) return false;
        if (toISO && d > toISO) return false;
        return true;
      });
      if (kept.length === 0) continue;
      result.push({ ...sp, attributions: kept, observations: kept.length });
    }
    return result;
  }, [species, period, customRange?.from, customRange?.to]);
}
