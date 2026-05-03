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
}

export function useExplorationParticipants(explorationId?: string, marcheEventId?: string) {
  return useQuery({
    queryKey: ['exploration-participants', explorationId, marcheEventId],
    queryFn: async (): Promise<MarcheurWithStats[]> => {
      const results: MarcheurWithStats[] = [];

      // === Source 1: exploration_marcheurs (crew) ===
      if (explorationId) {
        const { data: crew } = await supabase
          .from('exploration_marcheurs')
          .select('*')
          .eq('exploration_id', explorationId)
          .order('ordre');

        if (crew?.length) {
          const crewIds = crew.map(c => c.id);
          const { data: observations } = await supabase
            .from('marcheur_observations')
            .select('marcheur_id, species_scientific_name, photo_url, observation_date')
            .in('marcheur_id', crewIds);

          const obsByMarcheur = new Map<string, SpeciesObservation[]>();
          const speciesSetByMarcheur = new Map<string, Set<string>>();
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

          crew.forEach(m => {
            const speciesCount = speciesSetByMarcheur.get(m.id)?.size || 0;
            results.push({
              id: `crew-${m.id}`,
              prenom: m.prenom,
              nom: m.nom,
              avatarUrl: m.avatar_url || undefined,
              source: 'crew',
              role: m.role || 'marcheur',
              couleur: m.couleur || '#10b981',
              stats: { photos: 0, videos: 0, sons: 0, textes: 0, speciesCount },
              totalContributions: speciesCount,
              speciesObserved: obsByMarcheur.get(m.id) || [],
            });
          });
        }
      }

      // === Source 2: community participants (via RPC to bypass RLS) ===
      if (explorationId) {
        // Use RPC function to get participants across all events of this exploration
        const { data: communityUsers } = await supabase
          .rpc('get_exploration_participants', { p_exploration_id: explorationId });

        if (communityUsers?.length) {
          const userIds = communityUsers.map((u: any) => u.user_id);

          // Get all marche_event_ids for this exploration
          const { data: events } = await supabase
            .from('marche_events')
            .select('id')
            .eq('exploration_id', explorationId);
          const eventIds = (events || []).map(e => e.id);

          // Get media stats across all events
          const { data: medias } = eventIds.length ? await supabase
            .from('marcheur_medias')
            .select('user_id, type_media')
            .in('marche_event_id', eventIds)
            .eq('is_public', true)
            .in('user_id', userIds) : { data: [] };

          // Get audio stats across all events
          const { data: audios } = eventIds.length ? await supabase
            .from('marcheur_audio')
            .select('user_id')
            .in('marche_event_id', eventIds)
            .eq('is_public', true)
            .in('user_id', userIds) : { data: [] };

          // Get textes stats across all events
          const { data: textes } = eventIds.length ? await supabase
            .from('marcheur_textes')
            .select('user_id')
            .in('marche_event_id', eventIds)
            .eq('is_public', true)
            .in('user_id', userIds) : { data: [] };

          // Aggregate per user
          const statsMap = new Map<string, { photos: number; videos: number; sons: number; textes: number }>();
          userIds.forEach((uid: string) => statsMap.set(uid, { photos: 0, videos: 0, sons: 0, textes: 0 }));

          (medias || []).forEach((m: any) => {
            const s = statsMap.get(m.user_id);
            if (!s) return;
            if (m.type_media === 'photo') s.photos++;
            else if (m.type_media === 'video') s.videos++;
          });

          (audios || []).forEach((a: any) => {
            const s = statsMap.get(a.user_id);
            if (s) s.sons++;
          });

          (textes || []).forEach((t: any) => {
            const s = statsMap.get(t.user_id);
            if (s) s.textes++;
          });

          communityUsers.forEach((cu: any) => {
            const s = statsMap.get(cu.user_id) || { photos: 0, videos: 0, sons: 0, textes: 0 };
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
