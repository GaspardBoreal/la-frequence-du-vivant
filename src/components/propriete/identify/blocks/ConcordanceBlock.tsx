import React from 'react';
import { motion } from 'framer-motion';
import { Check, CircleDashed, X, Minus } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { IcgRing } from '../FloraPictos';
import type { ConcordanceReport, AxisMatch } from '@/lib/plantIndicatorKb';

const iconFor = (m: AxisMatch) => {
  if (m === 'oui') return <Check className="w-4 h-4 text-[hsl(var(--ds-forest))]" strokeWidth={3} />;
  if (m === 'partiel') return <CircleDashed className="w-4 h-4 text-[hsl(var(--ds-gold))]" strokeWidth={2.4} />;
  if (m === 'non') return <X className="w-4 h-4 text-[#b95c3a]" strokeWidth={3} />;
  return <Minus className="w-4 h-4 text-[hsl(var(--ds-forest-deep))]/40" />;
};

const labelFor = (m: AxisMatch) =>
  m === 'oui' ? 'Concordance nette'
  : m === 'partiel' ? 'Concordance partielle'
  : m === 'non' ? 'Divergence — à investiguer'
  : 'Donnée sol manquante';

const AXES: Array<{ key: keyof Omit<ConcordanceReport, 'icg'>; label: string }> = [
  { key: 'eau', label: 'Hydrique' },
  { key: 'texture', label: 'Texture' },
  { key: 'nutri', label: 'Nutrition' },
  { key: 'ph', label: 'pH' },
];

export const ConcordanceBlock: React.FC<{
  report: ConcordanceReport;
  soilAvailable: boolean;
  index?: number;
}> = ({ report, soilAvailable, index = 2 }) => {
  return (
    <AnalyzeCard
      number={3}
      category="Concordance sol / flore"
      title="Deux voix, une seule histoire ?"
      subtitle="On confronte ce que dit le sol (Étape 2) à ce que raconte la végétation."
      index={index}
    >
      {!soilAvailable ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--ds-line))] p-4 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/65 text-center">
          Complétez d'abord l'Étape 2 « J'analyse le sol » pour révéler la concordance.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-5">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex-shrink-0"
          >
            <IcgRing value={report.icg} />
          </motion.div>
          <div className="flex-1 w-full space-y-2">
            {AXES.map((a) => {
              const m = report[a.key];
              return (
                <div
                  key={a.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 px-3 py-2"
                >
                  <span className="text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                    {a.label}
                  </span>
                  <span className="flex items-center gap-2 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/75">
                    {labelFor(m)} {iconFor(m)}
                  </span>
                </div>
              );
            })}
            <p className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60 pt-1">
              ICG = Indice de Cohérence Globale entre le sol observé et la flore présente.
            </p>
          </div>
        </div>
      )}
    </AnalyzeCard>
  );
};
