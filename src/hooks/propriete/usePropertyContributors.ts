import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyContributor {
  marcheurId: string;
  marcheurIds: string[];
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

const normName = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Résout les marcheurs (exploration_marcheurs) à partir des ids collectés
 * dans les observations de la propriété, et joint stats + rôle community.
 *
 * Fusionne les doublons (même humain participant à plusieurs explorations →
 * plusieurs `marcheur_id`) par identité canonique (user_id > nom normalisé).
 */
export function usePropertyContributors(
  summaries: Array<{
    marcheurId: string;
    observations: number;
    speciesCount: number;
    speciesKeys?: string[];
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

      // Fusion par identité canonique
      const bucket = new Map<
        string,
        {
          canonicalKey: string;
          marcheurIds: string[];
          prenom: string | null;
          nom: string | null;
          avatarUrl: string | null;
          role: string | null;
          couleur: string | null;
          userId: string | null;
          observations: number;
          speciesUnion: Set<string>;
          speciesCountFallback: number;
          lastSeen: string | null;
        }
      >();

      for (const s of summaries) {
        const m = byId.get(s.marcheurId);
        const p = m?.user_id ? profilesByUser.get(m.user_id) : null;
        const prenom = p?.prenom ?? m?.prenom ?? null;
        const nom = p?.nom ?? m?.nom ?? null;
        const avatarUrl = p?.avatar_url ?? m?.avatar_url ?? null;
        const role = p?.role ?? m?.role ?? null;
        const couleur = m?.couleur ?? null;
        const userId = m?.user_id ?? null;

        const nameKey = normName(`${prenom || ''} ${nom || ''}`);
        const canonicalKey = userId
          ? `u:${userId}`
          : nameKey
          ? `n:${nameKey}`
          : `m:${s.marcheurId}`;

        const existing = bucket.get(canonicalKey);
        if (!existing) {
          bucket.set(canonicalKey, {
            canonicalKey,
            marcheurIds: [s.marcheurId],
            prenom,
            nom,
            avatarUrl,
            role,
            couleur,
            userId,
            observations: s.observations,
            speciesUnion: new Set(s.speciesKeys || []),
            speciesCountFallback: s.speciesKeys ? 0 : s.speciesCount,
            lastSeen: s.lastSeen,
          });
        } else {
          existing.marcheurIds.push(s.marcheurId);
          existing.observations += s.observations;
          if (s.speciesKeys && s.speciesKeys.length) {
            for (const k of s.speciesKeys) existing.speciesUnion.add(k);
          } else {
            existing.speciesCountFallback = Math.max(
              existing.speciesCountFallback,
              s.speciesCount,
            );
          }
          if ((s.lastSeen || '') > (existing.lastSeen || '')) existing.lastSeen = s.lastSeen;
          // Prefer non-null profile fields (community_profiles wins via priority above)
          if (!existing.prenom && prenom) existing.prenom = prenom;
          if (!existing.nom && nom) existing.nom = nom;
          if (!existing.avatarUrl && avatarUrl) existing.avatarUrl = avatarUrl;
          if (!existing.role && role) existing.role = role;
          if (!existing.couleur && couleur) existing.couleur = couleur;
          if (!existing.userId && userId) existing.userId = userId;
        }
      }

      return Array.from(bucket.values())
        .map((c) => ({
          marcheurId: c.marcheurIds[0],
          marcheurIds: c.marcheurIds,
          prenom: c.prenom,
          nom: c.nom,
          avatarUrl: c.avatarUrl,
          role: c.role,
          couleur: c.couleur,
          userId: c.userId,
          observations: c.observations,
          speciesCount: c.speciesUnion.size || c.speciesCountFallback,
          lastSeen: c.lastSeen,
        }))
        .sort((a, b) => b.observations - a.observations);
    },
  });
}
