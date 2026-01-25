import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Feather, MapPin } from 'lucide-react';
import type { RandomText } from '@/hooks/useRandomExplorationData';
import { extractHaikuLines, extractPoeticFragment, getApparitionTypeFromTextType } from '@/utils/fableMoralExtractor';

interface FragmentApparitionProps {
  text: RandomText;
  position: { x: number; y: number };
  onExpire: () => void;
  ttl: number;
}

const FragmentApparition: React.FC<FragmentApparitionProps> = ({
  text,
  position,
  onExpire,
  ttl,
}) => {
  const [isPinned, setIsPinned] = useState(false);
  
  const apparitionType = getApparitionTypeFromTextType(text.typeTexte);
  
  // Extraire le contenu approprié selon le type
  const displayContent = apparitionType === 'haiku' 
    ? extractHaikuLines(text.contenu)
    : [extractPoeticFragment(text.contenu, 150)];

  // Auto-expire après TTL
  useEffect(() => {
    if (isPinned) return;
    const timer = setTimeout(onExpire, ttl);
    return () => clearTimeout(timer);
  }, [ttl, onExpire, isPinned]);

  const handleClick = () => {
    setIsPinned(!isPinned);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{
        opacity: isPinned ? 1 : 0.8,
        x: 0,
      }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      className="absolute max-w-sm cursor-pointer"
      onClick={handleClick}
    >
      <div className={`
        p-5 rounded-2xl backdrop-blur-md
        bg-rose-950/30 border border-rose-500/15
        ${isPinned ? 'ring-2 ring-rose-400/30' : ''}
        transition-all duration-300
      `}>
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-3">
          <Feather className="h-3 w-3 text-rose-400/60" />
          <span className="text-xs uppercase tracking-widest text-rose-400/50">
            {text.typeTexte}
          </span>
        </div>

        {/* Contenu poétique */}
        <div className="space-y-1">
          {displayContent.map((line, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.15 }}
              className="font-crimson text-base text-rose-100/90 italic leading-relaxed"
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Titre et lieu */}
        <div className="mt-4 flex items-center justify-between text-xs text-rose-300/40">
          <span className="truncate max-w-[60%]">{text.titre}</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {text.marcheVille}
          </span>
        </div>

        {/* Indicateur pinned */}
        {isPinned && (
          <p className="mt-2 text-xs text-rose-400/40 text-center">
            ✧ Fixé — toucher pour libérer
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default FragmentApparition;
