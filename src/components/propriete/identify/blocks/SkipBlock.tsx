import React from 'react';
import { motion } from 'framer-motion';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { LeafHerbacee } from '../FloraPictos';

export const SkipBlock: React.FC<{
  skip: boolean;
  onToggle: (v: boolean) => void;
  index?: number;
}> = ({ skip, onToggle, index = 0 }) => {
  return (
    <AnalyzeCard
      number={0}
      category="Porte d'entrée"
      title="Souhaitez-vous pratiquer la bio-indication ?"
      subtitle="Étape optionnelle mais très éclairante : reconnaître 5 à 15 plantes suffit à révéler l'âme du lieu."
      index={index}
    >
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onToggle(false)}
          className={`rounded-2xl border p-4 text-left transition-all ${
            !skip
              ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8 shadow-[inset_0_2px_10px_rgba(47,93,58,0.10)]'
              : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 hover:border-[hsl(var(--ds-forest))]/50'
          }`}
        >
          <LeafHerbacee active={!skip} size={44} />
          <div className="mt-2 text-[13px] font-semibold text-[hsl(var(--ds-forest-deep))]">
            Oui, j'observe la flore
          </div>
          <div className="text-[11px] italic text-[hsl(var(--ds-forest-deep))]/65 mt-0.5">
            Recommandé — révèle des indices que le sol seul ne dit pas.
          </div>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onToggle(true)}
          className={`rounded-2xl border p-4 text-left transition-all ${
            skip
              ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8 shadow-[inset_0_2px_10px_rgba(47,93,58,0.10)]'
              : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 hover:border-[hsl(var(--ds-forest))]/50'
          }`}
        >
          <div className="w-11 h-11 rounded-full border-2 border-dashed border-[hsl(var(--ds-forest))]/40 flex items-center justify-center text-[hsl(var(--ds-forest))]/60 italic font-serif">
            ?
          </div>
          <div className="mt-2 text-[13px] font-semibold text-[hsl(var(--ds-forest-deep))]">
            Passer pour cette fois
          </div>
          <div className="text-[11px] italic text-[hsl(var(--ds-forest-deep))]/65 mt-0.5">
            Vous pourrez revenir à cette étape à tout moment.
          </div>
        </motion.button>
      </div>
    </AnalyzeCard>
  );
};
