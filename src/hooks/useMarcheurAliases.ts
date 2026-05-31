import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const normalizeAlias = (str: string): string =>
  (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Construit la liste d'alias normalisés permettant d'identifier un marcheur
 * dans les attributions de `biodiversity_snapshots.species_data[].attributions[]`.
 *
 * Sources d'alias :
 *  - Nom complet "prénom nom" (et variantes : concaténé sans espace, "nom prénom")
 *  - Tous les `username` de `community_profile_science_accounts`
 *    (iNaturalist, GBIF, eBird, etc.) liés au profil du marcheur
 *
 * Ce set est ensuite comparé en **égalité stricte** à `observerName` (jamais
 * via `includes`) afin d'éviter les faux positifs.
 */
export const useMarcheurAliases = (
  userId: string | null | undefined,
  prenom: string,
  nom: string
) => {
  const baseAliases: string[] = [];
  const full = `${prenom || ''} ${nom || ''}`.trim();
  if (full) baseAliases.push(normalizeAlias(full));
  const reversed = `${nom || ''} ${prenom || ''}`.trim();
  if (reversed) baseAliases.push(normalizeAlias(reversed));
  const concat = `${prenom || ''}${nom || ''}`.trim();
  if (concat) baseAliases.push(normalizeAlias(concat));

  return useQuery({
    queryKey: ['marcheur-aliases', userId, normalizeAlias(full)],
    queryFn: async () => {
      const set = new Set<string>(baseAliases.filter(Boolean));
      if (!userId) return Array.from(set);
      const { data: profile } = await supabase
        .from('community_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!profile?.id) return Array.from(set);
      const { data: accounts } = await supabase
        .from('community_profile_science_accounts')
        .select('network, username, external_id')
        .eq('profile_id', profile.id);
      (accounts || []).forEach((a: any) => {
        const u = normalizeAlias(a.username || '');
        if (u) set.add(u);
        // ID numérique iNat — clé d'identité canonique la + stable
        if (a.network === 'inaturalist' && a.external_id) {
          set.add(`inat:${String(a.external_id).trim()}`);
        }
      });
      return Array.from(set);
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Variante batch : pour une liste de marcheurs, retourne
 * Map<marcheurId, aliases[]>. Une seule requête pour tous les profils.
 */
export const useMarcheursAliasesMap = (
  marcheurs: Array<{ id: string; userId?: string | null; prenom: string; nom: string }> | undefined
) => {
  const userIds = (marcheurs || [])
    .map((m) => m.userId)
    .filter((v): v is string => !!v);
  const userIdsKey = userIds.slice().sort().join(',');

  return useQuery({
    queryKey: ['marcheurs-aliases-map', userIdsKey],
    queryFn: async () => {
      const map = new Map<string, string[]>();
      const list = marcheurs || [];

      // Base aliases (nom) pour chacun
      const setsByMarcheur = new Map<string, Set<string>>();
      list.forEach((m) => {
        const set = new Set<string>();
        const full = `${m.prenom || ''} ${m.nom || ''}`.trim();
        const reversed = `${m.nom || ''} ${m.prenom || ''}`.trim();
        const concat = `${m.prenom || ''}${m.nom || ''}`.trim();
        [full, reversed, concat].forEach((s) => {
          const n = normalizeAlias(s);
          if (n) set.add(n);
        });
        setsByMarcheur.set(m.id, set);
      });

      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('community_profiles')
          .select('id, user_id')
          .in('user_id', userIds);

        const profileIdToUserId = new Map<string, string>();
        const profileIds: string[] = [];
        (profiles || []).forEach((p: any) => {
          if (p?.id && p?.user_id) {
            profileIdToUserId.set(p.id, p.user_id);
            profileIds.push(p.id);
          }
        });

        if (profileIds.length) {
          const { data: accounts } = await supabase
            .from('community_profile_science_accounts')
            .select('profile_id, network, username, external_id')
            .in('profile_id', profileIds);

          // userId -> [usernames + inat:<id>]
          const aliasesByUserId = new Map<string, string[]>();
          (accounts || []).forEach((a: any) => {
            const uid = profileIdToUserId.get(a.profile_id);
            if (!uid) return;
            const arr = aliasesByUserId.get(uid) || [];
            const norm = normalizeAlias(a.username || '');
            if (norm) arr.push(norm);
            // ID numérique iNat — clé canonique stable
            if (a.network === 'inaturalist' && a.external_id) {
              arr.push(`inat:${String(a.external_id).trim()}`);
            }
            aliasesByUserId.set(uid, arr);
          });

          list.forEach((m) => {
            if (!m.userId) return;
            const extra = aliasesByUserId.get(m.userId) || [];
            const set = setsByMarcheur.get(m.id);
            if (set) extra.forEach((a) => set.add(a));
          });
        }
      }

      setsByMarcheur.forEach((set, id) => map.set(id, Array.from(set)));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
};
