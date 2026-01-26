import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, MapPin } from 'lucide-react';
import type { RandomText } from '@/hooks/useRandomExplorationData';
import { extractMoralFromFable, cleanHtml } from '@/utils/fableMoralExtractor';

interface MoralApparitionProps {
  text: RandomText;
  onExpire: () => void;
  onFocus?: () => void;
  onRelease?: () => void;
  ttl: number;
}

const MoralApparition: React.FC<MoralApparitionProps> = ({
  text,
  onExpire,
  onFocus,
  onRelease,
  ttl,
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [displayedChars, setDisplayedChars] = useState(0);
  
  // Extraire la morale
  const moral = extractMoralFromFable(text.contenu) || cleanHtml(text.contenu).slice(0, 120) + '…';

  // Animation lettre par lettre
  useEffect(() => {
    if (displayedChars >= moral.length) return;
    
    const timer = setTimeout(() => {
      setDisplayedChars(prev => Math.min(prev + 1, moral.length));
    }, 30); // 30ms par caractère
    
    return () => clearTimeout(timer);
  }, [displayedChars, moral.length]);

  // Auto-expire après TTL
  useEffect(() => {
    if (isPinned) return;
    const timer = setTimeout(onExpire, ttl);
    return () => clearTimeout(timer);
  }, [ttl, onExpire, isPinned]);

  const handleClick = () => {
    onFocus?.();
    const wasPinned = isPinned;
    setIsPinned(!isPinned);
    // Si on pin, afficher tout immédiatement
    if (!isPinned) {
      setDisplayedChars(moral.length);
    }
    
    // Si on libère (était pinned, ne l'est plus), invoquer une nouvelle apparition
    if (wasPinned) {
      setTimeout(() => {
        onRelease?.();
      }, 400);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isPinned ? 1 : 0.85,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className={`w-72 sm:w-80 md:max-w-md max-w-[calc(100vw-2rem)] transition-shadow duration-300 ${
        isPinned ? 'shadow-2xl shadow-violet-500/30' : 'shadow-lg shadow-black/30'
      }`}
      onClick={handleClick}
    >
      <div className={`
        p-6 rounded-2xl backdrop-blur-md text-center
        bg-violet-950/30 border border-violet-500/15
        ${isPinned ? 'ring-2 ring-violet-400/30' : ''}
        transition-all duration-300
      `}>
        {/* Icône */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="flex justify-center mb-4"
        >
          <div className="p-3 rounded-full bg-violet-500/20">
            <BookOpen className="h-5 w-5 text-violet-400" />
          </div>
        </motion.div>

        {/* Morale avec effet de révélation */}
        <p className="font-crimson text-lg text-violet-100/90 italic leading-relaxed min-h-[3em]">
          « {moral.slice(0, displayedChars)}
          {displayedChars < moral.length && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-violet-400"
            >
              |
            </motion.span>
          )}
          {displayedChars >= moral.length && ' »'}
        </p>

        {/* Titre de la fable */}
        <p className="mt-4 text-xs text-violet-400/50 uppercase tracking-wider">
          {text.titre}
        </p>

        {/* Lieu */}
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-violet-300/40">
          <MapPin className="h-3 w-3" />
          {text.marcheVille}
        </div>

        {/* Indicateur pinned */}
        {isPinned && (
          <motion.p 
            className="mt-3 text-xs text-violet-400/40 text-center cursor-pointer"
            whileHover={{ scale: 1.05, color: 'rgba(167, 139, 250, 0.6)' }}
          >
            ✧ Libérer pour invoquer
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default MoralApparition;
