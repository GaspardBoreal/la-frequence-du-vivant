import React from 'react';
import { Card } from '@/components/ui/card';
import { CalendarDays, Footprints, Route, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/hooks/useMarcheEventsQuery';

interface Props {
  stats?: DashboardStats;
  isLoading: boolean;
}

const Kpi: React.FC<{ icon: React.ElementType; label: string; value: string; tone: string }> = ({
  icon: Icon,
  label,
  value,
  tone,
}) => (
  <Card className="p-3 sm:p-4 flex items-center gap-3">
    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', tone)}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  </Card>
);

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

const EventsKpiBanner: React.FC<Props> = ({ stats, isLoading }) => {
  const placeholder = isLoading || !stats;
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-4 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Kpi
          icon={CalendarDays}
          label="Événements"
          value={placeholder ? '—' : fmt(stats!.events_count)}
          tone="bg-primary/10 text-primary"
        />
        <Kpi
          icon={Footprints}
          label="Marches associées"
          value={placeholder ? '—' : fmt(stats!.marches_count)}
          tone="bg-emerald-500/15 text-emerald-500"
        />
        <Kpi
          icon={Route}
          label="Kilomètres parcourus"
          value={placeholder || stats!.total_km == null ? '—' : `${fmt(Math.round(stats!.total_km))} km`}
          tone="bg-amber-500/15 text-amber-500"
        />
        <Kpi
          icon={Users}
          label="Participants"
          value={placeholder ? '—' : fmt(stats!.participants_count)}
          tone="bg-sky-500/15 text-sky-500"
        />
      </div>
    </div>
  );
};

export default EventsKpiBanner;
