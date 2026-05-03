import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpeciesObservation {
  scientificName: string;
  photoUrl?: string;
  observationDate?: string;
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

      /** Resolve effective owner of a media row, honoring reattribution. */
      const route = (uploaderId: string | null, attributedCrewId: string | null) => {
        if (attributedCrewId) {
          const linkedUser = crewUserByCrewId.get(attributedCrewId);
          if (linkedUser) return { userId: linkedUser, crewId: null as string | null };
          return { userId: null, crewId: attributedCrewId };
        }
        return { userId: uploaderId, crewId: null as string | null };
      };

      // Convivialité photos: per exploration, can be reattributed to a crew row
      const { data: convPhotos } = await supabase
        .from('exploration_convivialite_photos')
        .select('user_id, attributed_marcheur_id')
        .eq('exploration_id', explorationId)
        .eq('is_hidden', false);

      (convPhotos || []).forEach((p: any) => {
        const { userId, crewId } = route(p.user_id, p.attributed_marcheur_id);
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
            .select('user_id')
            .in('marche_event_id', eventIds)
            .eq('is_public', true),
        ]);

        (medias || []).forEach((m: any) => {
          const { userId, crewId } = route(m.user_id, m.attributed_marcheur_id);
          const bucket = userId ? ensureUser(userId) : crewId ? ensureCrew(crewId) : null;
          if (!bucket) return;
          if (m.type_media === 'photo') bucket.photos++;
          else if (m.type_media === 'video') bucket.videos++;
        });
        (audios || []).forEach((a: any) => {
          const { userId, crewId } = route(a.user_id, a.attributed_marcheur_id);
          const bucket = userId ? ensureUser(userId) : crewId ? ensureCrew(crewId) : null;
          if (bucket) bucket.sons++;
        });
        (textes || []).forEach((t: any) => {
          if (!t.user_id) return;
          ensureUser(t.user_id).textes++;
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
        results.push({
          id: `community-${cu.user_id}`,
          prenom: cu.prenom || 'Marcheur',
          nom: cu.nom || '',
          avatarUrl: cu.avatar_url || undefined,
          source: 'community',
          role: cu.role || 'marcheur_en_devenir',
          couleur: '#10b981',
          stats: { ...s, speciesCount: 0 },
          totalContributions: total,
          speciesObserved: [],
        });
      });

      // === Emit orphan users (got reattributed media but not registered) ===
      orphanProfiles.forEach((p: any) => {
        const s = userStats.get(p.user_id) || newBucket();
        const total = s.photos + s.videos + s.sons + s.textes;
        results.push({
          id: `community-${p.user_id}`,
          prenom: p.prenom || 'Marcheur',
          nom: p.nom || '',
          avatarUrl: p.avatar_url || undefined,
          source: 'community',
          role: p.role || 'marcheur_en_devenir',
          couleur: '#10b981',
          stats: { ...s, speciesCount: 0 },
          totalContributions: total,
          speciesObserved: [],
        });
      });

      // Sort by total contributions (most active first)
      results.sort((a, b) => b.totalContributions - a.totalContributions);
      return results;
    },
    enabled: !!explorationId || !!marcheEventId,
    staleTime: 30 * 1000,
  });
}
