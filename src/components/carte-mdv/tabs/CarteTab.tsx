import React, { useMemo } from 'react';
import FiltersBar from '@/components/carte-mdv/FiltersBar';
import ViewSwitcher from '@/components/carte-mdv/ViewSwitcher';
import SharePanel from '@/components/carte-mdv/SharePanel';
import MapView from '@/components/carte-mdv/views/MapView';
import TimelineView from '@/components/carte-mdv/views/TimelineView';
import ListView from '@/components/carte-mdv/views/ListView';
import MurDuVivantView from '@/components/carte-mdv/views/MurDuVivantView';
import ConstellationView from '@/components/carte-mdv/views/ConstellationView';
import {
  useCarteMdVFilters,
  useCarteMdVEvents,
  useSolVivantPoints,
  applyFilters,
} from '@/hooks/useCarteMdV';
import { solVivantMatchesCategories } from '@/lib/marcheCategories';

const CarteTab: React.FC = () => {
  const { filters, update } = useCarteMdVFilters();
  const { data: events = [], isLoading } = useCarteMdVEvents();
  const { data: solPoints = [] } = useSolVivantPoints(filters.solVivantEnabled);

  const filtered = useMemo(() => applyFilters(events, filters), [events, filters]);

  const filteredSolPoints = useMemo(() => {
    if (!filters.solVivantEnabled) return [];
    if (filters.categories.length === 0) return solPoints;
    const set = new Set(filters.categories);
    return solPoints.filter((p) => solVivantMatchesCategories(p.categories, set));
  }, [solPoints, filters.solVivantEnabled, filters.categories]);

  return (
    <>
      <FiltersBar filters={filters} onChange={update} resultCount={filtered.length} />

      <div className="flex items-center justify-between container mx-auto px-4 pt-2">
        <ViewSwitcher value={filters.view} onChange={(v) => update({ view: v })} />
        <div className="pt-4">
          <SharePanel />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="h-[60vh] rounded-xl bg-muted animate-pulse" />
        ) : (
          <>
            {filters.view === 'map' && (
              <MapView events={filtered} solVivantPoints={filteredSolPoints} showSolVivant={filters.solVivantEnabled} />
            )}
            {filters.view === 'timeline' && <TimelineView events={filtered} />}
            {filters.view === 'wall' && <MurDuVivantView events={filtered} />}
            {filters.view === 'constellation' && <ConstellationView events={filtered} />}
            {filters.view === 'list' && <ListView events={filtered} />}
          </>
        )}
      </main>
    </>
  );
};

export default CarteTab;
