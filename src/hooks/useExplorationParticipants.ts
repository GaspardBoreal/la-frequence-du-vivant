import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { routeMedia, routeTexte, type RoutingMaps } from '@/utils/mediaRouting';
import { normalizeAlias } from '@/hooks/useMarcheurAliases';

export interface SpeciesObservation {
  scientificName: string;
  photoUrl?: string;
  observationDate?: string;
  /** 'local' = marcheur_observations, 'inat' (ou autre source citoyenne) = biodiversity_snapshots. */
  origin?: 'local' | 'inat';
}

export interface MarcheurWithStats {
  id: string;
  prenom: string;
  nom: string;
  avatarUrl?: string;
  source: 'community' | 'crew';
  role: string;
  couleur: string;
  stats: {
    photos: number;
    videos: number;
    sons: number;
    textes: number;
    speciesCount: number;
    /** Photos issues d'observations citoyennes (iNat/GBIF/eBird) injectées via alias matching. */
    inatPhotos?: number;
    /** Espèces uniques apportées exclusivement par les snapshots citoyens. */
    inatSpeciesCount?: number;
    /** Espèces déjà présentes localement (= speciesCount - inatSpeciesCount). */
    localSpeciesCount?: number;
  };
  totalContributions: number;
  speciesObserved: SpeciesObservation[];
  /** auth.users id when known (community source, or crew row linked to a user). */
  userId?: string | null;
  /** exploration_marcheurs.id when this person has an editorial card. */
  crewId?: string | null;
}

