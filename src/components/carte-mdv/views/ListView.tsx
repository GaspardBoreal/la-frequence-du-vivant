import React from 'react';
import { CarteMdVEvent } from '@/hooks/useCarteMdV';
import EventCard from '../EventCard';

const ListView: React.FC<{ events: CarteMdVEvent[] }> = ({ events }) => {
  const sorted = [...events].sort((a, b) => new Date(b.date_marche).getTime() - new Date(a.date_marche).getTime());
  if (sorted.length === 0) return <p className="text-center py-16 text-muted-foreground">Aucune marche à afficher.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((e) => <EventCard key={e.id} event={e} />)}
    </div>
  );
};

export default ListView;
