import React from 'react';
import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import RadialGauge from './RadialGauge';
import IndexLegend from './IndexLegend';
import RankAbundanceCurve from './RankAbundanceCurve';
import type { BiodiversityIndices, SpeciesAbundance } from '@/utils/biodiversityIndices';
import { interpretPielou } from '@/utils/biodiversityIndices';

interface Props {
  indices: BiodiversityIndices;
  abundance: SpeciesAbundance[];
}

export const PielouTab: React.FC<Props> = ({ indices, abundance }) => {
  const interp = interpretPielou(indices.J, indices.topSpecies, indices.topShare);
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <RadialGauge
          value={indices.J}
          decimals={2}
          label="J' (Piélou)"
          toneClass={interp.toneClass}
          benchmarks={[
            { value: 0.4, label: 'Déséquilibre' },
            { value: 0.85, label: 'Harmonie' },
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
          <Scale className="w-4 h-4" /> {interp.headline}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {interp.story}
        </p>
      </motion.div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-2 font-medium">
          Courbe rang-abondance (Whittaker)
        </p>
        <RankAbundanceCurve abundance={abundance} />
      </div>

      <IndexLegend
        formula="J' = H' / ln(S)    avec    S = nombre d'espèces"
        description={
          <p>
            Dérivé de Shannon, l'indice de Piélou isole la <strong>régularité</strong> de la
            répartition, indépendamment du nombre d'espèces. Compris entre 0 et 1 :
            proche de 1 = harmonie parfaite, proche de 0 = sur-représentation d'une espèce.
          </p>
        }
        whyItMatters={
          <p>
            C'est le meilleur thermomètre de l'équitabilité écologique. Une chute du J' alerte
            sur un déséquilibre territorial avant même que la richesse spécifique ne s'effondre.
          </p>
        }
      />
    </div>
  );
};

export default PielouTab;
