import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Crown, Waves, Scale, Sliders, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  computeAbundance,
  computeIndices,
  type CountMode,
  type RawSpecies,
} from '@/utils/biodiversityIndices';

import RichnessTab from './indices/RichnessTab';
import SimpsonTab from './indices/SimpsonTab';
import ShannonTab from './indices/ShannonTab';
import PielouTab from './indices/PielouTab';
import BiodiversitySimulator from './indices/BiodiversitySimulator';

interface Props {
  species: RawSpecies[];
  explorationId?: string;
}

type TabKey = 'richness' | 'simpson' | 'shannon' | 'pielou' | 'simulator';

const TABS: Array<{ key: TabKey; label: string; icon: typeof Layers }> = [
  { key: 'richness', label: 'Richesse spécifique', icon: Layers },
  { key: 'simpson', label: 'Simpson', icon: Crown },
  { key: 'shannon', label: 'Shannon', icon: Waves },
  { key: 'pielou', label: 'Piélou', icon: Scale },
  { key: 'simulator', label: 'Simulateur', icon: Sliders },
];

const STORAGE_KEY = 'bio-indices-mode';

export const TaxonsIndicesPanel: React.FC<Props> = ({ species, explorationId }) => {
  const [active, setActive] = useState<TabKey>('richness');
  const [mode, setMode] = useState<CountMode>(() => {
    if (typeof window === 'undefined') return 'individuals';
    return (localStorage.getItem(STORAGE_KEY) as CountMode) || 'individuals';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const abundance = useMemo(() => computeAbundance(species, mode), [species, mode]);
  const observationsAbundance = useMemo(
    () => (mode === 'observations' ? abundance : computeAbundance(species, 'observations')),
    [species, mode, abundance],
  );
  const individualsAbundance = useMemo(
    () => (mode === 'individuals' ? abundance : computeAbundance(species, 'individuals')),
    [species, mode, abundance],
  );

  const indices = useMemo(() => computeIndices(abundance), [abundance]);

  const totalObservations = useMemo(
    () => observationsAbundance.reduce((s, a) => s + a.n, 0),
    [observationsAbundance],
  );
  const totalIndividuals = useMemo(
    () => individualsAbundance.reduce((s, a) => s + a.n, 0),
    [individualsAbundance],
  );

  const kingdomCounts = useMemo(() => {
    const k = { plants: 0, animals: 0, fungi: 0, others: 0 };
    abundance.forEach((sp) => {
      if (sp.kingdom === 'Plantae') k.plants += 1;
      else if (sp.kingdom === 'Animalia') k.animals += 1;
      else if (sp.kingdom === 'Fungi') k.fungi += 1;
      else k.others += 1;
    });
    return k;
  }, [abundance]);

  return (
    <section className="mt-6 rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/20 p-4 sm:p-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Lecture écologique du peuplement
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Indices de diversité — espèces species-level uniquement
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border">
            <Switch
              id="bio-mode"
              checked={mode === 'individuals'}
              onCheckedChange={(v) => setMode(v ? 'individuals' : 'observations')}
            />
            <Label htmlFor="bio-mode" className="text-xs font-medium cursor-pointer">
              {mode === 'individuals' ? 'Individus GPS' : 'Observations brutes'}
            </Label>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                aria-label="À propos du mode de comptage"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="text-xs leading-relaxed max-w-xs">
              <p>
                <strong>Individus GPS</strong> : plusieurs photos d'un même pied (à moins de 8 m)
                sont fusionnées en un seul individu.
              </p>
              <p className="mt-1.5">
                <strong>Observations brutes</strong> : chaque attribution iNaturalist compte pour
                une.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active + mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {active === 'richness' && (
            <RichnessTab
              indices={indices}
              totalObservations={totalObservations}
              totalIndividuals={totalIndividuals}
              countMode={mode}
              kingdomCounts={kingdomCounts}
            />
          )}
          {active === 'simpson' && <SimpsonTab indices={indices} abundance={abundance} />}
          {active === 'shannon' && <ShannonTab indices={indices} abundance={abundance} />}
          {active === 'pielou' && <PielouTab indices={indices} abundance={abundance} />}
          {active === 'simulator' && <BiodiversitySimulator initialAbundance={abundance} species={species} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default TaxonsIndicesPanel;
