import React from 'react';
import { motion } from 'framer-motion';
import { Waves, Sparkles } from 'lucide-react';
import RadialGauge from './RadialGauge';
import IndexLegend from './IndexLegend';
import type { BiodiversityIndices, SpeciesAbundance } from '@/utils/biodiversityIndices';
import { interpretShannon } from '@/utils/biodiversityIndices';

interface Props {
  indices: BiodiversityIndices;
  abundance: SpeciesAbundance[];
}

export const ShannonTab: React.FC<Props> = ({ indices }) => {
  const interp = interpretShannon(indices.H, indices.S);
  const scaleMax = Math.max(indices.Hmax, 3.5);
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <RadialGauge
          value={indices.H}
          max={scaleMax}
          decimals={2}
          label="H' (Shannon)"
          toneClass={interp.toneClass}
          benchmarks={[
            { value: 1, label: 'Faible' },
            { value: 2.5, label: 'Élevée' },
          ]}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-5 text-center space-y-2"
      >
        <p className={`text-sm font-semibold inline-flex items-center gap-2 ${interp.toneClass}`}>
          <Waves className="w-4 h-4" /> {interp.headline}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {interp.story}
        </p>
        <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
          <Sparkles className="w-3 h-3" />
          ≈ {indices.effectiveSpecies.toFixed(1)} espèces équivalentes parfaitement équilibrées
        </div>
      </motion.div>

      <IndexLegend
        formula="H' = − Σ pᵢ · ln(pᵢ)"
        description={
          <p>
            Combine richesse (le nombre d'espèces) et abondance (leur répartition). Très sensible
            aux espèces rares : leur disparition fait chuter l'indice. Plus <strong>H'</strong> est
            grand, plus le milieu est hétérogène.
          </p>
        }
        whyItMatters={
          <p>
            Un capteur bioacoustique qui enregistre 100 strophes d'un seul oiseau n'a pas la même
            valeur écologique que 100 chants répartis sur 20 espèces. Shannon filtre le « bruit »
            d'une espèce omniprésente pour révéler la véritable empreinte du vivant.
          </p>
        }
      />
    </div>
  );
};

export default ShannonTab;
