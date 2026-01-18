import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, ExternalLink, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { XenoCantoRecording } from '@/hooks/useSpeciesXenoCanto';

interface SpeciesAudioPlayerProps {
  recordings: XenoCantoRecording[];
  numRecordings: number;
  scientificName: string;
  isLoading?: boolean;
}

const SpeciesAudioPlayer: React.FC<SpeciesAudioPlayerProps> = ({
  recordings,
  numRecordings,
  scientificName,
  isLoading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentRecording = recordings[currentIndex];

  useEffect(() => {
    // Reset when recordings change
    setCurrentIndex(0);
    setIsPlaying(false);
    setProgress(0);
  }, [recordings]);

  useEffect(() => {
    if (!currentRecording?.file) return;

    const audio = new Audio(currentRecording.file);
    audioRef.current = audio;

    audio.addEventListener('loadstart', () => setIsAudioLoading(true));
    audio.addEventListener('canplay', () => setIsAudioLoading(false));
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [currentRecording?.file]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-sky-500/10 to-emerald-500/10 border border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-2 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!recordings || recordings.length === 0) {
    return null; // Don't show section if no audio available
  }

  const xenoCantoUrl = `https://xeno-canto.org/explore?query=${encodeURIComponent(scientificName)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-br from-sky-500/10 to-emerald-500/10 border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5">
        <div className="flex items-center gap-2 text-white/70">
          <Volume2 className="w-4 h-4" />
          <span className="text-xs font-medium">Écouter cette espèce</span>
        </div>
        <span className="text-xs text-white/40">
          {numRecordings} enregistrement{numRecordings > 1 ? 's' : ''} disponible{numRecordings > 1 ? 's' : ''}
        </span>
      </div>

      {/* Sonogram with play button */}
      <div className="relative aspect-[3/1] bg-slate-900/50">
        {currentRecording.sono?.med ? (
          <img
            src={currentRecording.sono.med}
            alt="Spectrogramme"
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-emerald-900/30 to-sky-900/30">
            <Music className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Progress overlay */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-emerald-400/80 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />

        {/* Play button */}
        <button
          onClick={togglePlay}
          disabled={isAudioLoading}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors"
          >
            <AnimatePresence mode="wait">
              {isAudioLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </motion.div>
              ) : isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Pause className="w-6 h-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Play className="w-6 h-6 text-white ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </button>
      </div>

      {/* Recording metadata */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/60">
            <span>🎙 {currentRecording.recordist}</span>
            {currentRecording.country && (
              <span className="text-white/40">• {currentRecording.locality || currentRecording.country}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <span>{currentRecording.length}</span>
            {currentRecording.quality && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                Q: {currentRecording.quality}
              </span>
            )}
          </div>
        </div>

        {/* Recording selector if multiple */}
        {recordings.length > 1 && (
          <div className="flex items-center gap-1 pt-1">
            {recordings.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                    setProgress(0);
                  }
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-emerald-400'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Link to Xeno-Canto */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-white/60 hover:text-white/90 hover:bg-white/5 text-xs mt-1"
          onClick={() => window.open(xenoCantoUrl, '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1.5" />
          Voir tous les enregistrements sur Xeno-Canto
        </Button>
      </div>
    </motion.div>
  );
};

export default SpeciesAudioPlayer;
