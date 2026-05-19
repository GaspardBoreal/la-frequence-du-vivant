import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  TROPHIC_LEVELS,
  DECOMPOSER_META,
  getLevelMeta,
  probablePreyGroups,
  type TrophicGroup,
} from '@/lib/trophicClassification';
import type { TrophicChainResult, TrophicStar } from '@/hooks/useTrophicChain';
import { DefaultPanel, LevelPanel, SelectedStarPanel, type TrophicSpeciesPoolEntry } from './_panels';

interface Props {
  chain: TrophicChainResult;
  speciesPool?: TrophicSpeciesPoolEntry[];
  explorationId?: string;
  highlightScientificName?: string;
  compact?: boolean;
}

const SIZE = 720;
const CENTER = SIZE / 2;

/* Logarithmic spiral parameters
 * r(t) = R0 * exp(B * t), where t ∈ [0, TURNS * 2π]
 * We pick R0 small (core) and TURNS so the outer radius reaches ~330.
 */
const R0 = 18;
const TURNS = 3.2; // 3.2 tours pour traverser L1→L5
const T_MAX = TURNS * Math.PI * 2;
const R_MAX = 330;
const B = Math.log(R_MAX / R0) / T_MAX; // calibrate so r(T_MAX)=R_MAX

const LEVEL_ORDER: TrophicGroup[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

interface LevelSegment {
  group: TrophicGroup;
  tStart: number;
  tEnd: number;
}

/** Distribute the [0..T_MAX] range across the 5 levels.
 *  Each level gets a base share + a share weighted by its species count,
 *  so well-populated levels get a longer arc. Empty levels still get a
 *  small placeholder segment to remain visible/pédagogique. */
function buildSegments(counts: Record<TrophicGroup, number>): LevelSegment[] {
  const baseShare = 0.12; // 12% min per level
  const totalBase = baseShare * LEVEL_ORDER.length; // 0.6
  const remaining = 1 - totalBase;
  const sumCounts = LEVEL_ORDER.reduce((a, g) => a + counts[g], 0) || 1;
  let cursor = 0;
  return LEVEL_ORDER.map((g) => {
    const weighted = (counts[g] / sumCounts) * remaining;
    const share = baseShare + weighted;
    const tStart = cursor * T_MAX;
    const tEnd = (cursor + share) * T_MAX;
    cursor += share;
    return { group: g, tStart, tEnd };
  });
}

function spiralPoint(t: number): { x: number; y: number; r: number } {
  const r = R0 * Math.exp(B * t);
  // start at top (-π/2), spiral clockwise
  const angle = -Math.PI / 2 + t;
  return {
    x: CENTER + Math.cos(angle) * r,
    y: CENTER + Math.sin(angle) * r,
    r,
  };
}

/** Build SVG path for a slice of the spiral [tStart..tEnd]. */
function spiralPath(tStart: number, tEnd: number, steps = 80): string {
  const dt = (tEnd - tStart) / steps;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const p = spiralPoint(tStart + dt * i);
    d += (i === 0 ? 'M' : 'L') + p.x.toFixed(2) + ',' + p.y.toFixed(2) + ' ';
  }
  return d;
}

/** Counter-spiral for decomposers: from outer in, opposite winding. */
function counterSpiralPath(steps = 100): string {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = T_MAX - (i / steps) * T_MAX;
    const r = R0 * Math.exp(B * t) * 0.78;
    const angle = -Math.PI / 2 - t * 0.85; // opposite direction, slightly slower
    const x = CENTER + Math.cos(angle) * r;
    const y = CENTER + Math.sin(angle) * r;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
  }
  return d;
}

interface PositionedStar extends TrophicStar {
  x: number;
  y: number;
  r: number;
  t: number;
}

function placeStarsOnSegment(stars: TrophicStar[], seg: LevelSegment): PositionedStar[] {
  const n = stars.length;
  if (n === 0) return [];
  const maxA = Math.max(...stars.map((s) => s.abundance));
  return stars.map((s, i) => {
    // distribute uniformly along the arc; avoid endpoints
    const ratio = (i + 0.5) / n;
    const t = seg.tStart + ratio * (seg.tEnd - seg.tStart);
    const p = spiralPoint(t);
    const r = 4 + Math.log2(1 + (s.abundance / maxA) * 16) * 1.6;
    return { ...s, x: p.x, y: p.y, r, t };
  });
}

