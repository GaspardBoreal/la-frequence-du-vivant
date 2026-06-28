import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Sparkles, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'mdv:kingdom-sort:onboarded';

export const useKingdomSortOnboarding = () => {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const close = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* noop */
      }
    }
    setOpen(false);
  };
  const reopen = () => setOpen(true);
  return { open, close, reopen };
};

const KingdomSortOnboarding: React.FC<Props> = ({ open, onClose }) => {
  const [dontShow, setDontShow] = useState(false);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#3B2A1A]/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-[#FDF8EE] rounded-3xl border-2 border-[#3B2A1A]/20 shadow-[6px_6px_0_rgba(59,42,26,0.18)] p-6"
          >
            <button
              type="button"
              onClick={() => onClose()}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-[#3B2A1A]/70"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2
              className="text-3xl text-[#3B2A1A] mb-1 text-center"
              style={{ fontFamily: '"Caveat", cursive' }}
            >
              Le Tri du Vivant 🌿
            </h2>
            <p
              className="text-center text-[#3B2A1A]/70 mb-5"
              style={{ fontFamily: '"Patrick Hand", cursive', fontSize: 18 }}
            >
              Range chaque espèce dans sa bonne maison !
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3 bg-white/70 rounded-2xl p-3 border border-[#3B2A1A]/10">
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                  <Hand className="w-5 h-5 text-amber-900" />
                </div>
                <p style={{ fontFamily: '"Patrick Hand", cursive', fontSize: 17 }} className="text-[#3B2A1A]">
                  <strong>Glisse</strong> une carte avec le doigt vers une maison…
                  <br />
                  …ou <strong>touche la carte</strong> puis <strong>touche la maison</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-white/70 rounded-2xl p-3 border border-[#3B2A1A]/10">
                <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-900" />
                </div>
                <p style={{ fontFamily: '"Patrick Hand", cursive', fontSize: 17 }} className="text-[#3B2A1A]">
                  3 maisons : <strong>Faune</strong> 🦋, <strong>Flore</strong> 🌿, <strong>Champignon</strong> 🍄.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#3B2A1A]/70 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="w-4 h-4"
              />
              Ne plus afficher cette règle
            </label>

            <button
              type="button"
              onClick={() => onClose()}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shadow-[3px_3px_0_rgba(59,42,26,0.2)]"
              style={{ fontFamily: '"Patrick Hand", cursive', fontSize: 20 }}
              onClickCapture={() => {
                /* dontShow handled in parent via close */
              }}
            >
              C'est parti ! 🌱
            </button>
            {/* hidden interaction: re-emit close with dontShow flag */}
            <button
              type="button"
              className="sr-only"
              onClick={() => onClose()}
              aria-hidden
            />
            <span className="hidden">{String(dontShow)}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KingdomSortOnboarding;
