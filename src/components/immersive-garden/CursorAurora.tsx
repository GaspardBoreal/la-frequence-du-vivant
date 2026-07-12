import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/** Halo doré qui suit doucement le curseur — désactivé si prefers-reduced-motion. */
const CursorAurora: React.FC<{ color?: string }> = ({ color = 'rgba(232,198,106,0.28)' }) => {
  const reduce = useReducedMotion();
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const sx = useSpring(x, { stiffness: 60, damping: 20, mass: 1 });
  const sy = useSpring(y, { stiffness: 60, damping: 20, mass: 1 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [reduce, x, y]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[7] mix-blend-screen"
      style={{
        background: `radial-gradient(600px circle at ${sx.get()}px ${sy.get()}px, ${color}, transparent 60%)`,
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          x: sx,
          y: sy,
          translateX: '-50%',
          translateY: '-50%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}, transparent 65%)`,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </motion.div>
  );
};

export default CursorAurora;
