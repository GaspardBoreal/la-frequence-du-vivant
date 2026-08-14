import React from 'react';
import { useInView, useMotionValue, animate } from 'framer-motion';

/** Compteur animé au premier passage dans le viewport. */
export const CountUp: React.FC<{
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}> = ({ value, decimals = 0, duration = 1.2, className }) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const [display, setDisplay] = React.useState('0');

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v.toFixed(decimals).replace('.', ',')),
    });
    return () => controls.stop();
  }, [inView, value, decimals, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};

export default CountUp;
