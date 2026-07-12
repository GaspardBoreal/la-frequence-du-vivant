import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const ORIGINS = [
  '50% 50%',
  '20% 30%',
  '80% 30%',
  '30% 75%',
  '75% 70%',
  '50% 20%',
  '50% 80%',
];

const KenBurnsCarousel: React.FC<Props> = ({ photos, fallback, intervalMs = 2800 }) => {
  const reduce = useReducedMotion();
  const list = useMemo(() => {
    const items = photos.length > 0 ? shuffle(photos) : (fallback ? [{ id: 'fallback', url: fallback }] : []);
    return items;
  }, [photos, fallback]);

  const [idx, setIdx] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const effectiveInterval = reduce ? 5000 : intervalMs;

  // Random Ken Burns vector + iris origin per image
  const motionParams = useMemo(() => {
    return list.map(() => ({
      x: (Math.random() * 8 - 4),
      y: (Math.random() * 8 - 4),
      origin: ORIGINS[Math.floor(Math.random() * ORIGINS.length)],
    }));
  }, [list]);

  // Preload next
  useEffect(() => {
    if (list.length < 2) return;
    const next = list[(idx + 1) % list.length];
    const img = new Image();
    img.src = next.url;
  }, [idx, list]);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % list.length);
      setFlashKey((k) => k + 1);
    }, effectiveInterval);
    return () => clearInterval(t);
  }, [list.length, effectiveInterval]);

  if (list.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-950" />
    );
  }

  const current = list[idx];
  const params = motionParams[idx] ?? { x: 0, y: 0, origin: '50% 50%' };
  const zoomDuration = effectiveInterval / 1000 + 1.2;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id + '-' + idx}
          initial={{
            opacity: 0,
            scale: 1.15,
            filter: reduce ? 'blur(0px)' : 'blur(14px)',
            clipPath: reduce ? 'circle(140% at 50% 50%)' : `circle(0% at ${params.origin})`,
          }}
          animate={{
            opacity: 1,
            scale: reduce ? 1.15 : 1.35,
            x: `${params.x}%`,
            y: `${params.y}%`,
            filter: 'blur(0px)',
            clipPath: `circle(140% at ${params.origin})`,
          }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: 'easeInOut' } }}
          transition={{
            opacity: { duration: 0.9, ease: 'easeOut' },
            filter: { duration: 0.9, ease: 'easeOut' },
            clipPath: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: zoomDuration, ease: 'linear' },
            x: { duration: zoomDuration, ease: 'linear' },
            y: { duration: zoomDuration, ease: 'linear' },
          }}
          className="absolute inset-0 will-change-transform"
          style={{ transformOrigin: params.origin }}
        >
          <img
            src={current.url}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Flash doré ultra-bref à chaque transition */}
      {!reduce && (
        <AnimatePresence>
          <motion.div
            key={`flash-${flashKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            transition={{ duration: 0.5, times: [0, 0.25, 1], ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, #f5d68a 0%, rgba(245,214,138,0) 65%)',
              mixBlendMode: 'screen',
            }}
          />
        </AnimatePresence>
      )}

      {/* Vignette + dégradé pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
      />
    </div>
  );
};

export default KenBurnsCarousel;
