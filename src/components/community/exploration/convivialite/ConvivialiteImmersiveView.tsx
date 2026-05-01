import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import ConvivialiteContent from './ConvivialiteContent';

interface Props {
  open: boolean;
  onClose: () => void;
  explorationId: string | undefined;
  explorationName?: string;
  userId?: string;
  userRole?: string | null;
  isAdmin?: boolean;
}

/**
 * Overlay plein écran historique. Conservé pour compatibilité, mais la page
 * Exploration utilise désormais <ConvivialiteContent variant="inline" /> dans
 * un sous-onglet de l'onglet "Marcheurs".
 */
const ConvivialiteImmersiveView: React.FC<Props> = ({
  open, onClose, explorationId, explorationName, userId, userRole, isAdmin,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] bg-gradient-to-br from-neutral-950 via-emerald-950/40 to-neutral-950 overflow-y-auto"
        >
          <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-white font-semibold text-sm truncate">
                  Convivialité {explorationName ? `— ${explorationName}` : ''}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6">
            <ConvivialiteContent
              explorationId={explorationId}
              explorationName={explorationName}
              userId={userId}
              userRole={userRole}
              isAdmin={isAdmin}
              variant="immersive"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConvivialiteImmersiveView;
