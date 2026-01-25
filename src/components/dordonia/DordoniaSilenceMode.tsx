import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DordoniaSilenceModeProps {
  onExit: () => void;
}

const SILENCE_PHRASES = [
  "Nous n'écrivons qu'après la rivière.",
  "Le silence aussi est une fréquence.",
  "L'attention est une forme de soin.",
  "Écouter, c'est déjà marcher.",
  "La rivière n'a pas besoin de nous.",
];

const DordoniaSilenceMode: React.FC<DordoniaSilenceModeProps> = ({ onExit }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showPhrase, setShowPhrase] = useState(false);

  useEffect(() => {
    // Show phrase after 3 seconds
    const showTimer = setTimeout(() => setShowPhrase(true), 3000);
    
    // Cycle through phrases every 15 seconds
    const cycleTimer = setInterval(() => {
      setShowPhrase(false);
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % SILENCE_PHRASES.length);
        setShowPhrase(true);
      }, 1000);
    }, 15000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(cycleTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      {/* Subtle breathing animation */}
      <motion.div
        animate={{ 
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 bg-gradient-radial from-slate-900/20 via-transparent to-transparent"
      />

      {/* Central phrase */}
      <AnimatePresence mode="wait">
        {showPhrase && (
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 2 }}
            className="font-crimson text-xl md:text-2xl text-slate-400 text-center px-8 max-w-2xl italic"
          >
            {SILENCE_PHRASES[phraseIndex]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Exit button - appears after delay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5, duration: 1 }}
        className="absolute bottom-12"
      >
        <Button
          onClick={onExit}
          variant="ghost"
          className="text-slate-600 hover:text-slate-400 hover:bg-transparent"
        >
          <Sun className="h-4 w-4 mr-2" />
          Revenir
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default DordoniaSilenceMode;
