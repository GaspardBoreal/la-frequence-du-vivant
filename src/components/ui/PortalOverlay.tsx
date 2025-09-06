import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PortalOverlayProps {
  visible: boolean;
  label: string;
  progress?: number;
  subtype?: 'intra-marche' | 'cross-marche';
}

const PortalOverlay: React.FC<PortalOverlayProps> = ({ visible, label, progress = 0, subtype = 'intra-marche' }) => {
  // Render nothing on server or if document is unavailable
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-live="assertive"
          role="status"
        >
          <div className="text-center text-white px-8">
            <motion.div
              className="mb-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                <motion.div
                  className="absolute inset-0 border-4 border-emerald-400 rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <motion.h3
                className="text-xl font-bold mb-3"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {label}
              </motion.h3>

              <motion.div
                className="w-48 h-2 mx-auto bg-white/20 rounded-full overflow-hidden"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 192, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              </motion.div>

              <motion.p
                className="text-sm text-white/70 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {subtype === 'cross-marche' ? 'Préparation de la nouvelle marche...' : 'Chargement en cours...'}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PortalOverlay;
