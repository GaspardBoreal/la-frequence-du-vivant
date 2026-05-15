import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Sparkles, GitBranch, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTrophicChain, type TrophicSpeciesInput } from '@/hooks/useTrophicChain';
import { TROPHIC_LEVELS, DECOMPOSER_META } from '@/lib/trophicClassification';
import { ConstellationTab } from './trophic/ConstellationTab';
import { SpiraleTab } from './trophic/SpiraleTab';

interface Props {
  species: TrophicSpeciesInput[];
}

type TabKey = 'constellation' | 'spirale' | 'reseau';

const TABS: Array<{ key: TabKey; label: string; icon: typeof Sparkles; ready: boolean }> = [
  { key: 'constellation', label: 'Constellation', icon: Sparkles, ready: true },
  { key: 'spirale', label: 'Spirale du Vivant', icon: GitBranch, ready: true },
  { key: 'reseau', label: 'Réseau Vivant', icon: Network, ready: false },
];

export const TrophicChainPanel: React.FC<Props> = ({ species }) => {
  const [active, setActive] = useState<TabKey>('constellation');
  const chain = useTrophicChain(species);

  const balanceTone =
    chain.balance.tone === 'solid'
      ? 'text-primary'
      : chain.balance.tone === 'inverted'
      ? 'text-destructive'
      : 'text-muted-foreground';

  return (
    <section className="mt-6 rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/20 p-4 sm:p-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Chaîne trophique
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
            Une lecture poétique du tissu vivant : qui mange qui, qui pollinise, qui recycle.
            Les espèces collectées sont placées en orbite autour de leur niveau écologique.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/40 ${balanceTone}`}>
            {chain.balance.label}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                aria-label="Légende des niveaux trophiques"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-xs leading-relaxed space-y-2">
              <p className="font-semibold text-foreground text-sm">Les 5 niveaux + décomposeurs</p>
              {[...TROPHIC_LEVELS, DECOMPOSER_META].map((l) => (
                <div key={l.group} className="flex items-baseline gap-2">
                  <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: `hsl(var(${l.token}))` }} />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{l.label}</p>
                    <p className="text-muted-foreground text-[11px]">{l.examples}</p>
                  </div>
                </div>
              ))}
              <p className="pt-2 border-t border-border text-[10px] text-muted-foreground">
                ⓘ Étoile pleine = attribution curée · Étoile contour = règle taxonomique
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              disabled={!t.ready}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              } ${!t.ready ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {!t.ready && <span className="text-[9px] uppercase tracking-wider ml-1 opacity-70">Bientôt</span>}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {active === 'constellation' && <ConstellationTab chain={chain} />}
          {active !== 'constellation' && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Cette direction visuelle arrive bientôt.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span>{chain.total} espèce{chain.total > 1 ? 's' : ''} placée{chain.total > 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{Math.round(chain.curatedRatio * 100)}% attribution curée</span>
        {chain.unclassified.length > 0 && (
          <>
            <span>•</span>
            <span>{chain.unclassified.length} non classée{chain.unclassified.length > 1 ? 's' : ''}</span>
          </>
        )}
      </footer>
    </section>
  );
};

export default TrophicChainPanel;
