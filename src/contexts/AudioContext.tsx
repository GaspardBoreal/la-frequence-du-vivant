import React, { createContext, useContext, useRef } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface AudioContextType {
  audioRef: React.RefObject<HTMLAudioElement>;
  playRecording: ReturnType<typeof useAudioPlayer>['playRecording'];
  pause: ReturnType<typeof useAudioPlayer>['pause'];
  stop: ReturnType<typeof useAudioPlayer>['stop'];
  setVolume: ReturnType<typeof useAudioPlayer>['setVolume'];
  setPlaybackRate: ReturnType<typeof useAudioPlayer>['setPlaybackRate'];
  seekTo: ReturnType<typeof useAudioPlayer>['seekTo'];
  currentRecording: ReturnType<typeof useAudioPlayer>['currentRecording'];
  isPlaying: ReturnType<typeof useAudioPlayer>['isPlaying'];
  currentTime: ReturnType<typeof useAudioPlayer>['currentTime'];
  duration: ReturnType<typeof useAudioPlayer>['duration'];
  volume: ReturnType<typeof useAudioPlayer>['volume'];
  playbackRate: ReturnType<typeof useAudioPlayer>['playbackRate'];
  isLoading: ReturnType<typeof useAudioPlayer>['isLoading'];
  error: ReturnType<typeof useAudioPlayer>['error'];
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioPlayer = useAudioPlayer();

  return (
    <AudioContext.Provider value={audioPlayer}>
      {children}
      <audio ref={audioPlayer.audioRef} preload="metadata" />
    </AudioContext.Provider>
  );
};

export const useGlobalAudioPlayer = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useGlobalAudioPlayer must be used within AudioProvider');
  }
  return context;
};