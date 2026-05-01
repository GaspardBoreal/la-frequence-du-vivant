import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Hand, Heart, Ear, Utensils, Sparkles } from 'lucide-react';
import { useIsCurator } from '@/hooks/useExplorationCurations';
import OeilCuration from './OeilCuration';
import MainCuration from './MainCuration';
import OreilleCuration from './OreilleCuration';
import PalaisCuration from './PalaisCuration';
import TextesEcritsSubTab from '@/components/community/exploration/TextesEcritsSubTab';

type SenseKey = 'oeil' | 'main' | 'coeur' | 'oreille' | 'palais';

const SENSES: { key: SenseKey; label: string; icon: typeof Eye; verb: string }[] = [
  { key: 'oeil', label: "L'œil", icon: Eye, verb: 'Voir les espèces remarquables' },
  { key: 'main', label: 'La main', icon: Hand, verb: 'Découvrir les pratiques' },
  { key: 'coeur', label: 'Le cœur', icon: Heart, verb: 'Lire les textes' },
  { key: 'oreille', label: "L'oreille", icon: Ear, verb: 'Écouter les sons' },
  { key: 'palais', label: 'Le palais', icon: Utensils, verb: 'Goûter le territoire' },
];

interface Props {
  explorationId: string;
  marcheEventId?: string;
  onNavigateToMarche?: (marcheId: string) => void;
}

const CeQueNousAvonsVu: React.FC<Props> = ({ explorationId, marcheEventId, onNavigateToMarche }) => {
  const [activeSense, setActiveSense] = useState<SenseKey>('oeil');
  const { data: isCurator } = useIsCurator(explorationId);

  return (
    <div className="space-y-4">
      {/* Sélecteur 5 sens */}
      <div className="grid grid-cols-5 gap-1.5">
        {SENSES.map(s => {
          const Icon = s.icon;
          const isActive = activeSense === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSense(s.key)}
              className={`min-h-16 rounded-xl border px-2 py-2 text-center transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4 mx-auto mb-1" />
              <span className="block text-[10px] font-semibold leading-tight">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Verb (masqué pour L'œil — l'onglet a déjà ses propres en-têtes) */}
      {activeSense !== 'oeil' && (
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground italic">
            {SENSES.find(s => s.key === activeSense)?.verb}
          </p>
        </div>
      )}

      {/* Contenu */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSense}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeSense === 'oeil' && (
            <OeilCuration explorationId={explorationId} isCurator={!!isCurator} />
          )}
          {activeSense === 'main' && (
            <MainCuration explorationId={explorationId} isCurator={!!isCurator} />
          )}
          {activeSense === 'coeur' && (
            <TextesEcritsSubTab
              explorationId={explorationId}
              marcheEventId={marcheEventId}
              onNavigateToMarche={onNavigateToMarche}
            />
          )}
          {activeSense === 'oreille' && (
            <OreilleCuration explorationId={explorationId} isCurator={!!isCurator} />
          )}
          {activeSense === 'palais' && (
            <PalaisCuration explorationId={explorationId} isCurator={!!isCurator} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CeQueNousAvonsVu;
