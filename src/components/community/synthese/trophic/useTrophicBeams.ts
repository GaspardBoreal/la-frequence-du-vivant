import { useMemo } from 'react';
import {
  probablePreyGroups,
  probablePredatorGroups,
  type TrophicGroup,
} from '@/lib/trophicClassification';
import type { TrophicStar } from '@/hooks/useTrophicChain';

export interface BeamNode extends TrophicStar {
  x: number;
  y: number;
  r: number;
}

export interface BeamEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  group: TrophicGroup;
  ghost?: boolean;
}

export interface RecyclerEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ghost?: boolean;
}

export interface BeamCounts {
  eat: number;
  eaten: number;
  recycle: number;
}

const EDGE_CAP = 24;

/**
 * Hook unifié pour les trois vues trophiques (Réseau, Constellation, Spirale).
 * Calcule les faisceaux bidirectionnels (mangeurs ↑, proies ↓, recycleurs ⟲)
 * autour du nœud sélectionné, avec arcs "fantômes" vers les bandes vides.
 */
export function useTrophicBeams<T extends BeamNode>(
  selected: T | null,
  positioned: Record<TrophicGroup, T[]>,
  ghostTargetFor: (group: TrophicGroup) => { x: number; y: number },
  decomposerGhostTarget: { x: number; y: number },
) {
  const preyEdges = useMemo<BeamEdge[]>(() => {
    if (!selected) return [];
    const groups = probablePreyGroups(selected.group);
    const out: BeamEdge[] = [];
    groups.forEach((g) => {
      const pool = positioned[g];
      if (pool.length === 0) {
        const target = ghostTargetFor(g);
        out.push({ x1: selected.x, y1: selected.y, x2: target.x, y2: target.y, group: g, ghost: true });
      } else {
        pool.forEach((p) => out.push({ x1: selected.x, y1: selected.y, x2: p.x, y2: p.y, group: g }));
      }
    });
    return out.slice(0, EDGE_CAP + groups.length);
  }, [selected, positioned, ghostTargetFor]);

  const predatorEdges = useMemo<BeamEdge[]>(() => {
    if (!selected) return [];
    const groups = probablePredatorGroups(selected.group);
    const out: BeamEdge[] = [];
    groups.forEach((g) => {
      const pool = positioned[g];
      if (pool.length === 0) {
        const target = ghostTargetFor(g);
        out.push({ x1: selected.x, y1: selected.y, x2: target.x, y2: target.y, group: g, ghost: true });
      } else {
        pool.forEach((p) => out.push({ x1: selected.x, y1: selected.y, x2: p.x, y2: p.y, group: g }));
      }
    });
    return out.slice(0, EDGE_CAP + groups.length);
  }, [selected, positioned, ghostTargetFor]);

  const recyclerEdges = useMemo<RecyclerEdge[]>(() => {
    if (!selected) return [];
    if (selected.group === 'DECOMPOSER') return [];
    const pool = positioned.DECOMPOSER;
    if (pool.length === 0) {
      return [{
        x1: selected.x, y1: selected.y,
        x2: decomposerGhostTarget.x, y2: decomposerGhostTarget.y,
        ghost: true,
      }];
    }
    return pool.slice(0, EDGE_CAP).map((p) => ({
      x1: selected.x, y1: selected.y, x2: p.x, y2: p.y,
    }));
  }, [selected, positioned, decomposerGhostTarget]);

  const beamCounts = useMemo<BeamCounts>(() => {
    if (!selected) return { eat: 0, eaten: 0, recycle: 0 };
    const preyG = probablePreyGroups(selected.group);
    const predG = probablePredatorGroups(selected.group);
    const eat = preyG.reduce((acc, g) => acc + Math.max(1, positioned[g].length), 0);
    const eaten = predG.reduce((acc, g) => acc + Math.max(1, positioned[g].length), 0);
    const recycle = selected.group === 'DECOMPOSER' ? 0 : Math.max(1, positioned.DECOMPOSER.length);
    return { eat, eaten, recycle };
  }, [selected, positioned]);

  const connectedNames = useMemo<Set<string>>(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>([selected.scientificName]);
    [...probablePreyGroups(selected.group), ...probablePredatorGroups(selected.group)].forEach((g) => {
      positioned[g].forEach((n) => set.add(n.scientificName));
    });
    positioned.DECOMPOSER.forEach((n) => set.add(n.scientificName));
    return set;
  }, [selected, positioned]);

  return { preyEdges, predatorEdges, recyclerEdges, beamCounts, connectedNames };
}
