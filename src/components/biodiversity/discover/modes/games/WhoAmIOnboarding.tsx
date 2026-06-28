import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles, Trophy, Lightbulb } from 'lucide-react';

interface Props {
  open: boolean;
  onStart: () => void;
}

const STORAGE_KEY = 'mdv.whoami.onboarding.v1.seen';

const WhoAmIOnboarding: React.FC<Props> = ({ open, onStart }) => {
  const [blur, setBlur] = useState(24);
  const [neverShow, setNeverShow] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBlur(24);
    const seq = [24, 14, 6, 0, 0, 24];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % seq.length;
      setBlur(seq[i]);
    }, 900);
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            <p className="text-xs uppercase tracking-[0.3em] text-amber-800/70">Mode enfant · Qui suis-je</p>
            <h2
              className="mt-1 text-4xl sm:text-5xl leading-tight"
              style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
            >
              L'espèce mystère <span className="text-emerald-700">✿</span>
            </h2>
            <p className="mt-2 text-lg" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
              Observe l'image floutée et choisis le <strong>bon nom</strong> parmi 4 espèces.
            </p>

            {/* Mini démo animée flou → net */}
            <div className="my-5 flex justify-center">
              <div className="relative w-40 h-28 rounded-2xl overflow-hidden border-2 border-[#3B2A1A]/20 shadow-inner bg-amber-100">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 30% 40%, #6ee7b7 0%, #10b981 35%, #064e3b 75%)',
                    filter: `blur(${blur}px) saturate(1.3)`,
                    transition: 'filter 0.8s ease',
                  }}
                />
                <div className="absolute bottom-1 right-2 text-[10px] uppercase tracking-widest text-white/80 mix-blend-difference">
                  {blur === 0 ? 'Net' : 'Mystère…'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left text-sm">
              <Rule icon={<Eye className="h-5 w-5 text-amber-800" />} text="Observe la silhouette ou les couleurs" />
              <Rule icon={<Lightbulb className="h-5 w-5 text-emerald-700" />} text="Jusqu'à 4 indices si tu sèches" />
              <Rule icon={<Sparkles className="h-5 w-5 text-sky-700" />} text="Chaque indice coûte un peu d'étoile" />
              <Rule icon={<Trophy className="h-5 w-5 text-rose-700" />} text="Gagne en devinant sans aide" />
            </div>

            <p className="mt-4 text-base text-amber-900/80" style={{ fontFamily: '"Caveat", cursive', fontSize: 22 }}>
              <Sparkles className="inline h-4 w-4 mr-1" />
              Plusieurs styles de mystères t'attendent.
            </p>

            <button
              onClick={confirm}
              className="mt-4 px-7 py-3 rounded-full bg-emerald-300 hover:bg-emerald-400 transition-colors border-2 border-[#3B2A1A]/15 shadow-[4px_4px_0_rgba(59,42,26,0.2)]"
              style={{ fontFamily: '"Caveat", cursive', fontWeight: 700, fontSize: 26 }}
            >
              Je tente ma chance !
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
    <span style={{ fontFamily: '"Patrick Hand", sans-serif' }} className="leading-tight">{text}</span>
  </div>
);

export function hasSeenWhoAmIOnboarding(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export default WhoAmIOnboarding;
