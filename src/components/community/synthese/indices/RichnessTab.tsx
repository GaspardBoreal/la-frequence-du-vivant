import React from 'react';
import { motion } from 'framer-motion';
import { Layers, TreePine, Bird, Leaf, Bug } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import IndexLegend from './IndexLegend';
import type { BiodiversityIndices } from '@/utils/biodiversityIndices';

interface Props {
  indices: BiodiversityIndices;
  totalObservations: number;
  totalIndividuals: number;
  countMode: 'individuals' | 'observations';
  kingdomCounts: { plants: number; animals: number; fungi: number; others: number };
  /** Total taxons observed across all ranks (e.g. 81). Shown to clarify that S is a sub-measure. */
  totalSpeciesAllRanks?: number;
}

const KingdomBadge: React.FC<{ icon: typeof TreePine; value: number; label: string; color: string }> = ({
  icon: Icon, value, label, color,
}) => {
  const v = useAnimatedCounter(value, 800, 80);
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-card border border-border">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-lg font-bold tabular-nums">{v}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
};

export const RichnessTab: React.FC<Props> = ({
  indices, totalObservations, totalIndividuals, countMode, kingdomCounts, totalSpeciesAllRanks,
}) => {
  const animatedS = useAnimatedCounter(indices.S, 1200, 100);
  const animatedN = useAnimatedCounter(countMode === 'individuals' ? totalIndividuals : totalObservations, 1200, 200);
  const showAllRanksHint = typeof totalSpeciesAllRanks === 'number' && totalSpeciesAllRanks > indices.S;
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/5 via-card to-amber-500/5 p-6 text-center"
      >
        <Layers className="w-7 h-7 mx-auto mb-2 text-emerald-500" />
        <p className="text-5xl font-bold tabular-nums tracking-tight">{animatedS}</p>
        <p className="text-sm text-muted-foreground mt-1">
          espèces species-level distinctes
          {showAllRanksHint && (
            <> {' '}<span className="text-foreground/70">sur <strong className="text-foreground">{totalSpeciesAllRanks}</strong> taxons observés</span></>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Vous avez croisé <strong className="text-foreground">{animatedN}</strong>{' '}
          {countMode === 'individuals' ? 'individus distincts' : 'observations'} sur le territoire.
        </p>
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        <KingdomBadge icon={TreePine} value={kingdomCounts.plants} label="Flore" color="text-green-500" />
        <KingdomBadge icon={Bird} value={kingdomCounts.animals} label="Faune" color="text-sky-500" />
        <KingdomBadge icon={Leaf} value={kingdomCounts.fungi} label="Champ." color="text-amber-500" />
        <KingdomBadge icon={Bug} value={kingdomCounts.others} label="Autres" color="text-purple-500" />
      </div>

      <IndexLegend
        formula="S = nombre total d'espèces species-level distinctes"
        description={
          <p>
            La <strong>richesse spécifique</strong> est le décompte brut des taxons identifiés au
            rang d'espèce. Elle ne dit rien de leur abondance relative — c'est pour ça que les
            autres onglets complètent la lecture.
          </p>
        }
      />
    </div>
  );
};

export default RichnessTab;
