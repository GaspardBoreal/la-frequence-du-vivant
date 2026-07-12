import React, { useState } from 'react';
import { CarteMdVEvent } from '@/hooks/useCarteMdV';
import EventCard from '../EventCard';
import { Button } from '@/components/ui/button';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Clock } from 'lucide-react';

type SortOrder = 'desc' | 'asc';

const TimelineView: React.FC<{ events: CarteMdVEvent[] }> = ({ events }) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sorted = [...events].sort((a, b) => {
    const diff = new Date(a.date_marche).getTime() - new Date(b.date_marche).getTime();
    return sortOrder === 'asc' ? diff : -diff;
  });

  if (sorted.length === 0) {
    return <p className="text-center py-16 text-muted-foreground">Aucune marche à afficher.</p>;
  }

  return (
    <div className="relative">
      {/* Barre de tri */}
      <div className="flex items-center justify-end gap-1 mb-3 px-1">
        <span className="text-[11px] text-muted-foreground mr-1">Trier&nbsp;:</span>
        <div className="inline-flex rounded-md border border-border bg-background/50 overflow-hidden">
          <Button
            type="button"
            variant={sortOrder === 'desc' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 rounded-none text-xs gap-1.5"
            onClick={() => setSortOrder('desc')}
            aria-pressed={sortOrder === 'desc'}
          >
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            Plus récentes d'abord
          </Button>
          <Button
            type="button"
            variant={sortOrder === 'asc' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 rounded-none text-xs gap-1.5"
            onClick={() => setSortOrder('asc')}
            aria-pressed={sortOrder === 'asc'}
          >
            <ArrowUpWideNarrow className="h-3.5 w-3.5" />
            Plus anciennes d'abord
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-4">
          {sorted.map((e) => {
            const d = new Date(e.date_marche);
            const daysAway = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const daysBadge =
              daysAway >= 0 && daysAway <= 90 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shadow-sm whitespace-nowrap">
                  <Clock className="h-2.5 w-2.5" />
                  {daysAway === 0 ? "Aujourd'hui" : `dans ${daysAway} j`}
                </span>
              ) : null;
            return (
              <div key={e.id} className="snap-start shrink-0 w-[320px]">
                <EventCard event={e} rightBadge={daysBadge} />
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4">
        ← Faites défiler pour découvrir toutes les marches →
      </p>
    </div>
  );
};

export default TimelineView;
