import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GitBranch, Network, Maximize2 } from 'lucide-react';
import { useTrophicChain, type TrophicSpeciesInput } from '@/hooks/useTrophicChain';
import { getLevelMeta } from '@/lib/trophicClassification';
import { ConstellationTab } from '@/components/community/synthese/trophic/ConstellationTab';
import { SpiraleTab } from '@/components/community/synthese/trophic/SpiraleTab';
import { ReseauTab } from '@/components/community/synthese/trophic/ReseauTab';
import { useTrophicFullscreen } from './trophic-fullscreen/TrophicFullscreenProvider';
import { TrophicSourceBadge } from '@/components/biodiversity/trophic/TrophicSourceBadge';

interface Props {
  scientificName: string;
  commonName?: string | null;
  speciesPool: TrophicSpeciesInput[];
}

type ViewKey = 'constellation' | 'spirale' | 'reseau';

const VIEWS: Array<{ key: ViewKey; label: string; icon: typeof Sparkles; hint: string }> = [
  { key: 'constellation', label: 'Constellation', icon: Sparkles, hint: 'Orbites par niveau' },
  { key: 'spirale', label: 'Spirale', icon: GitBranch, hint: 'Flux d’énergie' },
  { key: 'reseau', label: 'Réseau', icon: Network, hint: 'Liens prédateur → proie' },
];

export const SpeciesTrophicPosition: React.FC<Props> = ({ scientificName, commonName, speciesPool }) => {
  const chain = useTrophicChain(speciesPool);
  const star = useMemo(
    () => chain.stars.find((s) => s.scientificName === scientificName),
    [chain.stars, scientificName],
  );
  const [view, setView] = useState<ViewKey>('constellation');
  const { open: openTrophicFullscreen } = useTrophicFullscreen();

  if (!star) return null;
  const meta = getLevelMeta(star.group);
  if (!meta) return null;

  const expand = () =>
    openTrophicFullscreen({ scientificName, commonName, speciesPool, initialView: view });

  const renderView = (key: ViewKey, compact: boolean) => {
    const common = {
      chain,
      speciesPool: speciesPool as any,
      highlightScientificName: scientificName,
      compact,
    };
    if (key === 'constellation') return <ConstellationTab {...common} />;
    if (key === 'spirale') return <SpiraleTab {...common} />;
    return <ReseauTab {...common} />;
  };

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3"
      data-chat-card
      data-chat-title={`Place trophique — ${commonName || scientificName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-white/40">Sa place dans la chaîne</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border"
              style={{
                background: `hsl(var(${meta.token}) / 0.18)`,
                color: `hsl(var(${meta.token}))`,
                borderColor: `hsl(var(${meta.token}) / 0.4)`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(var(${meta.token}))` }} />
              {meta.shortLabel} · {meta.label}
            </span>
            <TrophicSourceBadge source={star.source} variant="full" />
          </div>
        </div>
      </div>

      {/* View switcher chips */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          const active = view === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white/90'
              }`}
              aria-pressed={active}
            >
              <Icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Mini stage — click background or pill to expand. NOT a <button> to avoid nesting inner buttons. */}
      <div className="group relative overflow-hidden rounded-xl border border-white/10">
        {/* Content layer (interactive controls inside stay clickable) */}
        <div className="relative z-[1] max-h-[280px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderView(view, true)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Background click-to-expand layer (sits behind content but catches empty-space taps) */}
        <button
          type="button"
          onClick={expand}
          aria-label="Agrandir la vue trophique"
          className="absolute inset-0 z-0 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-emerald-400/60 rounded-xl"
        />

        {/* Gradient + hint (decorative) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent z-[2]" />
        <div className="pointer-events-none absolute bottom-2 left-2 text-[10px] text-white/70 z-[2]">
          {VIEWS.find((v) => v.key === view)?.hint}
        </div>

        {/* Real "Agrandir" pill button */}
        <button
          type="button"
          onClick={expand}
          aria-label="Ouvrir la vue trophique en grand"
          className="absolute bottom-2 right-2 z-[3] inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
        >
          <Maximize2 className="w-3 h-3" />
          Agrandir
        </button>
      </div>
    </div>
  );
};

export default SpeciesTrophicPosition;
