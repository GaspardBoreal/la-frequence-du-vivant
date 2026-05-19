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
import { DefaultPanel, LevelPanel, SelectedStarPanel } from './_panels';

interface Props {
  chain: TrophicChainResult;
}

const W = 720;
const H = 720;
const PAD_X = 60;
const PAD_TOP = 40;
const PAD_BOTTOM = 40;

/** Vertical bands: L5 at top (canopée / apex), L1 at bottom (sol/végétation) */
const BAND_ORDER: TrophicGroup[] = ['L5', 'L4', 'L3', 'L2', 'L1'];

interface PositionedNode extends TrophicStar {
  x: number;
  y: number;
  r: number;
}

/** Deterministic "jitter" from a string seed — gives a natural but stable scatter. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function placeBand(stars: TrophicStar[], y: number, jitterAmp = 18): PositionedNode[] {
  const n = stars.length;
  if (n === 0) return [];
  const maxA = Math.max(...stars.map((s) => s.abundance));
  const usable = W - PAD_X * 2;
  return stars.map((s, i) => {
    const ratio = n === 1 ? 0.5 : i / (n - 1);
    const x = PAD_X + ratio * usable;
    const jy = (hash(s.scientificName) - 0.5) * 2 * jitterAmp;
    const r = 4 + Math.log2(1 + (s.abundance / maxA) * 16) * 1.6;
    return { ...s, x, y: y + jy, r };
  });
}

/** Decomposer column on the right side, vertical stack */
function placeDecomposers(stars: TrophicStar[], xCol: number): PositionedNode[] {
  const n = stars.length;
  if (n === 0) return [];
  const maxA = Math.max(...stars.map((s) => s.abundance));
  const usable = H - PAD_TOP - PAD_BOTTOM;
  return stars.map((s, i) => {
    const ratio = n === 1 ? 0.5 : i / (n - 1);
    const y = PAD_TOP + ratio * usable;
    const jx = (hash(s.scientificName) - 0.5) * 24;
    const r = 3.5 + Math.log2(1 + (s.abundance / maxA) * 16) * 1.4;
    return { ...s, x: xCol + jx, y, r };
  });
}

