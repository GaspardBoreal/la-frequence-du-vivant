import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConvivialitePhotos, type ConvivialitePhoto } from '@/hooks/useConvivialitePhotos';

export type MediaSource = 'conv' | 'media' | 'audio';
export type MediaType = 'photo' | 'video' | 'audio';

export interface MediaItem {
  key: string; // 'conv:<uuid>' | 'media:<uuid>' | 'audio:<uuid>'
  source: MediaSource;
  type: MediaType;
  url: string;
  titre?: string | null;
  authorName?: string | null;
  marcheEventId?: string;
  createdAt: string;
  durationSec?: number | null;
}

export interface MarcheEventGroup {
  id: string;
  title: string;
  lieu: string | null;
  date: string;
  latitude: number | null;
  longitude: number | null;
  items: MediaItem[];
}

export interface ExplorationAllMedia {
  events: MarcheEventGroup[];
  convivialite: MediaItem[];
}

/**
 * Aggregates ALL media of an exploration:
 * - marcheur_medias (photo/video) of every marche_event of the exploration
 * - exploration_convivialite_photos
 *
 * Each item exposes a stable composite `key` ('conv:uuid' | 'media:uuid')
 * that can be persisted in `exploration_curations.media_ids`.
 */
export function useExplorationAllMedia(explorationId: string | undefined) {
  const { data: convPhotos = [], isLoading: convLoading } = useConvivialitePhotos(explorationId);

  const eventsQuery = useQuery({
    queryKey: ['exploration-all-media', explorationId],
    queryFn: async (): Promise<MarcheEventGroup[]> => {
      if (!explorationId) return [];

      // 1. Events
      const { data: events, error: evErr } = await supabase
        .from('marche_events')
        .select('id, title, lieu, date_marche, latitude, longitude')
        .eq('exploration_id', explorationId)
        .order('date_marche', { ascending: true });
      if (evErr) throw evErr;
      if (!events || events.length === 0) return [];

      const eventIds = events.map(e => e.id);

      // 2. Public medias
      const { data: medias, error: mErr } = await supabase
        .from('marcheur_medias')
        .select('id, type_media, url_fichier, external_url, titre, marche_event_id, user_id, created_at, duree_secondes')
        .in('marche_event_id', eventIds)
        .eq('is_public', true)
        .in('type_media', ['photo', 'video'])
        .order('created_at', { ascending: false });
      if (mErr) throw mErr;

      // 3. Author profiles
      const userIds = Array.from(new Set((medias || []).map(m => m.user_id)));
      const { data: profiles } = userIds.length > 0
        ? await supabase
            .from('community_profiles')
            .select('user_id, prenom, nom')
            .in('user_id', userIds)
        : { data: [] as { user_id: string; prenom: string | null; nom: string | null }[] };
      const profMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const grouped: Record<string, MediaItem[]> = {};
      (medias || []).forEach(m => {
        const url = m.url_fichier || m.external_url;
        if (!url) return;
        const prof = profMap.get(m.user_id);
        const item: MediaItem = {
          key: `media:${m.id}`,
          source: 'media',
          type: m.type_media === 'video' ? 'video' : 'photo',
          url,
          titre: m.titre,
          authorName: prof ? `${prof.prenom ?? ''} ${prof.nom ?? ''}`.trim() : null,
          marcheEventId: m.marche_event_id,
          createdAt: m.created_at,
          durationSec: m.duree_secondes ?? null,
        };
        (grouped[m.marche_event_id] ||= []).push(item);
      });

      return events.map(ev => ({
        id: ev.id,
        title: ev.title,
        lieu: ev.lieu,
        date: ev.date_marche,
        latitude: ev.latitude ?? null,
        longitude: ev.longitude ?? null,
        items: grouped[ev.id] || [],
      }));
    },
    enabled: !!explorationId,
    staleTime: 60_000,
  });

  const convivialite: MediaItem[] = convPhotos.map((p: ConvivialitePhoto) => ({
    key: `conv:${p.id}`,
    source: 'conv',
    type: 'photo',
    url: p.url,
    titre: null,
    authorName: [p.author_prenom, p.author_nom].filter(Boolean).join(' ') || null,
    createdAt: p.created_at,
  }));

  return {
    data: {
      events: eventsQuery.data || [],
      convivialite,
    } as ExplorationAllMedia,
    isLoading: eventsQuery.isLoading || convLoading,
    error: eventsQuery.error,
  };
}

/**
 * Build a fast key→item lookup from an ExplorationAllMedia result.
 * Also accepts legacy bare UUIDs (treated as 'conv:<uuid>') for backward
 * compatibility with media_ids saved before the multi-source picker existed.
 */
export function buildMediaIndex(all: ExplorationAllMedia): Map<string, MediaItem> {
  const m = new Map<string, MediaItem>();
  all.events.forEach(ev => ev.items.forEach(it => m.set(it.key, it)));
  all.convivialite.forEach(it => m.set(it.key, it));
  return m;
}

/** Normalize legacy bare UUID -> 'conv:<uuid>'. */
export function normalizeMediaKey(raw: string): string {
  return raw.includes(':') ? raw : `conv:${raw}`;
}
