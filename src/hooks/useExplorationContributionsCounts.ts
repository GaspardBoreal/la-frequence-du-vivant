import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const normalizeName = (str: string) =>
  (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Fetches biodiversity_snapshots once for the whole exploration and returns
 * a Map<normalizedFullName, contributionsCount> where each contribution is
 * deduplicated by `scientificName|date|source` per observer.
 *
 * Single source of truth shared between the parent (sorting) and each
 * MarcheurCard (badge + sub-tab counter).
 */
export const useExplorationContributionsCounts = (
  explorationId: string | undefined,
  explorationMarcheIds: string[]
) => {
  return useQuery({
    queryKey: ['exploration-contributions-counts', explorationId, explorationMarcheIds.slice().sort()],
    queryFn: async (): Promise<Map<string, number>> => {
      const result = new Map<string, number>();
      if (!explorationMarcheIds.length) return result;

      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', explorationMarcheIds);

      if (!data) return result;

      // Per-observer dedup sets
      const seenByObserver = new Map<string, Set<string>>();

      for (const snapshot of data) {
        const speciesArr = snapshot.species_data as any[];
        if (!Array.isArray(speciesArr)) continue;
        for (const sp of speciesArr) {
          const attributions = sp.attributions as any[];
          if (!Array.isArray(attributions)) continue;
          for (const attr of attributions) {
            const observerNorm = normalizeName(attr.observerName || '');
            if (!observerNorm) continue;
            const key = `${sp.scientificName}|${attr.date}|${attr.source}`;
            let seen = seenByObserver.get(observerNorm);
            if (!seen) {
              seen = new Set();
              seenByObserver.set(observerNorm, seen);
            }
            if (!seen.has(key)) {
              seen.add(key);
              result.set(observerNorm, (result.get(observerNorm) || 0) + 1);
            }
          }
        }
      }
      return result;
    },
    enabled: !!explorationId && explorationMarcheIds.length > 0,
    staleTime: 60_000,
  });
};

/**
 * Lookup helper: tries an exact match on the normalized full name first,
 * then falls back to a fuzzy contains-match (mirrors the original
 * useWalkerContributionsCount behavior).
 */
export const lookupContributions = (
  counts: Map<string, number> | undefined,
  prenom: string,
  nom: string
): number => {
  if (!counts || counts.size === 0) return 0;
  const target = normalizeName(`${prenom} ${nom}`);
  if (!target) return 0;
  const exact = counts.get(target);
  if (typeof exact === 'number') return exact;
  for (const [observer, count] of counts) {
    if (observer.includes(target) || target.includes(observer)) return count;
  }
  return 0;
};