export const ReseauTab: React.FC<Props> = ({ chain }) => {
  const [hovered, setHovered] = useState<PositionedNode | null>(null);
  const [selected, setSelected] = useState<PositionedNode | null>(null);
  const [focusGroup, setFocusGroup] = useState<TrophicGroup | null>(null);

  // Y positions for each band
  const bandY = useMemo(() => {
    const usable = H - PAD_TOP - PAD_BOTTOM;
    const step = usable / (BAND_ORDER.length - 1);
    const map: Partial<Record<TrophicGroup, number>> = {};
    BAND_ORDER.forEach((g, i) => { map[g] = PAD_TOP + i * step; });
    return map as Record<Exclude<TrophicGroup, 'DECOMPOSER' | 'UNCLASSIFIED'>, number>;
  }, []);

  const decomposerX = W - PAD_X + 10;

  const positioned = useMemo(() => {
    const map: Record<TrophicGroup, PositionedNode[]> = {
      L1: placeBand(chain.byGroup.L1, bandY.L1),
      L2: placeBand(chain.byGroup.L2, bandY.L2),
      L3: placeBand(chain.byGroup.L3, bandY.L3),
      L4: placeBand(chain.byGroup.L4, bandY.L4),
      L5: placeBand(chain.byGroup.L5, bandY.L5),
      DECOMPOSER: placeDecomposers(chain.byGroup.DECOMPOSER, decomposerX),
      UNCLASSIFIED: [],
    };
    return map;
  }, [chain, bandY, decomposerX]);

  const allNodes = useMemo(
    () => [...positioned.L1, ...positioned.L2, ...positioned.L3, ...positioned.L4, ...positioned.L5, ...positioned.DECOMPOSER],
    [positioned],
  );

  /** Background "ambient" edges: a sample of trophic links across the whole network,
   *  capped so the canvas stays readable. */
  const ambientEdges = useMemo(() => {
    if (selected) return [];
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number; group: TrophicGroup }> = [];
    const cap = 80;
    (['L5', 'L4', 'L3', 'L2'] as TrophicGroup[]).forEach((pred) => {
      const preds = positioned[pred];
      const preyGroups = probablePreyGroups(pred);
      preds.forEach((p, idx) => {
        // 2 prey links per predator max (deterministic pick)
        preyGroups.slice(0, 2).forEach((pg) => {
          const pool = positioned[pg];
          if (pool.length === 0) return;
          const target = pool[(idx + Math.floor(hash(p.scientificName) * pool.length)) % pool.length];
          edges.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, group: pred });
        });
      });
    });
    return edges.slice(0, cap);
  }, [positioned, selected]);

  /** Selected node edges */
  const selectedEdges = useMemo(() => {
    if (!selected) return [];
    const preyGroups = probablePreyGroups(selected.group);
    const preyNodes = preyGroups.flatMap((g) => positioned[g]).slice(0, 10);
    return preyNodes.map((p) => ({ x1: selected.x, y1: selected.y, x2: p.x, y2: p.y }));
  }, [selected, positioned]);

  const isMuted = (n: PositionedNode) => {
    if (focusGroup) return n.group !== focusGroup;
    if (selected) {
      if (n.scientificName === selected.scientificName) return false;
      const prey = probablePreyGroups(selected.group);
      return !prey.includes(n.group);
    }
    return false;
  };

  /** Curved bezier path between two points (mostly vertical curve) */
  const curve = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = (x2 - x1) * 0.4;
    return `M${x1},${y1} C${x1 + dx},${(y1 + y2) / 2} ${x2 - dx},${(y1 + y2) / 2} ${x2},${y2}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, hsl(var(--trophic-bg)) 0%, hsl(var(--trophic-bg-edge)) 100%)',
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* Band guides */}
          {BAND_ORDER.map((g) => {
            const meta = getLevelMeta(g);
            if (!meta) return null;
            const y = bandY[g as Exclude<TrophicGroup, 'DECOMPOSER' | 'UNCLASSIFIED'>];
            const isEmpty = chain.counts[g] === 0;
            const dim = focusGroup && focusGroup !== g ? 0.06 : isEmpty ? 0.12 : 0.22;
            return (
              <g key={`band-${g}`}>
                <line
                  x1={PAD_X - 20} y1={y} x2={W - PAD_X + 20} y2={y}
                  stroke={`hsl(var(${meta.token}) / ${dim})`}
                  strokeWidth={1}
                  strokeDasharray={isEmpty ? '4 6' : undefined}
                  onClick={() => setFocusGroup(focusGroup === g ? null : g)}
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={PAD_X - 28} y={y + 4}
                  fontSize={10}
                  fontWeight={600}
                  textAnchor="end"
                  fill={`hsl(var(${meta.token}))`}
                  fontFamily="Inter, sans-serif"
                  opacity={0.85}
                  style={{ pointerEvents: 'none' }}
                >
                  {meta.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Decomposer column guide */}
          {chain.counts.DECOMPOSER > 0 && (
            <>
              <line
                x1={decomposerX} y1={PAD_TOP - 10} x2={decomposerX} y2={H - PAD_BOTTOM + 10}
                stroke={`hsl(var(${DECOMPOSER_META.token}) / 0.25)`}
                strokeDasharray="2 5"
              />
              <text
                x={decomposerX} y={PAD_TOP - 18}
                fontSize={10}
                fontWeight={600}
                textAnchor="middle"
                fill={`hsl(var(${DECOMPOSER_META.token}))`}
                fontFamily="Inter, sans-serif"
                opacity={0.85}
              >
                ⟲ recycle
              </text>
            </>
          )}

          {/* Ambient predator-prey web (faint) */}
          {!selected && !focusGroup && ambientEdges.map((e, i) => {
            const meta = getLevelMeta(e.group);
            if (!meta) return null;
            return (
              <path
                key={`amb-${i}`}
                d={curve(e.x1, e.y1, e.x2, e.y2)}
                fill="none"
                stroke={`hsl(var(${meta.token}) / 0.18)`}
                strokeWidth={0.7}
              />
            );
          })}

          {/* Decomposer "return" flows: faint curves from each band toward decomposer column */}
          {!selected && !focusGroup && positioned.DECOMPOSER.length > 0 && (
            <g opacity={0.35}>
              {(['L1', 'L2', 'L3', 'L4', 'L5'] as TrophicGroup[]).map((g) => {
                const band = positioned[g];
                if (band.length === 0 || positioned.DECOMPOSER.length === 0) return null;
                const src = band[Math.floor(band.length / 2)];
                const dst = positioned.DECOMPOSER[Math.floor(positioned.DECOMPOSER.length / 2)];
                return (
                  <path
                    key={`recycle-${g}`}
                    d={curve(src.x, src.y, dst.x, dst.y)}
                    fill="none"
                    stroke={`hsl(var(${DECOMPOSER_META.token}) / 0.4)`}
                    strokeWidth={0.6}
                    strokeDasharray="2 4"
                  />
                );
              })}
            </g>
          )}

          {/* Selected edges (highlight) */}
          <AnimatePresence>
            {selectedEdges.map((e, i) => (
              <motion.path
                key={`sel-${i}`}
                d={curve(e.x1, e.y1, e.x2, e.y2)}
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth={1.4}
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.75 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            ))}
          </AnimatePresence>

          {/* Nodes */}
          {allNodes.map((n, i) => {
            const meta = getLevelMeta(n.group);
            if (!meta) return null;
            const muted = isMuted(n);
            const isSelected = selected?.scientificName === n.scientificName;
            return (
              <motion.g
                key={`${n.scientificName}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: muted ? 0.18 : 1, scale: 1 }}
                transition={{ delay: i * 0.005, duration: 0.4 }}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(isSelected ? null : n)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={n.x} cy={n.y}
                  r={n.r * (isSelected ? 3 : 2)}
                  fill={`hsl(var(${meta.token}) / ${isSelected ? 0.35 : 0.18})`}
                />
                <circle
                  cx={n.x} cy={n.y}
                  r={n.r}
                  fill={`hsl(var(${meta.token}))`}
                  stroke={n.source === 'kb' ? `hsl(var(${meta.token}))` : 'transparent'}
                  strokeWidth={n.source === 'kb' ? 0.8 : 0}
                />
                {n.source === 'heuristic' && (
                  <circle
                    cx={n.x} cy={n.y} r={n.r + 1.2}
                    fill="none"
                    stroke={`hsl(var(${meta.token}) / 0.55)`}
                    strokeWidth={0.6}
                  />
                )}
              </motion.g>
            );
          })}

          {/* Hover tooltip */}
          {hovered && (() => {
            const meta = getLevelMeta(hovered.group);
            if (!meta) return null;
            const tx = Math.min(hovered.x + 12, W - 180);
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

        {/* Empty levels chips */}
        {chain.balance.missingLevels.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {chain.balance.missingLevels.map((g) => {
              const m = getLevelMeta(g);
              if (!m) return null;
              return (
                <div key={g}
                  className="text-[10px] px-2 py-1 rounded-full bg-background/80 backdrop-blur border border-border text-muted-foreground"
                  title="Aucune espèce détectée à ce niveau">
                  ⚠ Maillon manquant · {m.shortLabel} {m.label}
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

        <div className="absolute top-3 left-3 text-[10px] text-muted-foreground bg-background/70 backdrop-blur px-2 py-1 rounded-md border border-border max-w-[180px] leading-snug">
          Réseau trophique : chaque courbe = un lien probable prédateur → proie.
        </div>
      </div>

      <aside className="rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[720px] overflow-y-auto">
        {selected ? (
          <SelectedStarPanel star={selected} chain={chain} onLevelClick={setFocusGroup} onClose={() => { setSelected(null); setFocusGroup(null); }} />
        ) : focusGroup ? (
          <LevelPanel group={focusGroup} chain={chain} onClose={() => setFocusGroup(null)} />
        ) : (
          <DefaultPanel
            chain={chain}
            onLevelClick={setFocusGroup}
            intro="Le tissu vivant déplié : 5 strates horizontales du sol à l'apex, traversées de liens prédateur→proie, et une colonne de décomposeurs qui referme le cycle à droite."
          />
        )}
      </aside>
    </div>
  );
};

export default ReseauTab;
