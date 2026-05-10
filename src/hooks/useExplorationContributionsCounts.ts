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
 * Lookup helper: matche en **égalité stricte** sur un set d'alias normalisés
 * (nom complet + variantes + logins science iNaturalist/GBIF/eBird).
 *
 * Le fallback `includes` historique est volontairement supprimé : il causait
 * des faux négatifs pour les logins iNat concaténés (`laurencekarki` ne
 * matche pas `laurence karki`) ET des faux positifs (un observateur
 * "Laurence" matchait n'importe quelle Laurence X).
 */
export const lookupContributions = (
  counts: Map<string, number> | undefined,
  prenom: string,
  nom: string,
  aliases?: string[]
): number => {
  if (!counts || counts.size === 0) return 0;
  const candidates = new Set<string>();
  const full = normalizeName(`${prenom || ''} ${nom || ''}`);
  if (full) {
    candidates.add(full);
    candidates.add(full.replace(/\s+/g, '')); // variante concaténée
    candidates.add(normalizeName(`${nom || ''} ${prenom || ''}`));
  }
  (aliases || []).forEach((a) => {
    const n = (a || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (n) candidates.add(n);
  });
  let total = 0;
  candidates.forEach((c) => {
    const v = counts.get(c);
    if (typeof v === 'number') total += v;
  });
  return total;
};
