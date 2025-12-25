import { useMemo } from 'react';
import { useExplorationMarches } from '@/hooks/useExplorations';
import type { ExplorationAudioTrack } from '@/types/exploration';

export interface AudioTrackEnhanced extends ExplorationAudioTrack {
  marcheName: string;
  marcheLocation?: string;
  marcheIndex: number;
  audioIndex: number;
  totalTracksInMarche: number;
  globalIndex: number;
  type_audio?: string | null;
}

export const useExplorationAudioPlaylist = (explorationId: string) => {
  const { data: marches = [], isLoading, error } = useExplorationMarches(explorationId);

  const audioPlaylist = useMemo((): AudioTrackEnhanced[] => {
    if (!marches.length) return [];

    const playlist: AudioTrackEnhanced[] = [];
    let globalIndex = 0;

    marches
      .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
      .forEach((marche, marcheIndex) => {
        if (marche.marche?.audio && marche.marche.audio.length > 0) {
          const sortedAudio = [...marche.marche.audio].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
          
          sortedAudio.forEach((audio, audioIndex) => {
            playlist.push({
              id: audio.id,
              url: audio.url_supabase,
              title: audio.titre || `Audio ${audioIndex + 1}`,
              description: audio.description,
              duration: audio.duree_secondes || 0,
              order: audio.ordre || audioIndex,
              marcheName: marche.marche?.nom_marche || `Marche ${marcheIndex + 1}`,
              marcheLocation: marche.marche?.ville,
              marcheIndex,
              audioIndex,
              totalTracksInMarche: sortedAudio.length,
              globalIndex: globalIndex++,
              type_audio: (audio as any).type_audio || null
            });
          });
        }
      });

    return playlist;
  }, [marches]);

  const totalDuration = useMemo(() => {
    return audioPlaylist.reduce((total, track) => total + (track.duration || 0), 0);
  }, [audioPlaylist]);

  const totalMarches = useMemo(() => {
    return new Set(audioPlaylist.map(track => track.marcheIndex)).size;
  }, [audioPlaylist]);

  return {
    audioPlaylist,
    totalDuration,
    totalMarches,
    totalTracks: audioPlaylist.length,
    isLoading,
    error,
    isEmpty: audioPlaylist.length === 0
  };
};