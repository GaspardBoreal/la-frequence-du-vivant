import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Bird, TreePine, Bug, Sparkles, Check } from 'lucide-react';

const poeticPhases = [
  'Écoute du territoire…',
  'Recueil des présences…',
  'Inventaire des espèces…',
  'Tissage de l'empreinte…',
];

interface BiodiversityRevealAnimationProps {
  isActive: boolean;
  onComplete: () => void;
  result?: {
    marchesProcessed: number;
    totalSpecies: number;
    alreadyCollected?: boolean;
  } | null;
}

const BiodiversityRevealAnimation: React.FC<BiodiversityRevealAnimationProps> = ({
  isActive,
  onComplete,
  result,
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setPhaseIndex(0);
      setShowResult(false);
      return;
    }
    if (result) {
      setShowResult(true);
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
    const interval = setInterval(() => {
      setPhaseIndex(prev => (prev + 1) % poeticPhases.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isActive, result, onComplete]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center max-w-sm">
        {/* Sonar pulse */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {!showResult && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-emerald-500/30"
                  initial={{ scale: 0.3, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
          <motion.div
            className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center ${
              showResult
                ? 'bg-emerald-500/20 border-emerald-500/40'
                : 'bg-gradient-to-br from-emerald-500/15 to-amber-500/10 border-emerald-500/25'
            } border`}
            animate={showResult ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {showResult ? (
              <Check className="w-7 h-7 text-emerald-500" />
            ) : (
              <Leaf className="w-7 h-7 text-emerald-400 animate-pulse" />
            )}
          </motion.div>

          {/* Floating species icons */}
          {!showResult && (
            <>
              {[Bird, TreePine, Bug, Sparkles].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.7, 0],
                    scale: [0.5, 1, 0.5],
                    x: [0, Math.cos((i * Math.PI) / 2) * 48],
                    y: [0, Math.sin((i * Math.PI) / 2) * 48],
                  }}
                  transition={{ duration: 3, delay: i * 0.7, repeat: Infinity }}
                >
                  <Icon className="w-4 h-4 text-emerald-400/60" />
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* Text */}
        <AnimatePresence mode="wait">
          {showResult && result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="text-foreground font-semibold text-base">
                {result.alreadyCollected
                  ? 'Empreinte déjà révélée'
                  : 'Empreinte révélée'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {result.alreadyCollected
                  ? 'Les données ont été collectées récemment.'
                  : `${result.totalSpecies} espèces découvertes sur ${result.marchesProcessed} étape${result.marchesProcessed > 1 ? 's' : ''}`}
              </p>
            </motion.div>
          ) : (
            <motion.p
              key={phaseIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-muted-foreground text-sm font-medium"
            >
              {poeticPhases[phaseIndex]}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {!showResult && (
          <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500"
              initial={{ width: '5%' }}
              animate={{ width: '85%' }}
              transition={{ duration: 30, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BiodiversityRevealAnimation;
