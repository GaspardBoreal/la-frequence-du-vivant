import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildProfileUrl } from '@/types/scienceAccounts';

export interface MarcheurInatAccount {
  login: string;
  profile_url: string;
  verified: boolean;
}

/**
 * Batch resolver : pour une liste de `userId` (auth user id) de marcheurs,
 * retourne une Map<userId, { login, profile_url }> à partir de la table
 * `community_profile_science_accounts` (network='inaturalist').
 *
 * Source primaire du lien iNat dans MarcheursTab : indépendante des
 * observations rattachées à la marche (contrairement à `useMarcheurInatProfile`
 * qui exige une attribution iNat dans un snapshot).
 */
export function useMarcheursInatAccounts(userIds: (string | null | undefined)[]) {
  const cleanIds = Array.from(
    new Set((userIds || []).filter((x): x is string => !!x))
  ).sort();
  const key = cleanIds.join('|');

  return useQuery({
    queryKey: ['marcheurs-inat-accounts', key],
    queryFn: async (): Promise<Map<string, MarcheurInatAccount>> => {
      const map = new Map<string, MarcheurInatAccount>();
      if (cleanIds.length === 0) return map;

      const { data, error } = await supabase
        .from('community_profile_science_accounts')
        .select('username, profile_url, verified, community_profiles!inner(user_id)')
        .eq('network', 'inaturalist')
        .in('community_profiles.user_id', cleanIds);

      if (error) {
        console.warn('[useMarcheursInatAccounts] fetch error:', error);
        return map;
      }

      for (const row of data || []) {
        const userId = (row as any).community_profiles?.user_id as string | undefined;
        const username = ((row as any).username || '').trim();
        if (!userId || !username) continue;
        const url =
          ((row as any).profile_url as string | null) ||
          buildProfileUrl('inaturalist', username);
        if (!url) continue;
        map.set(userId, {
          login: username,
          profile_url: url,
          verified: !!(row as any).verified,
        });
      }
      return map;
    },
    enabled: cleanIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}
