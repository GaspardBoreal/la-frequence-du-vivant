import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationMarches } from '@/hooks/useExplorations';
import type { ExplorationAudioTrack } from '@/types/exploration';

export interface AudioTrackEnhanced extends ExplorationAudioTrack {
  marcheName: string;
  marcheLocation?: string;
  marcheIndex: number;
  marcheId?: string;
  marcheLat?: number | null;
  marcheLng?: number | null;
  audioIndex: number;
  totalTracksInMarche: number;
  globalIndex: number;
  type_audio?: string | null;
  literary_type?: string | null;
  transcription_text?: string | null;
  /** 'admin' = marche_audio (officiel) / 'marcheur' = marcheur_audio (contribution) */
  source: 'admin' | 'marcheur';
}

export const useExplorationAudioPlaylist = (explorationId: string) => {
  const { data: marches = [], isLoading: marchesLoading, error } = useExplorationMarches(explorationId);

  const marcheIds = useMemo(
    () => marches.map((m) => m.marche?.id).filter(Boolean) as string[],
    [marches],
  );

  // Sons des marcheurs (contributions communauté)
  const { data: marcheurAudios = [], isLoading: marcheurLoading } = useQuery({
    queryKey: ['exploration-marcheur-audios', explorationId, marcheIds],
    enabled: marcheIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcheur_audio')
        .select('id, titre, description, url_fichier, duree_secondes, ordre, marche_id, created_at')
        .in('marche_id', marcheIds)
        .order('ordre', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const audioPlaylist = useMemo((): AudioTrackEnhanced[] => {
    if (!marches.length) return [];

    const playlist: AudioTrackEnhanced[] = [];
    let globalIndex = 0;

    const sortedMarches = [...marches].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    sortedMarches.forEach((marche, marcheIndex) => {
      const m = marche.marche;
      if (!m) return;

      // Collecte fusionnée admin + marcheurs pour cette marche
      const adminTracks = (m.audio || []).map((a: any) => ({
        id: a.id,
        title: a.titre,
        description: a.description,
        url: a.url_supabase,
        duration: a.duree_secondes || 0,
        order: a.ordre ?? 0,
        type_audio: a.type_audio || null,
        literary_type: a.literary_type || null,
        transcription_text: a.transcription_text || null,
        source: 'admin' as const,
      }));

      const walkerTracks = marcheurAudios
        .filter((a) => a.marche_id === m.id)
        .map((a) => ({
          id: a.id,
          title: a.titre,
          description: a.description,
          url: a.url_fichier,
          duration: a.duree_secondes || 0,
          order: a.ordre ?? 0,
          type_audio: null,
          literary_type: null,
          transcription_text: null,
          source: 'marcheur' as const,
        }));

      const all = [...adminTracks, ...walkerTracks].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      if (all.length === 0) return;

      all.forEach((audio, audioIndex) => {
        playlist.push({
          id: audio.id,
          url: audio.url,
          title: audio.title || `Audio ${audioIndex + 1}`,
          description: audio.description,
          duration: audio.duration,
          order: audio.order,
          marcheName: m.nom_marche || `Marche ${marcheIndex + 1}`,
          marcheLocation: m.ville,
          marcheIndex,
          marcheId: m.id,
          marcheLat: (m as any)?.latitude ?? null,
          marcheLng: (m as any)?.longitude ?? null,
          audioIndex,
          totalTracksInMarche: all.length,
          globalIndex: globalIndex++,
          type_audio: audio.type_audio,
          literary_type: audio.literary_type,
          transcription_text: audio.transcription_text,
          source: audio.source,
        });
      });
    });

    return playlist;
  }, [marches, marcheurAudios]);

  const totalDuration = useMemo(
    () => audioPlaylist.reduce((total, track) => total + (track.duration || 0), 0),
    [audioPlaylist],
  );

  const totalMarches = useMemo(
    () => new Set(audioPlaylist.map((t) => t.marcheIndex)).size,
    [audioPlaylist],
  );

  return {
    audioPlaylist,
    totalDuration,
    totalMarches,
    totalTracks: audioPlaylist.length,
    isLoading: marchesLoading || marcheurLoading,
    error,
    isEmpty: audioPlaylist.length === 0,
  };
};
