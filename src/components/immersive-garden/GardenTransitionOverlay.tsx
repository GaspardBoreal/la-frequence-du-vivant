import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Props {
  active: boolean;
  origin: { x: number; y: number } | null;
  tint: string;
  onDone: () => void;
}

/**
 * Overlay « portail végétal » : iris organique + voile doré + pétales SVG.
 * S'exécute lors de la navigation entre fiches Jardin voisines.
 */
const GardenTransitionOverlay: React.FC<Props> = ({ active, origin, tint, onDone }) => {
  const reduce = useReducedMotion();

  // Génère 14 pétales avec trajectoires aléatoires stables durant l'anim
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.6;
        const dist = 220 + Math.random() * 340;
        return {
          id: i,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          rot: (Math.random() - 0.5) * 540,
          delay: Math.random() * 0.15,
          size: 14 + Math.random() * 18,
        };
      }),
    [active],
  );

  // Sécurité : garantit que onDone est appelé si la fin d'anim ne tire pas
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onDone, reduce ? 300 : 950);
    return () => clearTimeout(t);
  }, [active, reduce, onDone]);

  const cx = origin?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const cy = origin?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
  const cxPct = typeof window !== 'undefined' ? (cx / window.innerWidth) * 100 : 50;
  const cyPct = typeof window !== 'undefined' ? (cy / window.innerHeight) * 100 : 50;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[80] pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {reduce ? (
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          ) : (
            <>
              {/* Iris organique : cercle qui grandit et se ferme */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at ${cxPct}% ${cyPct}%, ${tint}, #0a0603 65%)`,
                  clipPath: `circle(0% at ${cxPct}% ${cyPct}%)`,
                }}
                initial={{ clipPath: `circle(0% at ${cxPct}% ${cyPct}%)`, opacity: 0.95 }}
                animate={{ clipPath: `circle(160% at ${cxPct}% ${cyPct}%)`, opacity: 1 }}
                transition={{ duration: 0.85, ease: [0.19, 1, 0.22, 1] }}
              />

              {/* Voile doré */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at ${cxPct}% ${cyPct}%, #f5d68a, transparent 55%)`,
                  mixBlendMode: 'screen',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0] }}
                transition={{ duration: 0.7, times: [0, 0.4, 1], ease: 'easeOut' }}
              />

              {/* Pétales SVG */}
              <div className="absolute inset-0 overflow-hidden">
                {petals.map((p) => (
                  <motion.svg
                    key={p.id}
                    width={p.size}
                    height={p.size}
                    viewBox="0 0 24 24"
                    className="absolute"
                    style={{ left: cx - p.size / 2, top: cy - p.size / 2, color: tint }}
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
                    animate={{ x: p.dx, y: p.dy, rotate: p.rot, opacity: [0, 1, 0] }}
                    transition={{ duration: 0.9, delay: p.delay, ease: [0.19, 1, 0.22, 1] }}
                  >
                    <path
                      d="M12 2 C15 8, 22 10, 12 22 C2 10, 9 8, 12 2 Z"
                      fill="currentColor"
                      opacity={0.85}
                    />
                  </motion.svg>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GardenTransitionOverlay;
