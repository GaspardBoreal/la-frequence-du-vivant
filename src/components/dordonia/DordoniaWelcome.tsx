import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves } from 'lucide-react';

interface DordoniaWelcomeProps {
  onContinue: () => void;
}

const DordoniaWelcome: React.FC<DordoniaWelcomeProps> = ({ onContinue }) => {
  const [phase, setPhase] = useState<'title' | 'phrase' | 'ready'>('title');
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('phrase'), 2000),
      setTimeout(() => setPhase('ready'), 4000),
      setTimeout(() => setCanContinue(true), 5000),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleClick = () => {
    if (canContinue) {
      onContinue();
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 cursor-pointer"
      onClick={handleClick}
    >
      {/* Animated background waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-cyan-950/30 via-transparent to-transparent"
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Waves className="h-8 w-8 text-cyan-400/60" />
          </div>
          <h1 className="font-crimson text-5xl md:text-7xl text-foreground tracking-wide">
            DORDONIA
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== 'title' ? 0.7 : 0 }}
            transition={{ duration: 1 }}
            className="text-lg text-muted-foreground mt-4 text-center mx-auto"
          >
            Marcher, écouter et décider avec la rivière
          </motion.p>
        </motion.div>

        {/* Central phrase */}
        <AnimatePresence>
          {(phase === 'phrase' || phase === 'ready') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5 }}
              className="mb-12"
            >
              <p className="font-crimson text-xl md:text-2xl text-cyan-300/80 italic text-center mx-auto">
                « Nous n'écrivons qu'après la rivière,<br />
                commencez par marcher ou par écouter. »
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue hint - positioned outside content container for proper centering */}
      <AnimatePresence>
        {canContinue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute bottom-16 left-0 right-0 flex justify-center"
          >
            <motion.p
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm text-muted-foreground text-center"
            >
              Toucher pour continuer
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2, delay: 3 }}
        className="absolute bottom-4 left-0 right-0 flex justify-center"
      >
        <p className="font-crimson text-sm tracking-wide text-muted-foreground/60 italic text-center">
          © 2026 Gaspard Boréal / Mots, marches et code sous licence CC BY-NC-SA 4.0
        </p>
      </motion.footer>
    </motion.div>
  );
};

export default DordoniaWelcome;
