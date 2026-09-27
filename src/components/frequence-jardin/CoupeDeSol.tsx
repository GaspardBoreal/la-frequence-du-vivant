import React, { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { FAMILLES, METHODES_24 } from '@/content/frequenceJardin/methodes24';

const MAX = 80;
const TOP = 16;
const H = 400; // 0–80 cm → 5 px/cm
const y = (cm: number) => TOP + (cm / MAX) * H;

const PROFONDES = METHODES_24.filter((m) => m.profondeurCm).sort(
  (a, b) => a.profondeurCm![1] - b.profondeurCm![1] || a.profondeurCm![0] - b.profondeurCm![0],
);
const label = (p: [number, number]) =>
  p[0] === p[1] ? (p[0] === 0 ? 'surface' : `${p[0]} cm`) : `${p[0]}–${p[1]} cm`;

/** Coupe de sol : une sonde descend au défilement et allume les méthodes à leur profondeur. */
const CoupeDeSol: React.FC = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const depth = useTransform(scrollYProgress, [0, 1], [0, MAX + 2]);
  const probeY = useTransform(depth, (d) => y(Math.min(d, MAX)));
  const [d, setD] = useState(0);
  useMotionValueEvent(depth, 'change', (v) => setD(v));
  const cur = reduce ? MAX + 2 : d;

  return (
    <>
      {/* Desktop */}
      <div ref={ref} className="relative hidden md:block md:h-[150vh]">
        <div className="sticky top-20 grid grid-cols-[260px_1fr] items-start gap-10">
          <svg viewBox="0 0 260 432" className="h-auto w-full" role="img" aria-label="Coupe de sol de 0 à 80 cm">
            <defs>
              <linearGradient id="cs-humus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="hsl(24 30% 22%)" />
                <stop offset="1" stopColor="hsl(26 28% 32%)" />
              </linearGradient>
              <linearGradient id="cs-min" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="hsl(32 34% 48%)" />
                <stop offset="1" stopColor="hsl(36 30% 60%)" />
              </linearGradient>
            </defs>
            {/* Litière */}
            <rect x="10" y={TOP - 8} width="190" height="10" rx="3" fill="hsl(var(--ds-forest-soft))" />
            {/* Horizons */}
            <rect x="10" y={y(0)} width="190" height={y(28) - y(0)} fill="url(#cs-humus)" />
            <rect x="10" y={y(28)} width="190" height={y(MAX) - y(28)} fill="url(#cs-min)" />
            {/* Taches rouille */}
            {[
              [40, 58],
              [120, 64],
              [80, 72],
              [165, 60],
              [55, 76],
            ].map(([cx, cm], i) => (
              <ellipse key={i} cx={cx} cy={y(cm)} rx="7" ry="4" fill="hsl(18 62% 42%)" opacity="0.7" />
            ))}
            {/* Marques des méthodes */}
            {PROFONDES.map((m, i) => {
              const [a, b] = m.profondeurCm!;
              const on = cur >= b;
              const x = 22 + i * 22;
              return (
                <rect
                  key={m.id}
                  x={x}
                  y={y(a) - (a === b ? 3 : 0)}
                  width="8"
                  height={Math.max(6, y(b) - y(a))}
                  rx="4"
                  fill={FAMILLES[m.famille].couleur}
                  stroke="hsl(var(--ds-cream))"
                  strokeWidth="1.5"
                  opacity={on ? 1 : 0.15}
                  style={{ transition: 'opacity 300ms' }}
                />
              );
            })}
            {/* Graduation */}
            {Array.from({ length: 9 }, (_, i) => i * 10).map((cm) => (
              <g key={cm}>
                <line x1="204" x2="214" y1={y(cm)} y2={y(cm)} stroke="hsl(var(--ds-ink-soft))" />
                <text x="218" y={y(cm) + 4} fontSize="11" fill="hsl(var(--ds-ink-soft))">
                  {cm} cm
                </text>
              </g>
            ))}
            {/* Sonde */}
            <motion.g style={{ y: reduce ? y(MAX) - TOP : useTransform(probeY, (v) => v - TOP) }}>
              <line x1="0" x2="210" y1={TOP} y2={TOP} stroke="hsl(var(--ds-gold))" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="205" cy={TOP} r="5" fill="hsl(var(--ds-gold))" />
            </motion.g>
          </svg>

          <ol className="space-y-3 pt-2">
            {PROFONDES.map((m) => {
              const on = cur >= m.profondeurCm![1];
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border px-4 py-2.5 transition duration-300"
                  style={{
                    opacity: on ? 1 : 0.3,
                    borderColor: on ? FAMILLES[m.famille].couleur : 'hsl(var(--ds-line))',
                    background: on ? 'rgba(255,255,255,0.7)' : 'transparent',
                  }}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: FAMILLES[m.famille].couleur }} aria-hidden />
                  <span className="font-serif text-[17px] text-[hsl(var(--ds-forest-deep))]">{m.nom}</span>
                  <span className="ml-auto text-[13px] text-[hsl(var(--ds-ink-soft))]">{label(m.profondeurCm!)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Mobile : règle horizontale */}
      <div className="md:hidden">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-[hsl(24_30%_24%)] via-[hsl(28_30%_36%)] to-[hsl(36_30%_58%)]" aria-hidden />
        <div className="mt-1 flex justify-between text-[11px] text-[hsl(var(--ds-ink-soft))]" aria-hidden>
          <span>0</span>
          <span>40 cm</span>
          <span>80 cm</span>
        </div>
        <ol className="mt-4 space-y-2">
          {PROFONDES.map((m, i) => (
            <motion.li
              key={m.id}
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className="flex items-center gap-3 rounded-xl border border-[hsl(var(--ds-line))] bg-white/70 px-3 py-2"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: FAMILLES[m.famille].couleur }} aria-hidden />
              <span className="text-[14px] text-[hsl(var(--ds-forest-deep))]">{m.nom}</span>
              <span className="ml-auto text-[12px] text-[hsl(var(--ds-ink-soft))]">{label(m.profondeurCm!)}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </>
  );
};

export default CoupeDeSol;