export function useExplorationParticipants(explorationId?: string, marcheEventId?: string) {
  return useQuery({
    queryKey: ['exploration-participants', explorationId, marcheEventId],
    queryFn: async (): Promise<MarcheurWithStats[]> => {
      const results: MarcheurWithStats[] = [];
      if (!explorationId) return results;

      // === Editorial crew rows ===
      const { data: crew } = await supabase
        .from('exploration_marcheurs')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('ordre');
      const crewRows = crew || [];
      const crewIds = crewRows.map(c => c.id);

      // Map editorial row -> linked auth user (when "shadow" or claimed)
      const crewUserByCrewId = new Map<string, string | null>();
      crewRows.forEach((m: any) => crewUserByCrewId.set(m.id, m.user_id ?? null));
      // Map auth user -> editorial row (used to merge duplicates)
      const crewIdByUserId = new Map<string, string>();
      crewRows.forEach((m: any) => {
        if (m.user_id) crewIdByUserId.set(m.user_id, m.id);
      });

      // Species observations attached directly to editorial rows
      const obsByMarcheur = new Map<string, SpeciesObservation[]>();
      const speciesSetByMarcheur = new Map<string, Set<string>>();
      if (crewIds.length) {
        const { data: observations } = await supabase
          .from('marcheur_observations')
          .select('marcheur_id, species_scientific_name, photo_url, observation_date')
          .in('marcheur_id', crewIds);
        (observations || []).forEach(obs => {
          if (!speciesSetByMarcheur.has(obs.marcheur_id)) {
            speciesSetByMarcheur.set(obs.marcheur_id, new Set());
            obsByMarcheur.set(obs.marcheur_id, []);
          }
          if (!speciesSetByMarcheur.get(obs.marcheur_id)!.has(obs.species_scientific_name)) {
            speciesSetByMarcheur.get(obs.marcheur_id)!.add(obs.species_scientific_name);
            obsByMarcheur.get(obs.marcheur_id)!.push({
              scientificName: obs.species_scientific_name,
              photoUrl: obs.photo_url || undefined,
              observationDate: obs.observation_date || undefined,
            });
          }
        });
      }

      // === Community participants (validated) ===
      const { data: communityUsers } = await supabase
        .rpc('get_exploration_participants', { p_exploration_id: explorationId });
      const participants = (communityUsers || []) as any[];
      const participantUserIds = new Set<string>(participants.map(u => u.user_id));

      // Events of this exploration
      const { data: events } = await supabase
        .from('marche_events')
        .select('id')
        .eq('exploration_id', explorationId);
      const eventIds = (events || []).map(e => e.id);

      // Aggregate stats keyed by either authUserId (community) or crewId (pure shadow)
      type Bucket = { photos: number; videos: number; sons: number; textes: number };
      const newBucket = (): Bucket => ({ photos: 0, videos: 0, sons: 0, textes: 0 });
      const userStats = new Map<string, Bucket>();
      const crewStats = new Map<string, Bucket>();
      const ensureUser = (uid: string) => {
        let b = userStats.get(uid);
        if (!b) { b = newBucket(); userStats.set(uid, b); }
        return b;
      };
      const ensureCrew = (cid: string) => {
        let b = crewStats.get(cid);
        if (!b) { b = newBucket(); crewStats.set(cid, b); }
        return b;
      };

      const maps: RoutingMaps = { crewUserByCrewId, crewIdByUserId };

      // Convivialité photos: per exploration, can be reattributed to a crew row
      const { data: convPhotos } = await supabase
        .from('exploration_convivialite_photos')
        .select('user_id, attributed_marcheur_id')
        .eq('exploration_id', explorationId)
        .eq('is_hidden', false);

      (convPhotos || []).forEach((p: any) => {
        const { userId, crewId } = routeMedia(p.user_id, p.attributed_marcheur_id, maps);
        const bucket = userId ? ensureUser(userId) : crewId ? ensureCrew(crewId) : null;
        if (bucket) bucket.photos++;
      });

      if (eventIds.length) {
        const [{ data: medias }, { data: audios }, { data: textes }] = await Promise.all([
          supabase
            .from('marcheur_medias')
            .select('user_id, type_media, attributed_marcheur_id')
            .in('marche_event_id', eventIds)
            .eq('is_public', true),
          supabase
            .from('marcheur_audio')
            .select('user_id, attributed_marcheur_id')
            .in('marche_event_id', eventIds)
            .eq('is_public', true),
          supabase
            .from('marcheur_textes')
            .select('user_id, attributed_marcheur_id, attributed_user_id')
            .in('marche_event_id', eventIds)
            .eq('is_public', true),
        ]);

        (medias || []).forEach((m: any) => {
          const { userId, crewId } = routeMedia(m.user_id, m.attributed_marcheur_id, maps);
          const bucket = userId ? ensureUser(userId) : crewId ? ensureCrew(crewId) : null;
          if (!bucket) return;
          if (m.type_media === 'photo') bucket.photos++;
          else if (m.type_media === 'video') bucket.videos++;
        });
        (audios || []).forEach((a: any) => {
          const { userId, crewId } = routeMedia(a.user_id, a.attributed_marcheur_id, maps);
          const bucket = userId ? ensureUser(userId) : crewId ? ensureCrew(crewId) : null;
          if (bucket) bucket.sons++;
        });
        (textes || []).forEach((t: any) => {
          const { userId, crewId } = routeTexte(
            t.user_id,
            t.attributed_marcheur_id,
            t.attributed_user_id,
            maps,
          );
          const bucket = userId ? ensureUser(userId) : crewId ? ensureCrew(crewId) : null;
          if (bucket) bucket.textes++;
        });
      }

      // Any auth user that received media but isn't a registered participant
      // and isn't already an editorial crew member -> surface them too.
      const orphanUserIds: string[] = [];
      userStats.forEach((_, uid) => {
        if (!participantUserIds.has(uid) && !crewIdByUserId.has(uid)) {
          orphanUserIds.push(uid);
        }
      });
      let orphanProfiles: any[] = [];
      if (orphanUserIds.length) {
        const { data } = await supabase
          .from('community_profiles')
          .select('user_id, prenom, nom, avatar_url, role')
          .in('user_id', orphanUserIds);
        orphanProfiles = data || [];
      }

      // === Emit editorial crew rows (skip those merged into a community user) ===
      crewRows.forEach((m: any) => {
        if (m.user_id && participantUserIds.has(m.user_id)) return; // dedupe
        const speciesCount = speciesSetByMarcheur.get(m.id)?.size || 0;
        const linkedUser = m.user_id as string | null;
        const stats = linkedUser
          ? (userStats.get(linkedUser) || newBucket())
          : (crewStats.get(m.id) || newBucket());
        const total = stats.photos + stats.videos + stats.sons + stats.textes;
        results.push({
          id: `crew-${m.id}`,
          prenom: m.prenom,
          nom: m.nom,
          avatarUrl: m.avatar_url || undefined,
          source: 'crew',
          role: m.role || 'marcheur',
          couleur: m.couleur || '#10b981',
          stats: { ...stats, speciesCount },
          totalContributions: total + speciesCount,
          speciesObserved: obsByMarcheur.get(m.id) || [],
          userId: linkedUser,
          crewId: m.id,
        });
      });

      // === Emit community participants ===
      participants.forEach((cu: any) => {
        const s = userStats.get(cu.user_id) || newBucket();
        const total = s.photos + s.videos + s.sons + s.textes;
        const linkedCrewId = crewIdByUserId.get(cu.user_id) ?? null;
        const obs = (linkedCrewId && obsByMarcheur.get(linkedCrewId)) || [];
        const speciesCnt = (linkedCrewId && speciesSetByMarcheur.get(linkedCrewId)?.size) || 0;
        results.push({
          id: `community-${cu.user_id}`,
          prenom: cu.prenom || 'Marcheur',
          nom: cu.nom || '',
          avatarUrl: cu.avatar_url || undefined,
          source: 'community',
          role: cu.role || 'marcheur_en_devenir',
          couleur: '#10b981',
          stats: { ...s, speciesCount: speciesCnt },
          totalContributions: total + speciesCnt,
          speciesObserved: obs,
          userId: cu.user_id,
          crewId: linkedCrewId,
        });
      });

      // === Emit orphan users (got reattributed media but not registered) ===
      orphanProfiles.forEach((p: any) => {
        const s = userStats.get(p.user_id) || newBucket();
        const total = s.photos + s.videos + s.sons + s.textes;
        const linkedCrewId = crewIdByUserId.get(p.user_id) ?? null;
        const obs = (linkedCrewId && obsByMarcheur.get(linkedCrewId)) || [];
        const speciesCnt = (linkedCrewId && speciesSetByMarcheur.get(linkedCrewId)?.size) || 0;
        results.push({
          id: `community-${p.user_id}`,
          prenom: p.prenom || 'Marcheur',
          nom: p.nom || '',
          avatarUrl: p.avatar_url || undefined,
          source: 'community',
          role: p.role || 'marcheur_en_devenir',
          couleur: '#10b981',
          stats: { ...s, speciesCount: speciesCnt },
          totalContributions: total + speciesCnt,
          speciesObserved: obs,
          userId: p.user_id,
          crewId: linkedCrewId,
        });
      });

      // Tag les observations existantes comme 'local'
      results.forEach((r) => {
        r.speciesObserved = r.speciesObserved.map((s) => ({ ...s, origin: 'local' as const }));
        r.stats.localSpeciesCount = r.stats.speciesCount;
        r.stats.inatPhotos = 0;
        r.stats.inatSpeciesCount = 0;
      });

      // === Fusion des observations citoyennes (biodiversity_snapshots) via alias matching ===
      // Source unifiée du score Sentinelle : ce qui est affiché dans l'onglet Contributions
      // alimente aussi Diversité d'espèces / Volume / Pilier photo.
      if (explorationId) {
        const { data: explorationMarches } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .eq('exploration_id', explorationId);
        const marcheIds = (explorationMarches || []).map((r: any) => r.marche_id).filter(Boolean);

        if (marcheIds.length > 0) {
          const { data: snapshots } = await supabase
            .from('biodiversity_snapshots')
            .select('species_data')
            .in('marche_id', marcheIds);

          // Index : observerNorm -> observations
          const byObserver = new Map<string, Array<{ sci: string; photo?: string; date?: string }>>();
          for (const snap of snapshots || []) {
            const arr = (snap as any).species_data;
            if (!Array.isArray(arr)) continue;
            for (const sp of arr) {
              const fallbackPhoto = sp?.photoData?.url || (Array.isArray(sp?.photos) ? sp.photos[0] : null) || undefined;
              const attrs = Array.isArray(sp?.attributions) ? sp.attributions : [];
              for (const a of attrs) {
                const obs = normalizeAlias(a?.observerName || '');
                if (!obs || !sp?.scientificName) continue;
                const list = byObserver.get(obs) || [];
                list.push({ sci: sp.scientificName, photo: a?.photoUrl || fallbackPhoto, date: a?.date });
                byObserver.set(obs, list);
              }
            }
          }

          // Pré-charge les usernames de comptes citoyens pour tous les userId connus
          const userIds = results.map((r) => r.userId).filter((v): v is string => !!v);
          const aliasesByUserId = new Map<string, Set<string>>();
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('community_profiles')
              .select('id, user_id')
              .in('user_id', userIds);
            const profileIdToUserId = new Map<string, string>();
            (profiles || []).forEach((p: any) => {
              if (p?.id && p?.user_id) profileIdToUserId.set(p.id, p.user_id);
            });
            const profileIds = Array.from(profileIdToUserId.keys());
            if (profileIds.length > 0) {
              const { data: accounts } = await supabase
                .from('community_profile_science_accounts')
                .select('profile_id, username')
                .in('profile_id', profileIds);
              (accounts || []).forEach((a: any) => {
                const uid = profileIdToUserId.get(a.profile_id);
                if (!uid) return;
                const norm = normalizeAlias(a.username || '');
                if (!norm) return;
                let set = aliasesByUserId.get(uid);
                if (!set) { set = new Set(); aliasesByUserId.set(uid, set); }
                set.add(norm);
              });
            }
          }

          // Fusion par marcheur
          results.forEach((r) => {
            const aliasSet = new Set<string>();
            const full = `${r.prenom || ''} ${r.nom || ''}`.trim();
            const reversed = `${r.nom || ''} ${r.prenom || ''}`.trim();
            const concat = `${r.prenom || ''}${r.nom || ''}`.trim();
            [full, reversed, concat].forEach((s) => {
              const n = normalizeAlias(s);
              if (n) aliasSet.add(n);
            });
            if (r.userId) {
              const extra = aliasesByUserId.get(r.userId);
              if (extra) extra.forEach((a) => aliasSet.add(a));
            }

            const seenSpecies = new Set(r.speciesObserved.map((s) => s.scientificName));
            const seenKey = new Set<string>(); // dedup intra-iNat
            let inatPhotos = 0;
            let inatSpeciesAdded = 0;

            aliasSet.forEach((alias) => {
              const list = byObserver.get(alias);
              if (!list) return;
              for (const item of list) {
                const k = `${item.sci}|${item.date || ''}`;
                if (seenKey.has(k)) continue;
                seenKey.add(k);
                if (item.photo) inatPhotos++;
                if (!seenSpecies.has(item.sci)) {
                  seenSpecies.add(item.sci);
                  inatSpeciesAdded++;
                  r.speciesObserved.push({
                    scientificName: item.sci,
                    photoUrl: item.photo,
                    observationDate: item.date,
                    origin: 'inat',
                  });
                }
              }
            });

            if (inatPhotos > 0 || inatSpeciesAdded > 0) {
              r.stats.inatPhotos = inatPhotos;
              r.stats.inatSpeciesCount = inatSpeciesAdded;
              r.stats.speciesCount = seenSpecies.size;
              r.totalContributions += inatSpeciesAdded;
            }
          });
        }
      }

      // Sort by total contributions (most active first)
      results.sort((a, b) => b.totalContributions - a.totalContributions);
      return results;
    },
    enabled: !!explorationId || !!marcheEventId,
    staleTime: 30 * 1000,
  });
}
