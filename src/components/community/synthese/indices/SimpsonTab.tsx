import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Layers } from 'lucide-react';
import RadialGauge from './RadialGauge';
import IndexLegend from './IndexLegend';
import { SpeciesName } from '@/components/species/SpeciesName';
import type { BiodiversityIndices, SpeciesAbundance } from '@/utils/biodiversityIndices';
import { interpretSimpson } from '@/utils/biodiversityIndices';

interface Props {
  indices: BiodiversityIndices;
  abundance: SpeciesAbundance[];
}

export const SimpsonTab: React.FC<Props> = ({ indices, abundance }) => {
  const interp = interpretSimpson(indices.simpsonDiversity, indices.topSpecies);
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid sm:grid-cols-2 gap-6 place-items-center"
      >
        <RadialGauge
          value={indices.simpsonDiversity}
          decimals={2}
          label="Diversité (1 − D)"
          toneClass={interp.toneClass}
          benchmarks={[
            { value: 0.1, label: 'Monoculture' },
            { value: 0.85, label: 'Forêt mature' },
          ]}
        />
        <RadialGauge
          value={indices.D}
          decimals={2}
          label="Dominance (D)"
          toneClass="text-amber-500"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-5 text-center space-y-2"
      >
        <p className={`text-sm font-semibold inline-flex items-center gap-2 ${interp.toneClass}`}>
          <Crown className="w-4 h-4" /> {interp.headline}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {interp.story}
        </p>
        {indices.topSpecies && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 pt-1">
            <Layers className="w-3.5 h-3.5" /> Taxon dominant :{' '}
            <SpeciesName
              scientificName={indices.topSpecies.scientificName}
              commonName={indices.topSpecies.commonName}
              size="sm"
            />
            <span className="font-mono">— {Math.round(indices.topShare * 100)} %</span>
          </div>
        )}
      </motion.div>

      <IndexLegend
        formula="D = Σ (pᵢ)²    •    Diversité = 1 − D"
        description={
          <p>
            L'indice de Simpson mesure la probabilité que deux individus tirés au hasard
            appartiennent à la même espèce. Plus <strong>D</strong> est proche de 1, plus une
            espèce écrase les autres. On affiche aussi <strong>1 − D</strong> : plus il s'approche
            de 1, plus la diversité est forte.
          </p>
        }
        whyItMatters={
          <p>
            Un système dominé par une seule espèce (monoculture, forêt monospécifique) est
            vulnérable aux pathogènes et aux variations climatiques. L'équitabilité est un
            indicateur direct de résilience.
          </p>
        }
      />
    </div>
  );
};

export default SimpsonTab;
