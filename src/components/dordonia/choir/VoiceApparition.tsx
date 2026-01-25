import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, MapPin } from 'lucide-react';
import type { RandomAudio } from '@/hooks/useRandomExplorationData';

interface VoiceApparitionProps {
  audioData: RandomAudio;
  position: { x: number; y: number };
  onExpire: () => void;
  ttl: number;
  zIndex?: number;
}

const VoiceApparition: React.FC<VoiceApparitionProps> = ({
  audioData,
  position,
  onExpire,
  ttl,
  zIndex = 100,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [waveformBars] = useState(() => 
    Array.from({ length: 12 }, () => Math.random() * 0.6 + 0.4)
  );

  // Auto-expire après TTL
  useEffect(() => {
    if (isPinned) return;
    const timer = setTimeout(onExpire, ttl);
    return () => clearTimeout(timer);
  }, [ttl, onExpire, isPinned]);

  // Initialiser l'audio
  useEffect(() => {
    if (audioData.url) {
      audioRef.current = new Audio(audioData.url);
      audioRef.current.volume = 0.25;
      
      // Auto-play avec probabilité de 20%
      if (Math.random() < 0.2) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          // Auto-stop après 12 secondes
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
          }, 12000);
        }).catch(() => {
          // Autoplay blocked, c'est ok
        });
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioData.url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      
      // Auto-stop après 15 secondes max
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }, 15000);
    }
  };

  const handleClick = () => {
    setIsPinned(!isPinned);
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isPinned ? 1 : 0.85,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ 
        left: `${Math.min(position.x, 50)}%`,
        top: `${position.y}%`,
        zIndex,
      }}
      className="absolute w-64 sm:w-72 max-w-[calc(100vw-2rem)] cursor-pointer"
      onClick={handleClick}
    >
      <div className={`
        p-4 rounded-2xl backdrop-blur-md
        bg-amber-950/30 border border-amber-500/15
        ${isPinned ? 'ring-2 ring-amber-400/30' : ''}
        transition-all duration-300
      `}>
        {/* Waveform animée */}
        <div className="flex items-center justify-center gap-0.5 h-8 mb-3">
          {waveformBars.map((height, index) => (
            <motion.div
              key={index}
              className="w-1 bg-amber-400/60 rounded-full"
              animate={isPlaying ? {
                height: [
                  `${height * 20}px`,
                  `${height * 32}px`,
                  `${height * 16}px`,
                  `${height * 28}px`,
                  `${height * 20}px`,
                ],
              } : {
                height: `${height * 20}px`,
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.05,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Titre */}
        <h3 className="font-crimson text-sm text-amber-200 text-center truncate mb-1">
          {audioData.titre || 'Fragment sonore'}
        </h3>

        {/* Type littéraire et durée */}
        <div className="flex items-center justify-center gap-3 text-xs text-amber-400/50 mb-3">
          {audioData.literaryType && (
            <span className="uppercase tracking-wider">{audioData.literaryType}</span>
          )}
          {audioData.dureeSecondes && (
            <span>{formatDuration(audioData.dureeSecondes)}</span>
          )}
        </div>

        {/* Bouton play/pause */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className={`
            w-full py-2 px-3 rounded-lg text-xs
            flex items-center justify-center gap-2
            transition-colors duration-200
            ${isPlaying 
              ? 'bg-amber-500/30 text-amber-200' 
              : 'bg-amber-500/10 text-amber-400/70 hover:bg-amber-500/20'
            }
          `}
        >
          {isPlaying ? (
            <>
              <VolumeX className="h-3 w-3" />
              <span>Arrêter</span>
            </>
          ) : (
            <>
              <Volume2 className="h-3 w-3" />
              <span>Écouter</span>
            </>
          )}
        </motion.button>

        {/* Lieu */}
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-amber-300/40">
          <MapPin className="h-3 w-3" />
          {audioData.marcheVille}
        </div>

        {/* Indicateur pinned */}
        {isPinned && (
          <p className="mt-2 text-xs text-amber-400/40 text-center">
            ✧ Fixé — toucher pour libérer
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceApparition;
