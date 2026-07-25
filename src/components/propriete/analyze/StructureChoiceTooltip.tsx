import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Thermometer, Hand, Sprout, Wind, Waves, Blocks, Grip } from 'lucide-react';
import { IconCompacte, IconGrumeleuse, IconParticulaire } from './SoilPictos';

type Variant = 'compacte' | 'grumeleuse' | 'particulaire';

type Bullet = { icon: React.ReactNode; text: string };

const DATA: Record<Variant, { title: string; verb: string; icon: React.ReactNode; bullets: Bullet[] }> = {
  compacte: {
    title: 'Compacte',
    verb: 'Résiste · bloc unique',
    icon: <IconCompacte />,
    bullets: [
      { icon: <Blocks className="w-3.5 h-3.5" />, text: "Motte difficile à diviser, rupture brusque — effet de lourdeur (ocre)." },
      { icon: <Droplets className="w-3.5 h-3.5" />, text: "L’eau s’infiltre mal." },
      { icon: <Thermometer className="w-3.5 h-3.5" />, text: "Dur et sec l’été / élastique et gorgé d’eau l’hiver. Lent à se réchauffer." },
    ],
  },
  grumeleuse: {
    title: 'Grumeleuse',
    verb: 'S’émiette · respire',
    icon: <IconGrumeleuse />,
    bullets: [
      { icon: <Sprout className="w-3.5 h-3.5" />, text: "Agrégats visibles : motte qui se divise facilement et tient." },
      { icon: <Wind className="w-3.5 h-3.5" />, text: "Bulles au test de stabilité = air. Galeries de lombrics, racines, micro-faune." },
      { icon: <Droplets className="w-3.5 h-3.5" />, text: "Bonne infiltration de l’eau." },
    ],
  },
  particulaire: {
    title: 'Particulaire',
    verb: 'Se disperse · sable',
    icon: <IconParticulaire />,
    bullets: [
      { icon: <Grip className="w-3.5 h-3.5" />, text: "La motte ne tient pas, s’effondre avant la main ou le bocal." },
      { icon: <Waves className="w-3.5 h-3.5" />, text: "L’eau s’infiltre (trop) vite." },
      { icon: <Thermometer className="w-3.5 h-3.5" />, text: "Se réchauffe vite. Pauvre : les nutriments ne restent pas." },
    ],
  },
};

export const StructureChoiceTooltip: React.FC<{
  variant: Variant | null;
  id?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ variant, id, align = 'center' }) => {
  const posClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';
  const arrowClass =
    align === 'left'
      ? 'left-6'
      : align === 'right'
      ? 'right-6'
      : 'left-1/2 -translate-x-1/2';
  return (
    <AnimatePresence>
      {variant && (
        <motion.div
          key={variant}
          role="tooltip"
          id={id}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none absolute ${posClass} bottom-full mb-3 z-40 w-[280px] max-w-[calc(100vw-2rem)]`}
        >
          <div className="relative rounded-2xl border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-cream))] shadow-[0_12px_32px_-8px_rgba(47,93,58,0.28),0_2px_8px_rgba(212,163,63,0.18)] overflow-hidden">
            {/* Ruban doré haut */}
            <div className="h-1 w-full bg-gradient-to-r from-[hsl(var(--ds-gold))]/0 via-[hsl(var(--ds-gold))] to-[hsl(var(--ds-gold))]/0" />

            <div className="p-3.5">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className="shrink-0 [&_svg]:w-8 [&_svg]:h-8">{DATA[variant].icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[hsl(var(--ds-forest-deep))] leading-tight">
                    {DATA[variant].title}
                  </div>
                  <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))] mt-0.5">
                    {DATA[variant].verb}
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div className="h-px w-full bg-[hsl(var(--ds-forest))]/15 mb-2.5" />

              {/* Bullets */}
              <ul className="space-y-1.5">
                {DATA[variant].bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85"
                  >
                    <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--ds-forest))]/10 text-[hsl(var(--ds-forest))]">
                      {b.icon}
                    </span>
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Flèche */}
            <svg
              className={`absolute ${arrowClass} -bottom-[7px]`}
              width="14"
              height="8"
              viewBox="0 0 14 8"
              aria-hidden
            >
              <path
                d="M0 0 L7 8 L14 0 Z"
                fill="hsl(var(--ds-cream))"
                stroke="hsl(var(--ds-forest) / 0.4)"
                strokeWidth="1"
              />
              <path d="M1 0 L13 0" stroke="hsl(var(--ds-cream))" strokeWidth="1.5" />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
