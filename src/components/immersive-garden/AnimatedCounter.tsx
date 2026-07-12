import React, { useEffect } from 'react';
import { animate, useMotionValue, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';

interface Props {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

const AnimatedCounter: React.FC<Props> = ({ value, suffix = '', duration = 1.4, className }) => {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: [0.19, 1, 0.22, 1] });
    return () => controls.stop();
  }, [inView, value, duration, mv, reduce]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
