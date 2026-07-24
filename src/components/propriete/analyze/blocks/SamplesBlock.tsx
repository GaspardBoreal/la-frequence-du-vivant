import React from 'react';
import { motion } from 'framer-motion';
import { Plus, X, MapPin } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { SoilHeroStrata } from '../SoilPictos';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

export const SamplesBlock: React.FC<{
  samples: SoilSample[];
  onUpdate: (id: string, patch: Partial<SoilSample>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  index?: number;
}> = ({ samples, onUpdate, onAdd, onRemove, index = 0 }) => (
  <AnalyzeCard
    number={2}
    category="Étape 2 · Prélèvements"
    title="3 à 5 échantillons représentatifs"
    subtitle="Notez l'emplacement précis de chaque prélèvement (A, B, C…)."
    index={index}
    hero={
      <div className="aspect-[16/7]">
        <SoilHeroStrata variant="sample" />
      </div>
    }
  >
    <div className="space-y-2">
      {samples.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-2.5 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-2.5"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm">
            {s.label}
          </div>
          <MapPin className="w-3.5 h-3.5 text-[hsl(var(--ds-forest))]/60 flex-shrink-0" />
          <input
            value={s.location ?? ''}
            onChange={(e) => onUpdate(s.id, { location: e.target.value })}
            placeholder="Emplacement (ex. sous le tilleul, allée nord, potager…)"
            className="flex-1 bg-transparent border-none outline-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
          />
          {samples.length > 3 && (
            <button
              onClick={() => onRemove(s.id)}
              aria-label="Retirer le prélèvement"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[hsl(var(--ds-forest))]/50 hover:text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      ))}
      {samples.length < 5 && (
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[hsl(var(--ds-forest))]/40 bg-transparent p-2.5 text-xs font-semibold text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/5 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter un prélèvement (max 5)
        </button>
      )}
    </div>
  </AnalyzeCard>
);
