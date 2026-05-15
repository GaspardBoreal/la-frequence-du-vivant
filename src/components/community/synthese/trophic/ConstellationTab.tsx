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

export const ConstellationTab: React.FC<Props> = ({ chain }) => {
  const [hovered, setHovered] = useState<PositionedStar | null>(null);
  const [selected, setSelected] = useState<PositionedStar | null>(null);
  const [focusGroup, setFocusGroup] = useState<TrophicGroup | null>(null);

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

  // Compute predator->prey edges. To stay legible: only render edges for selected star.
  const selectedEdges = useMemo(() => {
    if (!selected) return [] as Array<{ x1: number; y1: number; x2: number; y2: number }>;
    const preyGroups = probablePreyGroups(selected.group);
    const preyStars = preyGroups.flatMap((g) => positioned[g]).slice(0, 8);
    return preyStars.map((p) => ({ x1: selected.x, y1: selected.y, x2: p.x, y2: p.y }));
  }, [selected, positioned]);

  const isStarMuted = (s: PositionedStar) => {
    if (focusGroup) return s.group !== focusGroup;
    if (selected) {
      if (s.scientificName === selected.scientificName) return false;
      const prey = probablePreyGroups(selected.group);
      return !prey.includes(s.group);
    }
    return false;
  };

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

          {/* edges (only when selected) */}
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

          {/* stars */}
          {allStars.map((s, i) => {
            const meta = getLevelMeta(s.group);
            if (!meta) return null;
            const muted = isStarMuted(s);
            const isSelected = selected?.scientificName === s.scientificName;
            return (
              <motion.g
                key={`${s.scientificName}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: muted ? 0.18 : 1, scale: 1 }}
                transition={{ delay: i * 0.005, duration: 0.4 }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(isSelected ? null : s)}
                style={{ cursor: 'pointer' }}
              >
                {/* halo */}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={s.r * (isSelected ? 3 : 2)}
                  fill={`hsl(var(${meta.token}) / ${isSelected ? 0.35 : 0.18})`}
                />
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill={`hsl(var(${meta.token}))`}
                  stroke={s.source === 'kb' ? `hsl(var(${meta.token}))` : 'transparent'}
                  strokeWidth={s.source === 'kb' ? 0.8 : 0}
                />
                {/* hollow ring for heuristic */}
                {s.source === 'heuristic' && (
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

        {/* Empty levels alert chips */}
        {chain.balance.missingLevels.length > 0 && (
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
            onClick={() => { setSelected(null); setFocusGroup(null); }}
            className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-background"
          >
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Side panel — pédagogique */}
      <aside className="rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[720px] overflow-y-auto">
        {selected ? (
          <SelectedStarPanel star={selected} chain={chain} onLevelClick={setFocusGroup} />
        ) : focusGroup ? (
          <LevelPanel group={focusGroup} chain={chain} />
        ) : (
          <DefaultPanel chain={chain} onLevelClick={setFocusGroup} />
        )}
      </aside>
    </div>
  );
};

/* -------------------- Side panels -------------------- */

const DefaultPanel: React.FC<{ chain: TrophicChainResult; onLevelClick: (g: TrophicGroup) => void }> = ({ chain, onLevelClick }) => (
  <>
    <div className="flex items-center gap-2 text-foreground">
      <Sparkles className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-semibold">Lecture trophique</h3>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">
      Survolez une étoile, cliquez pour isoler sa chaîne, ou explorez un anneau pour découvrir un niveau trophique.
    </p>
    <div className="space-y-1.5 pt-1">
      {[...TROPHIC_LEVELS, DECOMPOSER_META].map((l) => {
        const c = chain.counts[l.group];
        return (
          <button
            key={l.group}
            onClick={() => onLevelClick(l.group)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 text-left transition"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: `hsl(var(${l.token}))` }}
              />
              <span className="text-xs font-medium text-foreground truncate">{l.label}</span>
            </span>
            <span className={`text-xs tabular-nums ${c === 0 ? 'text-muted-foreground/50' : 'text-foreground'}`}>
              {c}
            </span>
          </button>
        );
      })}
    </div>

    {chain.unclassified.length > 0 && (
      <div className="pt-2 border-t border-border text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Info className="w-3 h-3" />
          {chain.unclassified.length} espèce{chain.unclassified.length > 1 ? 's' : ''} non classée{chain.unclassified.length > 1 ? 's' : ''} (curation à venir)
        </span>
      </div>
    )}
  </>
);

const LevelPanel: React.FC<{ group: TrophicGroup; chain: TrophicChainResult }> = ({ group, chain }) => {
  const meta = getLevelMeta(group);
  if (!meta) return null;
  const stars = chain.byGroup[group];
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(var(${meta.token}))` }} />
        <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
      <p className="text-[11px] text-muted-foreground italic">Exemples : {meta.examples}</p>
      <div className="pt-2 border-t border-border">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
          {stars.length} espèce{stars.length > 1 ? 's' : ''} sur ce territoire
        </p>
        {stars.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucune espèce détectée à ce niveau — un signal écologique fort à surveiller.
          </p>
        ) : (
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {stars.slice(0, 50).map((s) => (
              <li key={s.scientificName} className="text-xs text-foreground flex items-baseline gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: `hsl(var(${meta.token}))` }}
                />
                <SpeciesName scientificName={s.scientificName} commonName={s.commonName} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

const SelectedStarPanel: React.FC<{
  star: TrophicStar;
  chain: TrophicChainResult;
  onLevelClick: (g: TrophicGroup) => void;
}> = ({ star, chain, onLevelClick }) => {
  const meta = getLevelMeta(star.group);
  if (!meta) return null;
  const preyGroups = probablePreyGroups(star.group);
  return (
    <>
      <div className="flex items-start gap-3">
        {star.photoUrl && (
          <img src={star.photoUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="min-w-0">
          <SpeciesName scientificName={star.scientificName} commonName={star.commonName} showScientific size="md" />
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(var(${meta.token}))` }} />
            <span className="text-[11px] text-muted-foreground">{meta.label}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {star.source === 'kb' ? 'Attribution curée' : `Heuristique : ${star.rationale ?? 'règle taxonomique'}`}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">{meta.description}</p>
      {preyGroups.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Se nourrit de</p>
          <div className="flex flex-wrap gap-1.5">
            {preyGroups.map((g) => {
              const m = getLevelMeta(g);
              if (!m) return null;
              return (
                <button
                  key={g}
                  onClick={() => onLevelClick(g)}
                  className="text-[11px] px-2 py-0.5 rounded-full border hover:bg-muted/60"
                  style={{ borderColor: `hsl(var(${m.token}) / 0.5)`, color: `hsl(var(${m.token}))` }}
                >
                  {m.label} ({chain.counts[g]})
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default ConstellationTab;
