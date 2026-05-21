import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  TROPHIC_LEVELS,
  DECOMPOSER_META,
  getLevelMeta,
  type TrophicGroup,
} from '@/lib/trophicClassification';
import type { TrophicChainResult, TrophicStar } from '@/hooks/useTrophicChain';
import { DefaultPanel, LevelPanel, SelectedStarPanel, type TrophicSpeciesPoolEntry } from './_panels';
import { useTrophicBeams } from './useTrophicBeams';
import { TrophicBeamOverlay, type Beam } from './TrophicBeamOverlay';
import { TrophicBeamEdges } from './TrophicBeamEdges';
import { ZoomableSvgStage } from './ZoomableSvgStage';

interface Props {
  chain: TrophicChainResult;
  speciesPool?: TrophicSpeciesPoolEntry[];
  explorationId?: string;
  /** When set, mute every star except this one and add a pulsing halo. */
  highlightScientificName?: string;
  /** Compact mode: only render the SVG (no side panel, no overlays). */
  compact?: boolean;
  /** Optional callback fired when a star is clicked. Receives the star or null when deselected. */
  onSpeciesSelect?: (star: TrophicStar | null) => void;
}

const SIZE = 720;
const CENTER = SIZE / 2;
const RADII: Record<TrophicGroup, number> = {
  L1: 70,
  L2: 130,
  L3: 195,
  L4: 260,
  L5: 320,
  DECOMPOSER: 220,
  UNCLASSIFIED: 0,
};

const MAX_STARS_PER_LEVEL = 36;

interface PositionedStar extends TrophicStar {
  x: number;
  y: number;
  r: number;
}

function layoutLevel(stars: TrophicStar[], group: TrophicGroup, decomposerTilt = false): PositionedStar[] {
  const radius = RADII[group];
  const display = stars.slice(0, MAX_STARS_PER_LEVEL);
  const n = display.length;
  if (n === 0) return [];
  const maxA = Math.max(...display.map((s) => s.abundance));
  const tilt = decomposerTilt ? Math.PI / 12 : 0;
  return display.map((s, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2 + tilt;
    const x = CENTER + Math.cos(angle) * radius;
    const y = CENTER + Math.sin(angle) * radius * (decomposerTilt ? 0.92 : 1);
    const r = 4 + Math.log2(1 + (s.abundance / maxA) * 16) * 1.6;
    return { ...s, x, y, r };
  });
}

