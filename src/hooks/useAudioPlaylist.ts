import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGlobalAudioPlayer } from '@/contexts/AudioContext';

export type PlayMode = 'order' | 'shuffle';

export interface Track {
  id: string;
  url: string;
  title?: string;
  marche?: string;
}

export const useAudioPlaylist = (tracks: Track[], initialMode: PlayMode = 'order') => {
  const { audioRef, playRecording, pause: pauseGlobal, isPlaying } = useGlobalAudioPlayer();
  const [mode, setMode] = useState<PlayMode>(initialMode);
  const [currentIndex, setCurrentIndex] = useState(0);

  const orderedTracks = useMemo(() => tracks, [tracks]);
  const shuffledTracks = useMemo(() => {
    const copy = [...tracks];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [tracks]);

  const list = mode === 'shuffle' ? shuffledTracks : orderedTracks;
  const currentTrack = list[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
  }, [mode, tracks.length]);

  const playIndex = useCallback(async (index: number) => {
    const t = list[index];
    if (!t) return;
    const recording: any = {
      id: t.id,
      file: t.url,
      url: t.url,
      fileName: t.title || t.id,
      sono: { small: '', med: '', large: '', full: '' },
      osci: { small: '', med: '', large: '' },
      quality: '', length: '', type: '', sex: '', stage: '', method: '', recordist: '',
      date: '', time: '', location: '', latitude: '', longitude: '', altitude: '', license: ''
    };
    await playRecording(recording);
    setCurrentIndex(index);
  }, [list, playRecording]);

  const play = useCallback(async () => {
    await playIndex(currentIndex);
  }, [currentIndex, playIndex]);

  const pause = useCallback(() => {
    pauseGlobal();
  }, [pauseGlobal]);

  const next = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < list.length) {
      await playIndex(nextIndex);
    }
  }, [currentIndex, list.length, playIndex]);

  const prev = useCallback(async () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      await playIndex(prevIndex);
    }
  }, [currentIndex, playIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      void next();
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [audioRef, next]);

  return {
    mode,
    setMode,
    list,
    currentIndex,
    currentTrack,
    isPlaying,
    play,
    pause,
    toggle: async () => (isPlaying ? pause() : play()),
    playIndex,
    next,
    prev,
  };
};
