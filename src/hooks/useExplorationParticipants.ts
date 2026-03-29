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
          // Get observation counts per marcheur
          const crewIds = crew.map(c => c.id);
          const { data: observations } = await supabase
            .from('marcheur_observations')
            .select('marcheur_id, species_scientific_name')
            .in('marcheur_id', crewIds);

          const speciesByMarcheur = new Map<string, Set<string>>();
          (observations || []).forEach(obs => {
            if (!speciesByMarcheur.has(obs.marcheur_id)) {
              speciesByMarcheur.set(obs.marcheur_id, new Set());
            }
            speciesByMarcheur.get(obs.marcheur_id)!.add(obs.species_scientific_name);
          });

          crew.forEach(m => {
            const speciesCount = speciesByMarcheur.get(m.id)?.size || 0;
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
            });
          });
        }
      }

      // === Source 2: community participants ===
      if (marcheEventId) {
        const { data: participations } = await supabase
          .from('marche_participations')
          .select('user_id')
          .eq('marche_event_id', marcheEventId);

        if (participations?.length) {
          const userIds = [...new Set(participations.map(p => p.user_id))];

          // Get profiles
          const { data: profiles } = await supabase
            .from('community_profiles')
            .select('user_id, prenom, nom, avatar_url, role')
            .in('user_id', userIds);

          const profileMap = new Map(
            (profiles || []).map(p => [p.user_id, p])
          );

          // Get media stats (photos + videos)
          const { data: medias } = await supabase
            .from('marcheur_medias')
            .select('user_id, type_media')
            .eq('marche_event_id', marcheEventId)
            .eq('is_public', true)
            .in('user_id', userIds);

          // Get audio stats
          const { data: audios } = await supabase
            .from('marcheur_audio')
            .select('user_id')
            .eq('marche_event_id', marcheEventId)
            .eq('is_public', true)
            .in('user_id', userIds);

          // Get textes stats
          const { data: textes } = await supabase
            .from('marcheur_textes')
            .select('user_id')
            .eq('marche_event_id', marcheEventId)
            .eq('is_public', true)
            .in('user_id', userIds);

          // Aggregate per user
          const statsMap = new Map<string, { photos: number; videos: number; sons: number; textes: number }>();
          userIds.forEach(uid => statsMap.set(uid, { photos: 0, videos: 0, sons: 0, textes: 0 }));

          (medias || []).forEach(m => {
            const s = statsMap.get(m.user_id);
            if (!s) return;
            if (m.type_media === 'photo') s.photos++;
            else if (m.type_media === 'video') s.videos++;
          });

          (audios || []).forEach(a => {
            const s = statsMap.get(a.user_id);
            if (s) s.sons++;
          });

          (textes || []).forEach(t => {
            const s = statsMap.get(t.user_id);
            if (s) s.textes++;
          });

          userIds.forEach(uid => {
            const profile = profileMap.get(uid);
            const s = statsMap.get(uid) || { photos: 0, videos: 0, sons: 0, textes: 0 };
            const total = s.photos + s.videos + s.sons + s.textes;
            results.push({
              id: `community-${uid}`,
              prenom: profile?.prenom || 'Marcheur',
              nom: profile?.nom || '',
              avatarUrl: profile?.avatar_url || undefined,
              source: 'community',
              role: profile?.role || 'marcheur_en_devenir',
              couleur: '#10b981',
              stats: { ...s, speciesCount: 0 },
              totalContributions: total,
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