export const ConstellationTab: React.FC<Props> = ({ chain, speciesPool, explorationId, highlightScientificName, compact, onSpeciesSelect }) => {
  const [hovered, setHovered] = useState<PositionedStar | null>(null);
  const [selected, setSelectedState] = useState<PositionedStar | null>(null);
  const setSelected = (s: PositionedStar | null) => {
    setSelectedState(s);
    onSpeciesSelect?.(s);
  };
  const [focusGroup, setFocusGroup] = useState<TrophicGroup | null>(null);
  const [activeBeam, setActiveBeam] = useState<Beam>(null);

  const positioned = useMemo(() => {
    const map: Record<TrophicGroup, PositionedStar[]> = {
      L1: layoutLevel(chain.byGroup.L1, 'L1'),
      L2: layoutLevel(chain.byGroup.L2, 'L2'),
      L3: layoutLevel(chain.byGroup.L3, 'L3'),
      L4: layoutLevel(chain.byGroup.L4, 'L4'),
      L5: layoutLevel(chain.byGroup.L5, 'L5'),
      DECOMPOSER: layoutLevel(chain.byGroup.DECOMPOSER, 'DECOMPOSER', true),
      UNCLASSIFIED: [],
    };
    return map;
  }, [chain]);

  const allStars = useMemo(
    () => [...positioned.L1, ...positioned.L2, ...positioned.L3, ...positioned.L4, ...positioned.L5, ...positioned.DECOMPOSER],
    [positioned],
  );

  // Ghost target = top of the ring (angle -π/2) for empty levels
  const ghostTargetFor = useCallback(
    (g: TrophicGroup) => ({ x: CENTER, y: CENTER - RADII[g] }),
    [],
  );
  const decomposerGhost = useMemo(
    () => ({ x: CENTER + RADII.DECOMPOSER, y: CENTER }),
    [],
  );

  const { preyEdges, predatorEdges, recyclerEdges, beamCounts, connectedNames } = useTrophicBeams(
    selected,
    positioned,
    ghostTargetFor,
    decomposerGhost,
  );

  const isStarMuted = (s: PositionedStar) => {
    if (highlightScientificName) return s.scientificName !== highlightScientificName;
    if (focusGroup) return s.group !== focusGroup;
    if (selected) return !connectedNames.has(s.scientificName);
    return false;
  };


  if (compact) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--trophic-bg)) 0%, hsl(var(--trophic-bg-edge)) 100%)',
        }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto block">
          {TROPHIC_LEVELS.map((l) => (
            <circle
              key={l.group}
              cx={CENTER}
              cy={CENTER}
              r={RADII[l.group]}
              fill="none"
              stroke={`hsl(var(${l.token}) / 0.18)`}
              strokeWidth={chain.counts[l.group] === 0 ? 0.5 : 1}
              strokeDasharray={chain.counts[l.group] === 0 ? '4 6' : undefined}
            />
          ))}
          <ellipse
            cx={CENTER}
            cy={CENTER}
            rx={RADII.DECOMPOSER}
            ry={RADII.DECOMPOSER * 0.92}
            fill="none"
            stroke={`hsl(var(${DECOMPOSER_META.token}) / 0.25)`}
            strokeDasharray="2 4"
            transform={`rotate(15 ${CENTER} ${CENTER})`}
          />

          <TrophicBeamEdges
            show={!!selected}
            activeBeam={activeBeam}
            preyEdges={preyEdges}
            predatorEdges={predatorEdges}
            recyclerEdges={recyclerEdges}
            curved={false}
          />


          {allStars.map((s, i) => {
            const meta = getLevelMeta(s.group);
            if (!meta) return null;
            const muted = isStarMuted(s);
            const isSelected = selected?.scientificName === s.scientificName;
            const isHighlighted = highlightScientificName === s.scientificName;
            return (
              <motion.g
                key={`${s.scientificName}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: muted ? 0.12 : 1, scale: 1 }}
                transition={{ delay: i * 0.004, duration: 0.4 }}
                onClick={() => setSelected(isSelected ? null : s)}
                style={{ cursor: 'pointer' }}
              >
                {(isHighlighted || isSelected) && (
                  <>
                    <motion.circle
                      cx={s.x} cy={s.y}
                      r={s.r * 5}
                      fill={`hsl(var(${meta.token}) / 0.18)`}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <circle cx={s.x} cy={s.y} r={s.r * 3.2} fill={`hsl(var(${meta.token}) / 0.4)`} />
                  </>
                )}
                <circle cx={s.x} cy={s.y} r={s.r * (isHighlighted || isSelected ? 3 : 2)} fill={`hsl(var(${meta.token}) / ${isHighlighted || isSelected ? 0.4 : 0.18})`} />
                <circle cx={s.x} cy={s.y} r={isHighlighted || isSelected ? s.r * 1.6 : s.r} fill={`hsl(var(${meta.token}))`} stroke={isHighlighted || isSelected ? `hsl(var(${meta.token}))` : 'transparent'} strokeWidth={isHighlighted || isSelected ? 1.4 : 0} />
              </motion.g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
      {/* Constellation SVG */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--trophic-bg)) 0%, hsl(var(--trophic-bg-edge)) 100%)',
        }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto block">
          {/* concentric rings */}
          {TROPHIC_LEVELS.map((l) => (
            <circle
              key={l.group}
              cx={CENTER}
              cy={CENTER}
              r={RADII[l.group]}
              fill="none"
              stroke={`hsl(var(${l.token}) / 0.18)`}
              strokeWidth={chain.counts[l.group] === 0 ? 0.5 : 1}
              strokeDasharray={chain.counts[l.group] === 0 ? '4 6' : undefined}
              onClick={() => setFocusGroup(focusGroup === l.group ? null : l.group)}
              className="cursor-pointer"
            />
          ))}

          {/* decomposer orbit (tilted ellipse) */}
          <ellipse
            cx={CENTER}
            cy={CENTER}
            rx={RADII.DECOMPOSER}
            ry={RADII.DECOMPOSER * 0.92}
            fill="none"
            stroke={`hsl(var(${DECOMPOSER_META.token}) / 0.25)`}
            strokeDasharray="2 4"
            transform={`rotate(15 ${CENTER} ${CENTER})`}
          />

          {/* level labels (right axis) */}
          {TROPHIC_LEVELS.map((l) => (
            <text
              key={`lbl-${l.group}`}
              x={CENTER + RADII[l.group] + 6}
              y={CENTER + 4}
              fontSize={10}
              fill={`hsl(var(${l.token}))`}
              opacity={0.7}
              fontFamily="Inter, sans-serif"
            >
              {l.shortLabel}
            </text>
          ))}

          <TrophicBeamEdges
            show={!!selected}
            activeBeam={activeBeam}
            preyEdges={preyEdges}
            predatorEdges={predatorEdges}
            recyclerEdges={recyclerEdges}
            curved={false}
          />


          {/* stars */}
          {allStars.map((s, i) => {
            const meta = getLevelMeta(s.group);
            if (!meta) return null;
            const muted = isStarMuted(s);
            const isSelected = selected?.scientificName === s.scientificName;
            const isHighlighted = highlightScientificName === s.scientificName;
            return (
              <motion.g
                key={`${s.scientificName}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: muted ? 0.12 : 1, scale: 1 }}
                transition={{ delay: i * 0.005, duration: 0.4 }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(isSelected ? null : s)}
                style={{ cursor: 'pointer' }}
              >
                {/* spotlight pulse for the highlighted species */}
                {(isHighlighted || isSelected) && (
                  <>
                    <motion.circle
                      cx={s.x} cy={s.y}
                      r={s.r * 5}
                      fill={`hsl(var(${meta.token}) / 0.18)`}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <circle cx={s.x} cy={s.y} r={s.r * 3.2} fill={`hsl(var(${meta.token}) / 0.35)`} />
                  </>
                )}
                {/* halo */}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={s.r * (isSelected || isHighlighted ? 3 : 2)}
                  fill={`hsl(var(${meta.token}) / ${isSelected || isHighlighted ? 0.4 : 0.18})`}
                />
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isHighlighted ? s.r * 1.6 : s.r}
                  fill={`hsl(var(${meta.token}))`}
                  stroke={s.source === 'kb' || isHighlighted ? `hsl(var(${meta.token}))` : 'transparent'}
                  strokeWidth={isHighlighted ? 1.4 : s.source === 'kb' ? 0.8 : 0}
                />
                {/* hollow ring for heuristic */}
                {s.source === 'heuristic' && !isHighlighted && (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.r + 1.2}
                    fill="none"
                    stroke={`hsl(var(${meta.token}) / 0.55)`}
                    strokeWidth={0.6}
                  />
                )}
              </motion.g>
            );
          })}

          {/* hover tooltip */}
          {hovered && (() => {
            const meta = getLevelMeta(hovered.group);
            if (!meta) return null;
            const tx = Math.min(hovered.x + 12, SIZE - 180);
            const ty = Math.max(hovered.y - 30, 10);
            return (
              <g pointerEvents="none">
                <rect x={tx} y={ty} width={170} height={44} rx={6}
                  fill="hsl(var(--popover))" stroke="hsl(var(--border))" />
                <text x={tx + 8} y={ty + 16} fontSize={11} fill="hsl(var(--popover-foreground))" fontFamily="Inter">
                  {hovered.commonName || hovered.scientificName}
                </text>
                <text x={tx + 8} y={ty + 32} fontSize={9} fill={`hsl(var(${meta.token}))`} fontFamily="Inter">
                  {meta.shortLabel} · {meta.label}
                </text>
              </g>
            );
          })()}
        </svg>

        {selected && (
          <TrophicBeamOverlay
            selected={selected}
            counts={beamCounts}
            activeBeam={activeBeam}
            onToggleBeam={(b) => setActiveBeam(activeBeam === b ? null : b)}
          />
        )}

        {!selected && chain.balance.missingLevels.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {chain.balance.missingLevels.map((g) => {
              const m = getLevelMeta(g);
              if (!m) return null;
              return (
                <div key={g}
                  className="text-[10px] px-2 py-1 rounded-full bg-background/80 backdrop-blur border border-border text-muted-foreground"
                  title={`Aucune espèce détectée à ce niveau`}>
                  ⚠ {m.shortLabel} {m.label} absent
                </div>
              );
            })}
          </div>
        )}

        {(selected || focusGroup) && (
          <button
            onClick={() => { setSelected(null); setFocusGroup(null); setActiveBeam(null); }}
            className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-background"
          >
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}

      </div>

      {/* Side panel — pédagogique */}
      <aside className="rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[720px] overflow-y-auto">
        {selected ? (
          <SelectedStarPanel star={selected} chain={chain} onLevelClick={setFocusGroup} onClose={() => { setSelected(null); setFocusGroup(null); }} speciesPool={speciesPool} explorationId={explorationId} />
        ) : focusGroup ? (
          <LevelPanel group={focusGroup} chain={chain} onClose={() => setFocusGroup(null)} speciesPool={speciesPool} explorationId={explorationId} />
        ) : (
          <DefaultPanel chain={chain} onLevelClick={setFocusGroup} />
        )}
      </aside>
    </div>
  );
};

export default ConstellationTab;
