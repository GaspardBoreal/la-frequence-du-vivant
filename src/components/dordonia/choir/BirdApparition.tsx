import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bird, Play, Pause, MapPin, Calendar } from 'lucide-react';
import type { RandomBird } from '@/hooks/useRandomExplorationData';

interface BirdApparitionProps {
  bird: RandomBird;
  onExpire: () => void;
  onFocus?: () => void;
  ttl: number;
}

const BirdApparition: React.FC<BirdApparitionProps> = ({
  bird,
  onExpire,
  onFocus,
  ttl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  // Auto-expire après TTL (sauf si pinned)
  useEffect(() => {
    if (isPinned) return;
    
    const timer = setTimeout(onExpire, ttl);
    return () => clearTimeout(timer);
  }, [ttl, onExpire, isPinned]);

  // Charger l'audio Xeno-Canto
  useEffect(() => {
    const fetchXenoCantoAudio = async () => {
      try {
        const response = await fetch(
          `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/xeno-canto`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scientificName: bird.scientificName }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.recordings && data.recordings.length > 0) {
            // Prendre le premier enregistrement de qualité A ou B
            const recording = data.recordings.find((r: any) => r.q === 'A' || r.q === 'B') || data.recordings[0];
            if (recording?.file) {
              setAudio(new Audio(recording.file));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Xeno-Canto audio:', error);
      }
    };

    fetchXenoCantoAudio();
  }, [bird.scientificName]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = 0.3;
      audio.play();
      setIsPlaying(true);
      
      // Auto-stop après 10 secondes
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }, 10000);
    }
  };

  const handleClick = () => {
    onFocus?.();
    setIsPinned(!isPinned);
  };

  const formattedDate = bird.observationDate 
    ? new Date(bird.observationDate).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long' 
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: isPinned ? 1 : 0.85,
        scale: isPinned ? 1.05 : 1,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.6, y: -20 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`w-64 sm:w-72 max-w-[calc(100vw-2rem)] transition-shadow duration-300 ${
        isPinned ? 'shadow-2xl shadow-cyan-500/30' : 'shadow-lg shadow-black/30'
      }`}
      onClick={handleClick}
    >
      <div className={`
        p-4 rounded-2xl backdrop-blur-md
        bg-cyan-950/40 border border-cyan-500/20
        ${isPinned ? 'ring-2 ring-cyan-400/40' : ''}
        transition-all duration-300
      `}>
        {/* Header avec icône */}
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="p-2 rounded-full bg-cyan-500/20"
          >
            <Bird className="h-5 w-5 text-cyan-400" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-cyan-200 text-sm truncate">
              {bird.commonName || bird.scientificName}
            </h3>
            <p className="font-crimson text-xs text-cyan-400/60 italic truncate">
              {bird.scientificName}
            </p>
          </div>
        </div>

        {/* Métadonnées */}
        <div className="mt-3 flex items-center gap-3 text-xs text-cyan-300/50">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {bird.location}
          </span>
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          )}
        </div>

        {/* Bouton audio Xeno-Canto */}
        {audio && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            className={`
              mt-3 w-full py-2 px-3 rounded-lg text-xs
              flex items-center justify-center gap-2
              transition-colors duration-200
              ${isPlaying 
                ? 'bg-cyan-500/30 text-cyan-200' 
                : 'bg-cyan-500/10 text-cyan-400/70 hover:bg-cyan-500/20'
              }
            `}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3" />
                <span>En écoute...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span>Écouter le chant</span>
              </>
            )}
          </motion.button>
        )}

        {/* Indicateur pinned */}
        {isPinned && (
          <p className="mt-2 text-xs text-cyan-400/40 text-center">
            ✧ Fixé — toucher pour libérer
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default BirdApparition;
