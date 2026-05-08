import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { EventTestimony } from '@/hooks/useEventTestimonies';

interface Props { items: EventTestimony[]; }

const Constellation: React.FC<Props> = ({ items }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const n = items.length;
  if (n === 0) return null;

  // Place each testimony on a spiral
  const points = items.map((t, i) => {
    const angle = i * 0.9;
    const radius = 60 + i * 22;
    const cx = 50 + Math.cos(angle) * radius * 0.35;
    const cy = 50 + Math.sin(angle) * radius * 0.35;
    return { t, cx, cy };
  });

  return (
    <div className="relative rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 dark:from-slate-950 dark:to-slate-900 min-h-[460px] p-4 overflow-hidden">
      {/* stars background */}
      <div className="absolute inset-0 opacity-40">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full h-[440px]">
        {points.map(({ t, cx, cy }, i) => {
          const isHover = hovered === t.id;
          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring' }}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered((h) => (h === t.id ? null : t.id))}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${cx}%`, top: `${cy}%` }}
            >
              <div
                className={`rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all ${
                  isHover ? 'w-5 h-5' : 'w-3 h-3'
                }`}
              />
              <div
                className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 w-64 max-w-[80vw] rounded-xl bg-background/95 border border-border p-3 shadow-xl z-10 transition-all pointer-events-none ${
                  isHover ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <p className="text-xs font-serif italic text-foreground leading-snug line-clamp-5 text-left">
                  {t.quote}
                </p>
                <div className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 text-left">
                  {t.author_name}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/50">
        Survolez ou touchez une étoile pour révéler la voix d'un marcheur
      </p>
    </div>
  );
};

export default Constellation;
