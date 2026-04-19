import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarcheEventsAll, type EventsFilters } from '@/hooks/useMarcheEventsQuery';
import { getMarcheEventTypeMeta, MARCHE_EVENT_TYPES } from '@/lib/marcheEventTypes';

const TYPE_COLORS: Record<string, string> = {
  agroecologique: 'hsl(var(--primary))',
  eco_poetique: 'hsl(var(--secondary-foreground))',
  eco_tourisme: 'hsl(var(--accent-foreground))',
  none: 'hsl(var(--muted-foreground))',
};

const EventsAnalyticsTab: React.FC<{ filters: EventsFilters; active: boolean }> = ({ filters, active }) => {
  const { data: events = [], isLoading } = useMarcheEventsAll(filters, active);

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      const key = format(parseISO(e.date_marche), 'yyyy-MM');
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => ({ month: format(parseISO(k + '-01'), 'MMM yy', { locale: fr }), count: v }));
  }, [events]);

  const byType = useMemo(() => {
    const counts: Record<string, number> = { none: 0 };
    MARCHE_EVENT_TYPES.forEach((t) => (counts[t] = 0));
    events.forEach((e) => {
      const k = e.event_type && counts[e.event_type] !== undefined ? e.event_type : 'none';
      counts[k]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        name: k === 'none' ? 'Aucun' : getMarcheEventTypeMeta(k)?.shortLabel ?? k,
        value: v,
        key: k,
      }));
  }, [events]);

  const topLieux = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      if (e.lieu) map.set(e.lieu, (map.get(e.lieu) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([lieu, count]) => ({ lieu: lieu.length > 24 ? lieu.slice(0, 24) + '…' : lieu, count }));
  }, [events]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aucune donnée à analyser avec les filtres actuels.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4 md:col-span-2">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Événements par mois (12 derniers)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={byMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Répartition par type</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {byType.map((entry) => (
                <Cell key={entry.key} fill={TYPE_COLORS[entry.key] || 'hsl(var(--muted))'} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Top 10 lieux</h3>
        {topLieux.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun lieu renseigné.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topLieux} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <YAxis type="category" dataKey="lieu" width={120} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};

export default EventsAnalyticsTab;
