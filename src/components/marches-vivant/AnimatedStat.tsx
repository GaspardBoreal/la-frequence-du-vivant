import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedStatProps {
  value: number;
  loading?: boolean;
  duration?: number; // ms — same for all instances → synchronized arrival
  label: string;
  sub: string;
  index?: number;
}

const nf = new Intl.NumberFormat('fr-FR');

/**
 * Stat avec compteur animé 0 → value.
 * Tous les compteurs partagent la même durée → arrivée simultanée à la valeur finale.
 * Déclenché par useInView pour effet « waouh » à l'arrivée en viewport.
 */
const AnimatedStat: React.FC<AnimatedStatProps> = ({
  value,
  loading = false,
  duration = 2200,
  label,
  sub,
  index = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [display, setDisplay] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!inView || loading || value <= 0) {
      setDisplay(value > 0 ? 0 : 0);
      return;
    }

    let raf = 0;
    const start = performance.now();
    // easeOutExpo : démarrage rapide, fin moelleuse, très « cinématique »
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(t);
      setDisplay(Math.floor(eased * value));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        setArrived(true);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, loading, value, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="text-center relative"
    >
      <motion.div
        animate={
          arrived
            ? { scale: [1, 1.12, 1], filter: ['drop-shadow(0 0 0 rgba(163,230,53,0))', 'drop-shadow(0 0 18px rgba(163,230,53,0.55))', 'drop-shadow(0 0 0 rgba(163,230,53,0))'] }
            : {}
        }
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="font-crimson text-4xl md:text-5xl text-lime-400 mb-2 tabular-nums tracking-tight"
      >
        {loading ? '—' : nf.format(display)}
      </motion.div>
      <div className="text-sm text-foreground/90 mb-1 leading-snug">{label}</div>
      <div className="text-xs text-muted-foreground leading-snug">{sub}</div>

      {/* Soulignement lumineux qui se trace pendant la progression */}
      <motion.div
        aria-hidden
        className="mx-auto mt-3 h-px bg-gradient-to-r from-transparent via-lime-400/70 to-transparent"
        initial={{ width: 0, opacity: 0 }}
        animate={inView ? { width: '60%', opacity: arrived ? 1 : 0.6 } : {}}
        transition={{ duration: (duration - 200) / 1000, ease: 'easeOut' }}
      />
    </motion.div>
  );
};

export default AnimatedStat;
