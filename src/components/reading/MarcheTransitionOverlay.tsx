import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface MarcheTransitionOverlayProps {
  visible: boolean;
  marcheName: string;
  marcheVille: string;
  marcheOrdre: number;
  totalMarches: number;
  direction: 'next' | 'previous';
  onDismiss: () => void;
}

// Animated wave icon representing the river flow
const WaveIcon = ({ direction }: { direction: 'next' | 'previous' }) => (
  <motion.svg 
    width="80" 
    height="40" 
    viewBox="0 0 80 40"
    className="text-emerald-400 dark:text-emerald-500"
  >
    {/* Multiple wave layers for depth */}
    <motion.path
      d="M0 20 Q10 10, 20 20 T40 20 T60 20 T80 20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity={0.3}
      animate={{
        d: [
          "M0 20 Q10 10, 20 20 T40 20 T60 20 T80 20",
          "M0 20 Q10 30, 20 20 T40 20 T60 20 T80 20",
          "M0 20 Q10 10, 20 20 T40 20 T60 20 T80 20"
        ],
        x: direction === 'next' ? [0, -10, 0] : [0, 10, 0]
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M0 20 Q10 12, 20 20 T40 20 T60 20 T80 20"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      opacity={0.6}
      animate={{
        d: [
          "M0 20 Q10 12, 20 20 T40 20 T60 20 T80 20",
          "M0 20 Q10 28, 20 20 T40 20 T60 20 T80 20",
          "M0 20 Q10 12, 20 20 T40 20 T60 20 T80 20"
        ],
        x: direction === 'next' ? [0, -5, 0] : [0, 5, 0]
      }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
    />
    <motion.path
      d="M0 20 Q10 14, 20 20 T40 20 T60 20 T80 20"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      animate={{
        d: [
          "M0 20 Q10 14, 20 20 T40 20 T60 20 T80 20",
          "M0 20 Q10 26, 20 20 T40 20 T60 20 T80 20",
          "M0 20 Q10 14, 20 20 T40 20 T60 20 T80 20"
        ]
      }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
    />
  </motion.svg>
);

export default function MarcheTransitionOverlay({
  visible,
  marcheName,
  marcheVille,
  marcheOrdre,
  totalMarches,
  direction,
  onDismiss
}: MarcheTransitionOverlayProps) {
  // Auto-dismiss timer
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          onClick={onDismiss}
          role="dialog"
          aria-label={`Transition vers ${marcheName}`}
        >
          {/* Backdrop with blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/75 dark:bg-slate-950/85 backdrop-blur-md"
          />
          
          {/* Transition Card */}
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.9,
              y: direction === 'next' ? 30 : -30 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              y: direction === 'next' ? -20 : 20 
            }}
            transition={{ 
              duration: 0.4, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="relative z-10 text-center px-8 py-10 md:px-12 md:py-12 max-w-md mx-4"
          >
            {/* Wave Icon */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="flex justify-center mb-6"
            >
              <WaveIcon direction={direction} />
            </motion.div>
            
            {/* Marche Order Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mb-4"
            >
              <Badge 
                variant="outline" 
                className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 px-4 py-1.5 text-sm font-medium tracking-wide"
              >
                Marche {marcheOrdre} sur {totalMarches}
              </Badge>
            </motion.div>
            
            {/* Marche Name */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              className="font-crimson text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-3 leading-tight"
            >
              {marcheName}
            </motion.h2>
            
            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="flex items-center justify-center gap-2 text-slate-300 mb-8"
            >
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-sm md:text-base">{marcheVille}</span>
            </motion.div>
            
            {/* Skip hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-xs text-slate-400 tracking-wide"
            >
              Cliquer pour continuer
            </motion.p>
            
            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.4, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 origin-left"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
