import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DECOMPOSER_META, getLevelMeta } from '@/lib/trophicClassification';
import type { BeamEdge, RecyclerEdge } from './useTrophicBeams';
import type { Beam } from './TrophicBeamOverlay';

interface Props {
  show: boolean;
  activeBeam: Beam;
  preyEdges: BeamEdge[];
  predatorEdges: BeamEdge[];
  recyclerEdges: RecyclerEdge[];
  /** Use cubic Bezier (true) or straight lines (false). */
  curved?: boolean;
}

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = (x2 - x1) * 0.4;
  return `M${x1},${y1} C${x1 + dx},${(y1 + y2) / 2} ${x2 - dx},${(y1 + y2) / 2} ${x2},${y2}`;
};

/** Faisceaux animés mangeurs ↑ / proies ↓ / recycleurs ⟲ — partagé entre Réseau, Constellation et Spirale. */
export const TrophicBeamEdges: React.FC<Props> = ({
  show, activeBeam, preyEdges, predatorEdges, recyclerEdges, curved = true,
}) => {
  if (!show) return null;
  const showEat = !activeBeam || activeBeam === 'eat';
  const showEaten = !activeBeam || activeBeam === 'eaten';
  const showRecycle = !activeBeam || activeBeam === 'recycle';

  const renderEdge = (e: BeamEdge | RecyclerEdge, idx: number, keyPrefix: string, color: string, dash?: string) => {
    const props = {
      key: `${keyPrefix}-${idx}`,
      fill: 'none' as const,
      stroke: color,
      strokeWidth: e.ghost ? 0.9 : 1.4,
      strokeDasharray: e.ghost ? '2 6' : dash,
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: e.ghost ? 0.28 : 0.75 },
      exit: { opacity: 0 },
      transition: { delay: idx * 0.03, duration: 0.7, ease: 'easeOut' as const },
    };
    return curved
      ? <motion.path d={curve(e.x1, e.y1, e.x2, e.y2)} {...props} />
      : <motion.line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} {...props} />;
  };

  return (
    <AnimatePresence>
      {showEaten && predatorEdges.map((e, i) => {
        const meta = getLevelMeta(e.group);
        const color = meta ? `hsl(var(${meta.token}))` : 'hsl(var(--accent))';
        return renderEdge(e, i, 'pred', color);
      })}
      {showEat && preyEdges.map((e, i) => {
        const meta = getLevelMeta(e.group);
        const color = meta ? `hsl(var(${meta.token}))` : 'hsl(var(--accent))';
        return renderEdge(e, i, 'prey', color, '4 4');
      })}
      {showRecycle && recyclerEdges.map((e, i) =>
        renderEdge(e, i, 'rec', `hsl(var(${DECOMPOSER_META.token}))`, '3 5'),
      )}
    </AnimatePresence>
  );
};
