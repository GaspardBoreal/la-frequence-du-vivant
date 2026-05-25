import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DordoniaChat from './DordoniaChat';
import DraggableFab from '@/components/ui/DraggableFab';

const DordoniaFloatingButton: React.FC = () => {
  const isMobile = useIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleClick = () => {
    setIsChatOpen(true);
    setShowTooltip(false);
  };

  return (
    <>
      {/* Chat Dordonia */}
      <DordoniaChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Bouton flottant - masqué quand le chat est ouvert */}
      <DraggableFab id="dordonia-fab" size={56} zIndex={9999} hidden={isChatOpen}>
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-3 whitespace-nowrap pointer-events-none"
            >
              <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl px-4 py-2.5 shadow-xl">
                <p className="text-sm font-medium text-foreground">
                  Dialoguer avec Dordonia
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  L'esprit des marches
                </p>
              </div>
              <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-background/95 border-r border-b border-border/50 transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleClick}
          onMouseEnter={() => !isMobile && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={() => isMobile && setShowTooltip(true)}
          onTouchEnd={() => setTimeout(() => setShowTooltip(false), 2000)}
          className="relative group"
          whileTap={{ scale: 0.95 }}
          aria-label="Dialoguer avec Dordonia - L'esprit des marches sur la rivière Dordogne"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-500/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-400/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 shadow-lg shadow-cyan-900/30 hover:shadow-xl hover:shadow-cyan-800/40 transition-all duration-300 flex items-center justify-center border border-cyan-400/30 backdrop-blur-sm">
            <Waves className="h-6 w-6 text-white/90 group-hover:text-white transition-colors" />
          </div>
          <span className="sr-only">
            Dialoguer avec Dordonia - Ouvrir le dialogue avec l'esprit des marches sur la rivière Dordogne
          </span>
        </motion.button>
      </DraggableFab>
    </>
  );
};

export default DordoniaFloatingButton;
