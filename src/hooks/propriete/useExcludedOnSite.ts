import { useMemo } from 'react';
import {
  usePropertySpeciesPool,
  type PropertyWaypoint,
} from '@/hooks/propriete/usePropertySpeciesPool';

/**
 * Étape 5 — « Refus assumés ».
 *
 * Croise les espèces écartées avec ce que les marcheurs ont réellement observé
 * sur la propriété : un refus constaté sur le terrain n'est plus un principe
 * abstrait, c'est une consigne de gestion localisée.
 *
 * L'appariement se fait sur le nom latin normalisé (NFD, minuscules) :
 *  - `species` : le binôme complet correspond (certitude)
 *  - `genus`   : seul le genre correspond (à confirmer, jamais affirmé comme sûr)
 */
export type ExcludedMatchLevel = 'none' | 'genus' | 'species';

export interface ExcludedPresence {
  latin: string;
  matchLevel: ExcludedMatchLevel;
  count: number;
  occurrences: PropertyWaypoint[];
  lastObservedOn: string | null;
  firstPhoto: string | null;
}

const norm = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const genusOf = (s: string) => norm(s).split(/\s+/)[0] || '';

export const excludedKey = (latin: string) => norm(latin);

export function useExcludedOnSite(
  proprieteId: string | undefined,
  exclusions: Array<{ latin: string }>,
) {
  const { waypoints, isLoading } = usePropertySpeciesPool(proprieteId);

  const usable = useMemo(
    () =>
      (waypoints ?? []).filter(
        (w) => w.overrideStatus !== 'excluded' && Number.isFinite(w.lat) && Number.isFinite(w.lng),
      ),
    [waypoints],
  );

  const presence = useMemo(() => {
    const map = new Map<string, ExcludedPresence>();

    for (const ex of exclusions) {
      const key = excludedKey(ex.latin);
      if (!key || map.has(key)) continue;
      const genus = genusOf(ex.latin);

      const exact: PropertyWaypoint[] = [];
      const generic: PropertyWaypoint[] = [];
      const seen = new Set<string>();

      for (const w of usable) {
        const n = norm(w.scientificName);
        if (!n) continue;
        const isExact = n === key;
        const isGenus = !isExact && !!genus && genusOf(n) === genus;
        if (!isExact && !isGenus) continue;
        // Dédup identique au pool : espèce + position au 5e décimal.
        const dedup = `${n}|${w.lat.toFixed(5)}|${w.lng.toFixed(5)}`;
        if (seen.has(dedup)) continue;
        seen.add(dedup);
        (isExact ? exact : generic).push(w);
      }

      const occurrences = exact.length > 0 ? exact : generic;
      const matchLevel: ExcludedMatchLevel =
        exact.length > 0 ? 'species' : generic.length > 0 ? 'genus' : 'none';

      const dates = occurrences
        .map((o) => o.observationDate)
        .filter((d): d is string => !!d)
        .sort();

      map.set(key, {
        latin: ex.latin,
        matchLevel,
        count: occurrences.length,
        occurrences,
        lastObservedOn: dates.length ? dates[dates.length - 1] : null,
        firstPhoto: occurrences.find((o) => o.photoUrl)?.photoUrl ?? null,
      });
    }

    return map;
  }, [exclusions, usable]);

  const totalOnSite = useMemo(
    () => Array.from(presence.values()).filter((p) => p.count > 0).length,
    [presence],
  );

  return { presence, totalOnSite, allWaypoints: usable, isLoading };
}
