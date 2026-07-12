import React from 'react';
import { CarteMdVEvent } from '@/hooks/useCarteMdV';
import EventCard from '../EventCard';

const TimelineView: React.FC<{ events: CarteMdVEvent[] }> = ({ events }) => {
  const sorted = [...events].sort((a, b) => new Date(a.date_marche).getTime() - new Date(b.date_marche).getTime());

  if (sorted.length === 0) {
    return <p className="text-center py-16 text-muted-foreground">Aucune marche à afficher.</p>;
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-4">
          {sorted.map((e) => {
            const d = new Date(e.date_marche);
            const daysAway = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={e.id} className="snap-start shrink-0 w-[320px] relative">
                {daysAway >= 0 && daysAway <= 90 && (
                  <div className="absolute -top-2 left-3 z-10 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">
                    {daysAway === 0 ? "Aujourd'hui" : `dans ${daysAway} j`}
                  </div>
                )}
                <EventCard event={e} />
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
