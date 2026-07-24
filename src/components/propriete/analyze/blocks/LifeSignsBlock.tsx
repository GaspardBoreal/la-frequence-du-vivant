import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import {
  IconVer,
  IconTaupiniere,
  IconRacines,
  IconMicrofaune,
  IconMatiereOrganique,
  IconCO2,
  SoilHeroStrata,
} from '../SoilPictos';

const SIGNS = [
  { value: 'vers', label: 'Vers de terre', icon: <IconVer /> },
  { value: 'taupiniere', label: 'Galeries / taupinières', icon: <IconTaupiniere /> },
  { value: 'racines', label: 'Racines actives', icon: <IconRacines /> },
  { value: 'microfaune', label: 'Micro-faune visible', icon: <IconMicrofaune /> },
  { value: 'matiere_organique', label: 'Matière organique', icon: <IconMatiereOrganique /> },
  { value: 'co2', label: 'Test CO₂ (mousse vinaigre)', icon: <IconCO2 /> },
];

export const LifeSignsBlock: React.FC<{
  values: string[];
  onToggle: (v: string) => void;
  index?: number;
}> = ({ values, onToggle, index = 0 }) => (
  <AnalyzeCard
    number={6}
    category="Étape 2 · Vie du sol"
    title="Ce que le sol laisse voir"
    subtitle="Indices visibles de vie biologique — cochez tout ce qui est présent."
    index={index}
    hero={
      <div className="aspect-[16/7]">
        <SoilHeroStrata variant="life" />
      </div>
    }
  >
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {SIGNS.map((s) => {
        const selected = values.includes(s.value);
        return (
          <motion.button
            key={s.value}
            type="button"
            onClick={() => onToggle(s.value)}
            role="checkbox"
            aria-checked={selected}
            whileTap={{ scale: 0.96 }}
            className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all min-h-[100px] ${
              selected
                ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8 shadow-[inset_0_2px_10px_rgba(47,93,58,0.10),0_4px_12px_-4px_rgba(47,93,58,0.25)]'
                : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 hover:border-[hsl(var(--ds-forest))]/50 hover:bg-[hsl(var(--ds-cream))]'
            }`}
          >
            <span className={`transition-transform ${selected ? 'scale-110' : 'group-hover:scale-105'}`}>
              {s.icon}
            </span>
            <span className="text-[11px] font-semibold leading-tight text-[hsl(var(--ds-forest-deep))]">
              {s.label}
            </span>
            <span
              className={`absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                selected
                  ? 'bg-[hsl(var(--ds-forest))] border-[hsl(var(--ds-forest))]'
                  : 'bg-transparent border-[hsl(var(--ds-line))]'
              }`}
            >
              {selected && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
                  <Check className="w-3 h-3 text-[hsl(var(--ds-cream))]" strokeWidth={3} />
                </motion.span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  </AnalyzeCard>
);
