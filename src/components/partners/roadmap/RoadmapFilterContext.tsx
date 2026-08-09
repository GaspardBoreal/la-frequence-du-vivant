import React from 'react';
import type { WorkStatus } from '@/lib/partnerRoadmaps';

export type RoadmapFilterValue = WorkStatus | 'all';

export interface RoadmapCounts {
  total: number;
  done: number;
  doing: number;
  todo: number;
}

interface RoadmapFilterCtx {
  filter: RoadmapFilterValue;
  /** Change de filtre : dépingle et ramène à la section « Chantiers ». */
  applyFilter: (f: RoadmapFilterValue) => void;
  counts: RoadmapCounts;
  setCounts: (c: RoadmapCounts) => void;
  /** Chantiers dont l'état vient d'être changé, gardés visibles dans la liste filtrée. */
  pinned: Set<string>;
  pin: (key: string) => void;
}

const Ctx = React.createContext<RoadmapFilterCtx | null>(null);

/** Contexte partagé entre le sommaire (2ᵉ rangée de filtres) et les cartes chantiers. */
export const RoadmapFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filter, setFilter] = React.useState<RoadmapFilterValue>('all');
  const [pinned, setPinned] = React.useState<Set<string>>(() => new Set());
  const [counts, setCountsState] = React.useState<RoadmapCounts>({
    total: 0,
    done: 0,
    doing: 0,
    todo: 0,
  });

  const setCounts = React.useCallback((c: RoadmapCounts) => {
    setCountsState((prev) =>
      prev.total === c.total && prev.done === c.done && prev.doing === c.doing && prev.todo === c.todo
        ? prev
        : c,
    );
  }, []);

  const applyFilter = React.useCallback((f: RoadmapFilterValue) => {
    setPinned(new Set());
    setFilter(f);
    document.getElementById('roadmap-03')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const pin = React.useCallback((key: string) => {
    setPinned((prev) => new Set(prev).add(key));
  }, []);

  const value = React.useMemo<RoadmapFilterCtx>(
    () => ({ filter, applyFilter, counts, setCounts, pinned, pin }),
    [filter, applyFilter, counts, setCounts, pinned, pin],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/** null si aucun provider (la nav reste utilisable seule). */
export const useRoadmapFilter = () => React.useContext(Ctx);

export default RoadmapFilterProvider;
