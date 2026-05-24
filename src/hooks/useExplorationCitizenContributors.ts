import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildCitizenIdentityResolver, citizenDisplayName } from '@/utils/citizenIdentity';

export interface CitizenContributor {
  observerName: string;
  source: 'inaturalist' | 'ebird' | 'gbif' | string;
  speciesCount: number;
  obsCount: number;
  firstUrl: string | null;
}

/**
 * Aggregates citizen-science attributions from biodiversity_snapshots
 * for an exploration, EXCLUDING any observerName whose normalized alias
 * matches a known LMDV walker (so we never double-count them).
 *
 * Currently filters to source = 'inaturalist' (eBird/GBIF not surfaced here).
 */
export interface CitizenContributorsResult {
  contributors: CitizenContributor[];
  totalUniqueSpecies: number;
}

export function useExplorationCitizenContributors(
  explorationId: string | undefined,
  knownAliases: Set<string> | undefined,
) {
  const knownKey = knownAliases ? Array.from(knownAliases).sort().join('|') : '';

  return useQuery({
    queryKey: ['exploration-citizen-contributors', explorationId, knownKey],
    queryFn: async (): Promise<CitizenContributorsResult> => {
      if (!explorationId) return { contributors: [], totalUniqueSpecies: 0 };

      const { data: emRows } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);
      const marcheIds = (emRows || []).map((r: any) => r.marche_id).filter(Boolean);
      if (!marcheIds.length) return { contributors: [], totalUniqueSpecies: 0 };

      const { data: snapshots } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', marcheIds);

      type Acc = {
        observerName: string;
        source: string;
        species: Set<string>;
        obs: number;
        firstUrl: string | null;
      };
      const byKey = new Map<string, Acc>();
      const allSpecies = new Set<string>();

      // Pass A : collecter toutes les attributions iNat pour construire le resolver
      const allInatAttrs: any[] = [];
      for (const snap of snapshots || []) {
        const arr = (snap as any).species_data;
        if (!Array.isArray(arr)) continue;
        for (const sp of arr) {
          const attrs = Array.isArray(sp?.attributions) ? sp.attributions : [];
          for (const a of attrs) {
            if ((a?.source || '').toLowerCase() === 'inaturalist') allInatAttrs.push(a);
          }
        }
      }
      const resolve = buildCitizenIdentityResolver(allInatAttrs);

      // Pass B : agrégation avec clé canonique réconciliée
      for (const snap of snapshots || []) {
        const arr = (snap as any).species_data;
        if (!Array.isArray(arr)) continue;
        for (const sp of arr) {
          const attrs = Array.isArray(sp?.attributions) ? sp.attributions : [];
          for (const a of attrs) {
            const observerName = (a?.observerName || '').trim();
            const source = (a?.source || '').toLowerCase();
            if (!observerName || source !== 'inaturalist') continue;
            const canonical = resolve(a);
            if (!canonical) continue;
            if (knownAliases && knownAliases.has(canonical)) continue;

            const key = `${source}|${canonical}`;
            let acc = byKey.get(key);
            if (!acc) {
              acc = {
                observerName: citizenDisplayName(a),
                source,
                species: new Set(),
                obs: 0,
                firstUrl: null,
              };
              byKey.set(key, acc);
            }
            acc.obs += 1;
            if (sp?.scientificName) {
              acc.species.add(sp.scientificName);
              allSpecies.add(sp.scientificName);
            }
            if (!acc.firstUrl && a?.originalUrl) acc.firstUrl = a.originalUrl;
          }
        }
      }

      const contributors = Array.from(byKey.values())
        .map((a) => ({
          observerName: a.observerName,
          source: a.source as CitizenContributor['source'],
          speciesCount: a.species.size,
          obsCount: a.obs,
          firstUrl: a.firstUrl,
        }))
        .sort((a, b) => b.speciesCount - a.speciesCount || b.obsCount - a.obsCount);

      return { contributors, totalUniqueSpecies: allSpecies.size };
    },
    enabled: !!explorationId && !!knownAliases,
    staleTime: 5 * 60 * 1000,
  });
}
