import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContributionEntry {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'texte';
  url: string | null;
  titre: string | null;
  prenom: string;
  nom: string;
  avatarUrl: string | null;
  createdAt: string;
}

export const useExplorationContributions = (explorationId?: string) => {
  return useQuery({
    queryKey: ['exploration-contributions-feed', explorationId],
    queryFn: async (): Promise<ContributionEntry[]> => {
      if (!explorationId) return [];

      // 1. Get all marche_event_ids for this exploration
      const { data: events } = await supabase
        .from('marche_events')
        .select('id')
        .eq('exploration_id', explorationId);

      const eventIds = events?.map(e => e.id) || [];
      if (eventIds.length === 0) return [];

      // 2. Fetch medias, audio, textes in parallel
      const [mediasRes, audioRes, textesRes] = await Promise.all([
        supabase
          .from('marcheur_medias')
          .select('id, type_media, url_fichier, external_url, titre, user_id, created_at')
          .in('marche_event_id', eventIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('marcheur_audio')
          .select('id, url_fichier, titre, user_id, created_at')
          .in('marche_event_id', eventIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('marcheur_textes')
          .select('id, titre, user_id, created_at')
          .in('marche_event_id', eventIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      // 3. Collect unique user_ids
      const allItems = [
        ...(mediasRes.data || []).map(m => ({
          id: m.id,
          type: (m.type_media === 'video' ? 'video' : 'photo') as ContributionEntry['type'],
          url: m.url_fichier || m.external_url,
          titre: m.titre,
          userId: m.user_id,
          createdAt: m.created_at,
        })),
        ...(audioRes.data || []).map(a => ({
          id: a.id,
          type: 'audio' as const,
          url: a.url_fichier,
          titre: a.titre,
          userId: a.user_id,
          createdAt: a.created_at,
        })),
        ...(textesRes.data || []).map(t => ({
          id: t.id,
          type: 'texte' as const,
          url: null,
          titre: t.titre,
          userId: t.user_id,
          createdAt: t.created_at,
        })),
      ];

      const userIds = [...new Set(allItems.map(i => i.userId))];

      // 4. Fetch profiles
      const { data: profiles } = userIds.length > 0
        ? await supabase
            .from('community_profiles')
            .select('user_id, prenom, nom, avatar_url')
            .in('user_id', userIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // 5. Merge and return
      return allItems.map(item => {
        const profile = profileMap.get(item.userId);
        return {
          id: item.id,
          type: item.type,
          url: item.url,
          titre: item.titre,
          prenom: profile?.prenom || 'Anonyme',
          nom: profile?.nom || '',
          avatarUrl: profile?.avatar_url || null,
          createdAt: item.createdAt,
        };
      });
    },
    enabled: !!explorationId,
    staleTime: 30_000,
  });
};
