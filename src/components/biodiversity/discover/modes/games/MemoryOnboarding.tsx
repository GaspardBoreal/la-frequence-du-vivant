import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Sparkles, Trophy, MousePointerClick } from 'lucide-react';

interface Props {
  open: boolean;
  pairsCount: number;
  onStart: () => void;
}

const STORAGE_KEY = 'mdv.memory.onboarding.v1.seen';

/**
 * Overlay manuscrit expliquant la règle du Memory.
 * S'affiche à la première ouverture, persistance via localStorage.
 */
const MemoryOnboarding: React.FC<Props> = ({ open, pairsCount, onStart }) => {
  const [flipped, setFlipped] = useState(false);
  const [neverShow, setNeverShow] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFlipped(false);
    const t = setInterval(() => setFlipped((f) => !f), 1600);
    return () => clearInterval(t);
  }, [open]);

  const confirm = () => {
    if (neverShow) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    }
    onStart();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="memory-onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-30 flex items-center justify-center px-4"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(255,246,229,0.96), rgba(244,236,218,0.98))',
          }}
        >
          <motion.div
            initial={{ y: 18, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, type: 'spring', stiffness: 220, damping: 22 }}
            className="relative max-w-xl w-full bg-white/85 backdrop-blur rounded-[32px] border-2 border-[#3B2A1A]/15 shadow-[8px_10px_0_rgba(59,42,26,0.15)] p-6 sm:p-8 text-center"
            style={{ color: '#3B2A1A' }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-amber-800/70">Mode enfant · Memory</p>
            <h2
              className="mt-1 text-4xl sm:text-5xl leading-tight"
              style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
            >
              Le Memory du Vivant <span className="text-emerald-700">✿</span>
            </h2>
            <p className="mt-2 text-lg" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
              Retrouve la <strong>photo</strong> et le <strong>nom</strong> de chaque espèce
              de la marche.
            </p>

            {/* Mini démo animée */}
            <div className="my-5 flex items-center justify-center gap-4">
              <DemoCard side={flipped ? 'face' : 'back'} kind="photo" />
              <Sparkles className="h-6 w-6 text-amber-600" />
              <DemoCard side={flipped ? 'face' : 'back'} kind="name" />
            </div>

            {/* 3 règles */}
            <div className="grid grid-cols-3 gap-3 text-left text-sm">
              <Rule
                icon={<MousePointerClick className="h-5 w-5 text-amber-800" />}
                text="Clique pour retourner une carte"
              />
              <Rule
                icon={<Sparkles className="h-5 w-5 text-emerald-700" />}
                text="Associe la photo et le nom"
              />
              <Rule
                icon={<Trophy className="h-5 w-5 text-rose-700" />}
                text="Gagne en peu de coups"
              />
            </div>

            <p className="mt-4 text-base text-amber-900/80" style={{ fontFamily: '"Caveat", cursive', fontSize: 22 }}>
              {pairsCount > 0 ? `${pairsCount} paires t'attendent !` : 'Prépare-toi…'}
            </p>

            <button
              onClick={confirm}
              className="mt-4 px-7 py-3 rounded-full bg-emerald-300 hover:bg-emerald-400 transition-colors border-2 border-[#3B2A1A]/15 shadow-[4px_4px_0_rgba(59,42,26,0.2)]"
              style={{ fontFamily: '"Caveat", cursive', fontWeight: 700, fontSize: 26 }}
            >
              C'est parti !
            </button>

            <label className="mt-3 flex items-center justify-center gap-2 text-xs text-[#3B2A1A]/60 cursor-pointer">
              <input
                type="checkbox"
                checked={neverShow}
                onChange={(e) => setNeverShow(e.target.checked)}
                className="rounded border-[#3B2A1A]/30"
              />
              Ne plus afficher
            </label>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Rule: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center text-center gap-1 px-1">
    <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-300/60 flex items-center justify-center">
      {icon}
    </div>
    <span style={{ fontFamily: '"Patrick Hand", sans-serif' }} className="leading-tight">
      {text}
    </span>
  </div>
);

const DemoCard: React.FC<{ side: 'back' | 'face'; kind: 'photo' | 'name' }> = ({ side, kind }) => (
  <div className="w-20 h-28 [perspective:800px]">
    <motion.div
      animate={{ rotateY: side === 'face' ? 180 : 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full [transform-style:preserve-3d]"
    >
      <div
        className="absolute inset-0 rounded-xl border-2 border-[#3B2A1A]/20 flex items-center justify-center"
        style={{
          backfaceVisibility: 'hidden',
          background:
            'repeating-linear-gradient(45deg, #f5c761 0 10px, #f0b945 10px 20px)',
        }}
      >
        <Leaf className="w-6 h-6 text-amber-900" />
      </div>
      <div
        className="absolute inset-0 rounded-xl bg-white border-2 border-[#3B2A1A]/20 flex items-center justify-center text-center px-1"
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        {kind === 'photo' ? (
          <div className="w-full h-full rounded-[10px] bg-gradient-to-br from-emerald-200 to-emerald-400 flex items-center justify-center">
            <Leaf className="w-7 h-7 text-emerald-900" />
          </div>
        ) : (
          <span
            className="text-base leading-tight text-[#3B2A1A]"
            style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
          >
            Coccinelle
          </span>
        )}
      </div>
    </motion.div>
  </div>
);

export function hasSeenMemoryOnboarding(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export default MemoryOnboarding;
