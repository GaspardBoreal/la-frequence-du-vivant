import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeAlias } from '@/hooks/useMarcheurAliases';

interface InatProfile {
  login: string;
  name: string;
  icon_url: string | null;
  observations_count: number | null;
  species_count: number | null;
  profile_url: string;
}

/**
 * For a given walker (via their aliases) and an exploration's marche IDs,
 * resolves their iNaturalist public profile (login, profile_url) by:
 *  1. Locating the first iNat attribution URL matching one of their aliases
 *     in `biodiversity_snapshots.species_data`.
 *  2. Calling the `resolve-inaturalist-user` edge function (cached 1h).
 *
 * Returns `null` if the walker has no iNat observation in this exploration.
 * Reuses the same query keys as CitizenPlatformsCard / ContributionsSubTab so
 * results are deduped by React Query.
 */
export function useMarcheurInatProfile(
  aliases: string[] | undefined,
  explorationMarcheIds: string[],
) {
  const aliasesKey = (aliases || []).slice().sort().join('|');

  const { data: firstUrl } = useQuery({
    queryKey: ['marcheur-inat-first-url', aliasesKey, explorationMarcheIds.slice().sort().join('|')],
    queryFn: async (): Promise<string | null> => {
      if (!aliases?.length || !explorationMarcheIds.length) return null;
      const aliasSet = new Set(aliases.map((a) => normalizeAlias(a)));
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', explorationMarcheIds);
      for (const snap of data || []) {
        const arr = (snap as any).species_data;
        if (!Array.isArray(arr)) continue;
        for (const sp of arr) {
          const attrs = Array.isArray(sp?.attributions) ? sp.attributions : [];
          for (const a of attrs) {
            if ((a?.source || '').toLowerCase() !== 'inaturalist') continue;
            const norm = normalizeAlias(a?.observerName || '');
            if (!norm || !aliasSet.has(norm)) continue;
            if (a?.originalUrl) return a.originalUrl as string;
          }
        }
      }
      return null;
    },
    enabled: !!aliases?.length && explorationMarcheIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return useQuery<InatProfile | null>({
    queryKey: ['inat-profile', firstUrl],
    queryFn: async () => {
      if (!firstUrl) return null;
      const { data, error } = await supabase.functions.invoke('resolve-inaturalist-user', {
        body: { observation_url: firstUrl },
      });
      if (error) throw error;
      return data as InatProfile;
    },
    enabled: !!firstUrl,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
