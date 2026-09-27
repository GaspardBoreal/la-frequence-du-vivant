import React, { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';

/** Compteur 12 → 24 avec douze pousses qui sortent d’une ligne de sol. */
const CompteurGerme: React.FC<{ from?: number; to: number }> = ({ from = 12, to }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const mv = useMotionValue(reduce ? to : from);
  const txt = useTransform(mv, (v) => Math.round(v).toString());
  const n = to - from;

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(mv, to, { duration: 0.06 * n + 0.6, ease: 'easeOut' });
    return () => c.stop();
  }, [inView, reduce, mv, to, n]);

  const show = inView || reduce;
  return (
    <div ref={ref}>
      <motion.span className="font-serif text-[30px] leading-none text-[hsl(var(--ds-forest))]">{txt}</motion.span>
      <svg viewBox="0 0 120 22" className="mt-1 h-5 w-full max-w-[140px]" aria-hidden>
        <line x1="0" x2="120" y1="20" y2="20" stroke="hsl(var(--ds-earth))" strokeWidth="1.2" />
        {Array.from({ length: n }, (_, i) => {
          const x = 5 + i * 10;
          const delay = reduce ? 0 : i * 0.06;
          return (
            <g key={i}>
              <motion.path
                d={`M${x} 20 L${x} 10`}
                stroke="hsl(var(--ds-forest-soft))"
                strokeWidth="1.4"
                strokeLinecap="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={show ? { pathLength: 1 } : undefined}
                transition={{ delay, duration: reduce ? 0 : 0.35 }}
              />
              <motion.g
                style={{ originX: `${x}px`, originY: '10px' }}
                initial={{ scale: reduce ? 1 : 0 }}
                animate={show ? { scale: 1 } : undefined}
                transition={{ delay: delay + (reduce ? 0 : 0.3), duration: reduce ? 0 : 0.3 }}
              >
                <ellipse cx={x - 2.5} cy={9} rx="2.6" ry="1.4" fill="hsl(var(--ds-gold))" transform={`rotate(-25 ${x - 2.5} 9)`} />
                <ellipse cx={x + 2.5} cy={9} rx="2.6" ry="1.4" fill="hsl(var(--ds-gold))" transform={`rotate(25 ${x + 2.5} 9)`} />
              </motion.g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default CompteurGerme;