function placeDecomposers(stars: TrophicStar[]): PositionedStar[] {
  const n = stars.length;
  if (n === 0) return [];
  const maxA = Math.max(...stars.map((s) => s.abundance));
  return stars.map((s, i) => {
    const ratio = (i + 0.5) / n;
    const t = ratio * T_MAX;
    const rBase = R0 * Math.exp(B * t) * 0.78;
    const angle = -Math.PI / 2 - t * 0.85;
    const x = CENTER + Math.cos(angle) * rBase;
    const y = CENTER + Math.sin(angle) * rBase;
    const r = 3.5 + Math.log2(1 + (s.abundance / maxA) * 16) * 1.4;
    return { ...s, x, y, r, t };
  });
}

export const SpiraleTab: React.FC<Props> = ({ chain, speciesPool, explorationId, highlightScientificName, compact }) => {
  const [hovered, setHovered] = useState<PositionedStar | null>(null);
  const [selected, setSelected] = useState<PositionedStar | null>(null);
  const [focusGroup, setFocusGroup] = useState<TrophicGroup | null>(null);

  const segments = useMemo(() => buildSegments(chain.counts), [chain.counts]);

  const positioned = useMemo(() => {
    const map: Record<TrophicGroup, PositionedStar[]> = {
      L1: [], L2: [], L3: [], L4: [], L5: [], DECOMPOSER: [], UNCLASSIFIED: [],
    };
    segments.forEach((seg) => {
      map[seg.group] = placeStarsOnSegment(chain.byGroup[seg.group], seg);
    });
    map.DECOMPOSER = placeDecomposers(chain.byGroup.DECOMPOSER);
    return map;
  }, [chain, segments]);

  const allStars = useMemo(
    () => [
      ...positioned.L1, ...positioned.L2, ...positioned.L3,
      ...positioned.L4, ...positioned.L5, ...positioned.DECOMPOSER,
    ],
    [positioned],
  );

  const selectedEdges = useMemo(() => {
    if (!selected) return [] as Array<{ x1: number; y1: number; x2: number; y2: number }>;
    const preyGroups = probablePreyGroups(selected.group);
    const preyStars = preyGroups.flatMap((g) => positioned[g]).slice(0, 8);
    return preyStars.map((p) => ({ x1: selected.x, y1: selected.y, x2: p.x, y2: p.y }));
  }, [selected, positioned]);

  const isStarMuted = (s: PositionedStar) => {
    if (highlightScientificName) return s.scientificName !== highlightScientificName;
    if (focusGroup) return s.group !== focusGroup;
    if (selected) {
      if (s.scientificName === selected.scientificName) return false;
      const prey = probablePreyGroups(selected.group);
      return !prey.includes(s.group);
    }
    return false;
  };

  // Position the moving "energy" particle along the main spiral
  const spiralFullPath = useMemo(() => spiralPath(0, T_MAX, 240), []);
  const counterPath = useMemo(() => counterSpiralPath(160), []);

  return (
    <div className={compact ? '' : 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4'}>
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--trophic-bg)) 0%, hsl(var(--trophic-bg-edge)) 100%)',
        }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto block">
          <defs>
            <radialGradient id="spirale-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--trophic-l1))" stopOpacity="0.55" />
              <stop offset="60%" stopColor="hsl(var(--trophic-l1))" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="spirale-flow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--trophic-l1))" />
              <stop offset="35%" stopColor="hsl(var(--trophic-l2))" />
              <stop offset="65%" stopColor="hsl(var(--trophic-l4))" />
              <stop offset="100%" stopColor="hsl(var(--trophic-l5))" />
            </linearGradient>
          </defs>

          {/* Soft sun at the core (L1 / photosynthèse) */}
          <circle cx={CENTER} cy={CENTER} r={60} fill="url(#spirale-core)" />

          {/* Counter-spiral (decomposers) — subtle, dashed */}
          <path
            d={counterPath}
            fill="none"
            stroke={`hsl(var(${DECOMPOSER_META.token}) / 0.35)`}
            strokeWidth={1}
            strokeDasharray="2 5"
          />

          {/* Main spiral — one path per level segment, color = level */}
          {segments.map((seg) => {
            const meta = getLevelMeta(seg.group);
            if (!meta) return null;
            const isEmpty = chain.counts[seg.group] === 0;
            return (
              <path
                key={`seg-${seg.group}`}
                d={spiralPath(seg.tStart, seg.tEnd)}
                fill="none"
                stroke={`hsl(var(${meta.token}) / ${focusGroup && focusGroup !== seg.group ? 0.18 : isEmpty ? 0.35 : 0.85})`}
                strokeWidth={isEmpty ? 1.2 : 2.4}
                strokeDasharray={isEmpty ? '4 6' : undefined}
                strokeLinecap="round"
                onClick={() => setFocusGroup(focusGroup === seg.group ? null : seg.group)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}

          {/* Animated energy particles flowing outward along the spiral */}
          {[0, 0.33, 0.66].map((delay, i) => (
            <circle key={`flux-${i}`} r={3} fill="hsl(var(--trophic-l3))" opacity={0.9}>
              <animateMotion dur="9s" repeatCount="indefinite" begin={`${delay * 9}s`} path={spiralFullPath} />
              <animate attributeName="opacity" values="0;1;1;0" dur="9s" repeatCount="indefinite" begin={`${delay * 9}s`} />
            </circle>
          ))}

          {/* Edges (only when selected) */}
          <AnimatePresence>
            {selectedEdges.map((e, i) => (
              <motion.line
                key={`edge-${i}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="hsl(var(--accent))"
                strokeWidth={1.2}
                strokeDasharray="3 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.65 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            ))}
          </AnimatePresence>

          {/* Stars */}
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
                {isHighlighted && (
                  <>
                    <motion.circle
                      cx={s.x} cy={s.y} r={s.r * 5}
                      fill={`hsl(var(${meta.token}) / 0.18)`}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <circle cx={s.x} cy={s.y} r={s.r * 3.2} fill={`hsl(var(${meta.token}) / 0.4)`} />
                  </>
                )}
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

          {/* Level labels — placed at the END of each segment */}
          {segments.map((seg) => {
            const meta = getLevelMeta(seg.group);
            if (!meta) return null;
            const p = spiralPoint(seg.tEnd - 0.05);
            return (
              <text
                key={`lbl-${seg.group}`}
                x={p.x}
                y={p.y - 8}
                fontSize={10}
                fontWeight={600}
                fill={`hsl(var(${meta.token}))`}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {meta.shortLabel}
              </text>
            );
          })}

          {/* Hover tooltip */}
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

          {/* Core label */}
          <text
            x={CENTER} y={CENTER + 4}
            textAnchor="middle"
            fontSize={10}
            fontFamily="Inter, sans-serif"
            fill="hsl(var(--trophic-l1))"
            opacity={0.85}
            style={{ pointerEvents: 'none' }}
          >
            ☼ photosynthèse
          </text>
        </svg>

        {/* Empty levels alert chips */}
        {chain.balance.missingLevels.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {chain.balance.missingLevels.map((g) => {
              const m = getLevelMeta(g);
              if (!m) return null;
              return (
                <div key={g}
                  className="text-[10px] px-2 py-1 rounded-full bg-background/80 backdrop-blur border border-border text-muted-foreground"
                  title="Aucune espèce détectée à ce niveau">
                  ⚠ Spirale rompue · {m.shortLabel} {m.label} absent
                </div>
              );
            })}
          </div>
        )}

        {(selected || focusGroup) && (
          <button
            onClick={() => { setSelected(null); setFocusGroup(null); }}
            className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-background"
          >
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}

        {/* Legend bottom-left: spiral direction */}
        <div className="absolute top-3 left-3 text-[10px] text-muted-foreground bg-background/70 backdrop-blur px-2 py-1 rounded-md border border-border max-w-[160px] leading-snug">
          ↻ énergie qui monte<br />
          ↺ matière qui retombe (décomposeurs)
        </div>
      </div>

      {/* Side panel — pédagogique */}
      <aside className="rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[720px] overflow-y-auto">
        {selected ? (
          <SelectedStarPanel star={selected} chain={chain} onLevelClick={setFocusGroup} onClose={() => { setSelected(null); setFocusGroup(null); }} speciesPool={speciesPool} explorationId={explorationId} />
        ) : focusGroup ? (
          <LevelPanel group={focusGroup} chain={chain} onClose={() => setFocusGroup(null)} speciesPool={speciesPool} explorationId={explorationId} />
        ) : (
          <DefaultPanel
            chain={chain}
            onLevelClick={setFocusGroup}
            intro="Suivez le fil de l'énergie : du Soleil au cœur jusqu'aux prédateurs en bord de spirale, puis la contre-spirale des décomposeurs qui referme le cycle."
          />
        )}
      </aside>
    </div>
  );
};

export default SpiraleTab;
