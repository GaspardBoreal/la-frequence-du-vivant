import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeedKind = 'photo' | 'son' | 'texte' | 'espece';

export interface CommunityFeedItem {
  id: string;
  kind: FeedKind;
  sourceId: string;
  createdAt: string;
  title: string | null;
  preview: string | null;
  extra?: {
    audioUrl?: string;
    duree?: number;
    extrait?: string;
    typeTexte?: string;
    scientificName?: string;
    commonName?: string;
    kingdom?: string;
    iconicTaxon?: string;
  };
  author: {
    userId: string | null;
    prenom: string | null;
    nom: string | null;
    avatarUrl: string | null;
  };
  marche: {
    eventId: string | null;
    title: string | null;
    explorationId: string | null;
    publicSlug: string | null;
    dateMarche: string | null;
  };
  registered: boolean;
}

export interface CommunityFeedResponse {
  main: CommunityFeedItem[];
  discovery: CommunityFeedItem[];
}

export function useCommunityFeed(userId: string | undefined) {
  return useQuery<CommunityFeedResponse>({
    queryKey: ['community-feed', userId],
    queryFn: async () => {
      const empty: CommunityFeedResponse = { main: [], discovery: [] };
      // Pas de session valide → on n'appelle pas la fonction (évite un 401)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) return empty;

      const { data, error } = await supabase.functions.invoke('feed-community-new-items', {
        body: {},
      });
      if (error) {
        console.warn('[useCommunityFeed] feed indisponible:', error.message);
        return empty;
      }
      return (data as CommunityFeedResponse) || empty;
    },
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
