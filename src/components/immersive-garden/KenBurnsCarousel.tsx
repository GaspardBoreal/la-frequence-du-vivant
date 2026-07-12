import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Props {
  photos: { id: string; url: string }[];
  fallback?: string | null;
  intervalMs?: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const KenBurnsCarousel: React.FC<Props> = ({ photos, fallback, intervalMs = 6500 }) => {
  const reduce = useReducedMotion();
  const list = useMemo(() => {
    const items = photos.length > 0 ? shuffle(photos) : (fallback ? [{ id: 'fallback', url: fallback }] : []);
    return items;
  }, [photos, fallback]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (list.length <= 1 || reduce) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), intervalMs);
    return () => clearInterval(t);
  }, [list.length, intervalMs, reduce]);

  if (list.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-950" />
    );
  }

  const current = list[idx];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: reduce ? 1.08 : 1.22 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.6, ease: 'easeInOut' },
            scale: { duration: intervalMs / 1000 + 2, ease: 'linear' },
          }}
          className="absolute inset-0"
        >
          <img
            src={current.url}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>
      {/* Vignette + dégradé pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
      />
    </div>
  );
};

export default KenBurnsCarousel;
