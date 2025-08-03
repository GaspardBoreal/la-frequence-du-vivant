import { useState, useRef, useEffect, useCallback } from 'react';
import { XenoCantoRecording } from '@/types/biodiversity';

interface AudioPlayerState {
  currentRecording: XenoCantoRecording | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
}

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    currentRecording: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isLoading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<AudioPlayerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const playRecording = useCallback(async (recording: XenoCantoRecording) => {
    if (!audioRef.current) return;

    try {
      updateState({ isLoading: true, error: null });

      // Si c'est déjà le recording actuel, toggle play/pause
      if (state.currentRecording?.id === recording.id) {
        if (state.isPlaying) {
          audioRef.current.pause();
          updateState({ isPlaying: false });
        } else {
          await audioRef.current.play();
          updateState({ isPlaying: true });
        }
        return;
      }

      // Nouveau recording
      updateState({ currentRecording: recording });
      audioRef.current.src = recording.file;
      audioRef.current.currentTime = 0;
      
      await audioRef.current.play();
      updateState({ isPlaying: true, isLoading: false });
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      updateState({ 
        error: 'Erreur lors de la lecture audio', 
        isPlaying: false, 
        isLoading: false 
      });
    }
  }, [state.currentRecording, state.isPlaying, updateState]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      updateState({ isPlaying: false });
    }
  }, [updateState]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      updateState({ 
        isPlaying: false, 
        currentTime: 0, 
        currentRecording: null 
      });
    }
  }, [updateState]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      updateState({ volume });
    }
  }, [updateState]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      updateState({ playbackRate: rate });
    }
  }, [updateState]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      updateState({ currentTime: time });
    }
  }, [updateState]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      updateState({ currentTime: audio.currentTime });
    };

    const handleLoadedMetadata = () => {
      updateState({ duration: audio.duration });
    };

    const handleEnded = () => {
      updateState({ isPlaying: false, currentTime: 0 });
    };

    const handleError = () => {
      updateState({ 
        error: 'Erreur lors du chargement audio', 
        isPlaying: false, 
        isLoading: false 
      });
    };

    const handleLoadStart = () => {
      updateState({ isLoading: true });
    };

    const handleCanPlay = () => {
      updateState({ isLoading: false });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [updateState]);

  return {
    audioRef,
    ...state,
    playRecording,
    pause,
    stop,
    setVolume,
    setPlaybackRate,
    seekTo,
  };
};