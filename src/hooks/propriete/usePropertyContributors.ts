import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyContributor {
  marcheurId: string;
  prenom: string | null;
  nom: string | null;
  avatarUrl: string | null;
  role: string | null;
  couleur: string | null;
  userId: string | null;
  observations: number;
  speciesCount: number;
  lastSeen: string | null;
}

/**
 * Résout les marcheurs (exploration_marcheurs) à partir des ids collectés
 * dans les observations de la propriété, et joint stats + rôle community.
 */
export function usePropertyContributors(
  summaries: Array<{
    marcheurId: string;
    observations: number;
    speciesCount: number;
    lastSeen: string | null;
  }>,
) {
  const ids = summaries.map((s) => s.marcheurId).sort();
  const key = ids.join(',');

  return useQuery({
    queryKey: ['propriete-contributors', key],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PropertyContributor[]> => {
      const { data: marcheurs, error } = await supabase
        .from('exploration_marcheurs')
        .select('id, prenom, nom, avatar_url, role, couleur, user_id')
        .in('id', ids);
      if (error) throw error;

      // Enrich with community_profiles for user-linked marcheurs
      const userIds = (marcheurs || [])
        .map((m: any) => m.user_id)
        .filter((v: any): v is string => !!v);
      let profilesByUser = new Map<string, any>();
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('community_profiles')
          .select('user_id, prenom, nom, avatar_url, role')
          .in('user_id', userIds);
        (profiles || []).forEach((p: any) => profilesByUser.set(p.user_id, p));
      }

      const byId = new Map<string, any>();
      (marcheurs || []).forEach((m: any) => byId.set(m.id, m));

      return summaries.map((s) => {
        const m = byId.get(s.marcheurId);
        const p = m?.user_id ? profilesByUser.get(m.user_id) : null;
        return {
          marcheurId: s.marcheurId,
          prenom: p?.prenom ?? m?.prenom ?? null,
          nom: p?.nom ?? m?.nom ?? null,
          avatarUrl: p?.avatar_url ?? m?.avatar_url ?? null,
          role: p?.role ?? m?.role ?? null,
          couleur: m?.couleur ?? null,
          userId: m?.user_id ?? null,
          observations: s.observations,
          speciesCount: s.speciesCount,
          lastSeen: s.lastSeen,
        };
      });
    },
  });
}
