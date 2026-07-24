import React from 'react';
import { motion } from 'framer-motion';
import { AnalyzeCard } from '../AnalyzeCard';
import { SoilHeroStrata } from '../SoilPictos';

const MIN = 4;
const MAX = 9;
const STEP = 0.1;

const HUES = [
  { at: 4, color: '#c94a3a', label: 'Très acide' },
  { at: 5.5, color: '#d97a2b', label: 'Acide' },
  { at: 6.5, color: '#e4b64a', label: 'Faiblement acide' },
  { at: 7, color: '#6b9a3b', label: 'Neutre' },
  { at: 7.8, color: '#3e8074', label: 'Basique' },
  { at: 9, color: '#2f5d7a', label: 'Très basique' },
];

function labelFor(ph: number): { color: string; label: string } {
  let best = HUES[0];
  let bestDelta = Infinity;
  for (const h of HUES) {
    const d = Math.abs(h.at - ph);
    if (d < bestDelta) {
      best = h;
      bestDelta = d;
    }
  }
  return { color: best.color, label: best.label };
}

export const PhBlock: React.FC<{
  value?: number | null;
  onChange: (v: number) => void;
  index?: number;
}> = ({ value, onChange, index = 0 }) => {
  const ph = value ?? 7;
  const { color, label } = labelFor(ph);
  const pct = ((ph - MIN) / (MAX - MIN)) * 100;

  return (
    <AnalyzeCard
      number={5}
      category="Étape 2 · Acidité"
      title="pH du sol"
      subtitle="Bandelette ou pHmètre : notez la valeur observée entre 4 et 9."
      index={index}
      hero={
        <div className="aspect-[16/7]">
          <SoilHeroStrata variant="ph" />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl text-[hsl(var(--ds-forest-deep))]" style={{ color }}>
              {ph.toFixed(1)}
            </span>
            <span className="text-xs uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]/60">pH</span>
          </div>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {label}
          </motion.span>
        </div>

        <div className="relative h-3 rounded-full overflow-hidden border border-[hsl(var(--ds-line))]"
             style={{
               background:
                 'linear-gradient(90deg,#c94a3a 0%,#d97a2b 30%,#e4b64a 55%,#6b9a3b 65%,#3e8074 80%,#2f5d7a 100%)',
             }}
        >
          <motion.div
            layout
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
            style={{ left: `calc(${pct}% - 8px)`, backgroundColor: color }}
          />
        </div>

        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={ph}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-[hsl(var(--ds-forest))] cursor-pointer"
          aria-label="Valeur du pH"
        />

        <div className="flex justify-between text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]/50">
          <span>4 · très acide</span>
          <span>7 · neutre</span>
          <span>9 · très basique</span>
        </div>
      </div>
    </AnalyzeCard>
  );
};
