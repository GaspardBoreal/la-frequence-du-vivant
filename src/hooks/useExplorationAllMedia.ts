import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConvivialitePhotos, type ConvivialitePhoto } from '@/hooks/useConvivialitePhotos';

export type MediaSource = 'conv' | 'media' | 'audio';
export type MediaType = 'photo' | 'video' | 'audio';
export type GpsSource = 'exif' | 'step' | 'event';

export interface MarcheStep {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** 1-based index in the exploration walking order. */
  order: number;
}

export interface MediaItem {
  key: string; // 'conv:<uuid>' | 'media:<uuid>' | 'audio:<uuid>'
  source: MediaSource;
  type: MediaType;
  url: string;
  titre?: string | null;
  authorName?: string | null;
  marcheEventId?: string;
  marcheId?: string | null;
  marcheStepName?: string | null;
  gps?: { lat: number; lng: number; source: GpsSource } | null;
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
  steps: MarcheStep[];
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

      // 2. Public medias (photos/vidéos) + audios + steps (marches) en parallèle
      const [mediasRes, audiosRes, stepsLinkRes] = await Promise.all([
        supabase
          .from('marcheur_medias')
          .select('id, type_media, url_fichier, external_url, titre, marche_event_id, marche_id, metadata, user_id, created_at, duree_secondes')
          .in('marche_event_id', eventIds)
          .eq('is_public', true)
          .in('type_media', ['photo', 'video'])
          .order('created_at', { ascending: false }),
        supabase
          .from('marcheur_audio')
          .select('id, url_fichier, titre, marche_event_id, marche_id, user_id, created_at, duree_secondes')
          .in('marche_event_id', eventIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('exploration_marches')
          .select('marche_id, marches!inner(id, nom_marche, latitude, longitude)')
          .eq('exploration_id', explorationId),
      ]);
      if (mediasRes.error) throw mediasRes.error;
      if (audiosRes.error) throw audiosRes.error;
      if (stepsLinkRes.error) throw stepsLinkRes.error;
      const medias = mediasRes.data || [];
      const audios = audiosRes.data || [];

      // Build step lookup (id → MarcheStep) – only steps with GPS are useful
      const stepById = new Map<string, MarcheStep>();
      ((stepsLinkRes.data || []) as Array<{ marches: { id: string; nom_marche: string | null; latitude: number | null; longitude: number | null } | null }>)
        .forEach(row => {
          const m = row.marches;
          if (m && m.latitude != null && m.longitude != null) {
            stepById.set(m.id, {
              id: m.id,
              name: m.nom_marche || 'Étape de marche',
              lat: Number(m.latitude),
              lng: Number(m.longitude),
            });
          }
        });

      // 3. Author profiles
      const userIds = Array.from(new Set([
        ...medias.map(m => m.user_id),
        ...audios.map(a => a.user_id),
      ]));
      const { data: profiles } = userIds.length > 0
        ? await supabase
            .from('community_profiles')
            .select('user_id, prenom, nom')
            .in('user_id', userIds)
        : { data: [] as { user_id: string; prenom: string | null; nom: string | null }[] };
      const profMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const eventById = new Map(events.map(e => [e.id, e]));

      const computeGps = (
        metadata: any,
        marcheId: string | null | undefined,
        eventId: string,
      ): MediaItem['gps'] => {
        // 1) EXIF
        const exifLat = Number(metadata?.gps?.latitude);
        const exifLng = Number(metadata?.gps?.longitude);
        if (Number.isFinite(exifLat) && Number.isFinite(exifLng) && (exifLat !== 0 || exifLng !== 0)) {
          return { lat: exifLat, lng: exifLng, source: 'exif' };
        }
        // 2) Step
        if (marcheId) {
          const s = stepById.get(marcheId);
          if (s) return { lat: s.lat, lng: s.lng, source: 'step' };
        }
        // 3) Event
        const ev = eventById.get(eventId);
        if (ev?.latitude != null && ev?.longitude != null) {
          return { lat: Number(ev.latitude), lng: Number(ev.longitude), source: 'event' };
        }
        return null;
      };

      const grouped: Record<string, MediaItem[]> = {};
      medias.forEach(m => {
        const url = m.url_fichier || m.external_url;
        if (!url) return;
        const prof = profMap.get(m.user_id);
        const stepName = m.marche_id ? stepById.get(m.marche_id)?.name ?? null : null;
        const item: MediaItem = {
          key: `media:${m.id}`,
          source: 'media',
          type: m.type_media === 'video' ? 'video' : 'photo',
          url,
          titre: m.titre,
          authorName: prof ? `${prof.prenom ?? ''} ${prof.nom ?? ''}`.trim() : null,
          marcheEventId: m.marche_event_id,
          marcheId: m.marche_id ?? null,
          marcheStepName: stepName,
          gps: computeGps(m.metadata, m.marche_id, m.marche_event_id),
          createdAt: m.created_at,
          durationSec: m.duree_secondes ?? null,
        };
        (grouped[m.marche_event_id] ||= []).push(item);
      });
      audios.forEach(a => {
        if (!a.url_fichier) return;
        const prof = profMap.get(a.user_id);
        const stepName = a.marche_id ? stepById.get(a.marche_id)?.name ?? null : null;
        const item: MediaItem = {
          key: `audio:${a.id}`,
          source: 'audio',
          type: 'audio',
          url: a.url_fichier,
          titre: a.titre,
          authorName: prof ? `${prof.prenom ?? ''} ${prof.nom ?? ''}`.trim() : null,
          marcheEventId: a.marche_event_id,
          marcheId: a.marche_id ?? null,
          marcheStepName: stepName,
          gps: computeGps(null, a.marche_id, a.marche_event_id),
          createdAt: a.created_at,
          durationSec: a.duree_secondes ?? null,
        };
        (grouped[a.marche_event_id] ||= []).push(item);
      });

      // Per-event steps: ALL steps linked to the exploration that belong to this event.
      // We need every step (not just those with a media) to give geographic context
      // — neighbouring steps render as small grey dots so the user can situate
      // the highlighted point within the broader walk.
      // exploration_marches has no event_id link, so we surface ALL exploration
      // steps on every event of that exploration. Acceptable: an exploration is
      // a single coherent territory.
      const allExplorationSteps: MarcheStep[] = Array.from(stepById.values());

      return events.map(ev => {
        const steps: MarcheStep[] = allExplorationSteps;
        return {
          id: ev.id,
          title: ev.title,
          lieu: ev.lieu,
          date: ev.date_marche,
          latitude: ev.latitude ?? null,
          longitude: ev.longitude ?? null,
          steps,
          items: grouped[ev.id] || [],
        };
      });
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
    marcheId: null,
    marcheStepName: null,
    gps: null,
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
