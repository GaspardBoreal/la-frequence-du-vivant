import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const MURMURIA_URL = 'https://gaspard-boreal.app.n8n.cloud/webhook/3d02e00f-964a-413f-a036-5f05211f92bc/chat';

const MurmuriaFloatingButton: React.FC = () => {
  const isMobile = useIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    window.open(MURMURIA_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8 z-50">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-3 whitespace-nowrap"
          >
            <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl px-4 py-2.5 shadow-xl">
              <p className="text-sm font-medium text-foreground">
                Murmurer avec la rivière Dordogne
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dialoguer avec Murmuria
              </p>
            </div>
            {/* Flèche du tooltip */}
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-background/95 border-r border-b border-border/50 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton principal */}
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => !isMobile && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => isMobile && setShowTooltip(true)}
        onTouchEnd={() => setTimeout(() => setShowTooltip(false), 2000)}
        className="relative group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Murmurer avec la rivière Dordogne - Dialoguer avec Murmuria"
      >
        {/* Effet d'ondulation de fond */}
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-500/30"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-400/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        {/* Bouton principal */}
        <div className="relative h-11 w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 shadow-lg shadow-cyan-900/30 hover:shadow-xl hover:shadow-cyan-800/40 transition-all duration-300 flex items-center justify-center border border-cyan-400/30 backdrop-blur-sm">
          <Waves className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white/90 group-hover:text-white transition-colors" />
        </div>

        {/* Texte accessible aux lecteurs d'écran */}
        <span className="sr-only">
          Murmurer avec la rivière Dordogne - Ouvrir le dialogue avec Murmuria, l'esprit de la Dordogne
        </span>
      </motion.button>
    </div>
  );
};

export default MurmuriaFloatingButton;
