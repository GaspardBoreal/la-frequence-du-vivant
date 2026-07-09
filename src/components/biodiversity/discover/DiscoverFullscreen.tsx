import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Maximize2 } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import DiscoverModeSelector from './DiscoverModeSelector';
import DiscoverHeader from './DiscoverHeader';
import ImmersiveScreensaver from './modes/ImmersiveScreensaver';
import KidsMode from './modes/KidsMode';
import Prospective2100 from './modes/Prospective2100';
import { useDiscoverData } from './useDiscoverData';

export type DiscoverMode = 'hub' | 'kids' | 'immersive' | 'prospective';

interface Props {
  open: boolean;
  onClose: () => void;
  species: BiodiversitySpecies[];
  filtersLabel?: string;
  explorationId?: string;
  initialMode?: DiscoverMode;
}

const DiscoverFullscreen: React.FC<Props> = ({ open, onClose, species, filtersLabel, explorationId, initialMode }) => {
  const [mode, setMode] = React.useState<DiscoverMode>(initialMode ?? 'hub');
  const rootRef = useRef<HTMLDivElement>(null);
  const data = useDiscoverData(species, explorationId);

  // Fullscreen API — cible le vrai conteneur Découverte, pas documentElement.
  // Cela évite les conflits entre l'overlay portalé et les sous-overlays (zoom).
  useEffect(() => {
    if (!open) return;
    const el = rootRef.current;
    if (!el) return;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {/* fallback overlay only */});
    }
    const onFsChange = () => {
      if (!document.fullscreenElement && open) {
        // Si une lightbox zoom est ouverte, on conserve l'expérience Découvrir :
        // certains navigateurs sortent du fullscreen au premier Esc/tap système.
        if (document.querySelector('[data-zoom-lightbox="true"]')) return;
        // user pressed Esc on browser fullscreen — close overlay too
        onClose();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement === el) document.exitFullscreen().catch(() => {});
    };
  }, [open, onClose]);

  // Raccourcis clavier
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode !== 'hub') { setMode('hub'); e.preventDefault(); }
        else { onClose(); }
        return;
      }
      if (e.key === 'h' || e.key === 'H') { setMode('hub'); return; }
      if (mode === 'hub') {
        if (e.key === '1') setMode('kids');
        if (e.key === '2') setMode('immersive');
        if (e.key === '3') setMode('prospective');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, mode, onClose]);

  // Reset mode quand on rouvre
  useEffect(() => {
    if (open) setMode(initialMode ?? 'hub');
  }, [open, initialMode]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={rootRef}
        key="discover-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[2000] bg-black text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Mode Découverte plein écran"
      >
        {/* Header global */}
        <DiscoverHeader
          mode={mode}
          count={species.length}
          filtersLabel={filtersLabel}
          onModeChange={setMode}
          onClose={onClose}
        />

        {/* Body */}
        <div className="absolute inset-0 pt-14">
          <AnimatePresence mode="wait">
            {mode === 'hub' && (
              <motion.div
                key="hub"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <DiscoverModeSelector
                  count={species.length}
                  filtersLabel={filtersLabel}
                  onPick={setMode}
                />
              </motion.div>
            )}
            {mode === 'immersive' && (
              <motion.div key="immersive" {...fade} className="absolute inset-0">
                <ImmersiveScreensaver species={data.withPhoto} photoBy={data.photoBy} />
              </motion.div>
            )}
            {mode === 'kids' && (
              <motion.div key="kids" {...fade} className="absolute inset-0">
                <KidsMode species={data.withPhoto} photoBy={data.photoBy} />
              </motion.div>
            )}
            {mode === 'prospective' && (
              <motion.div key="prospective" {...fade} className="absolute inset-0">
                <Prospective2100 species={species} photoBy={data.photoBy} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
};

export default DiscoverFullscreen;
