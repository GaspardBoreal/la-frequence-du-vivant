import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CalendarX, UserX, Copy, Sparkles } from 'lucide-react';
import { isPast, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  useMarcheEventsAll,
  useParticipationCountsForEvents,
  type EventsFilters,
} from '@/hooks/useMarcheEventsQuery';

const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  count: number;
  children: React.ReactNode;
}> = ({ icon: Icon, title, description, count, children }) => (
  <Card className="p-4">
    <div className="flex items-start gap-3 mb-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <div className="space-y-2">{children}</div>
  </Card>
);

const EventsRecommendationsTab: React.FC<{ filters: EventsFilters; active: boolean }> = ({ filters, active }) => {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useMarcheEventsAll(filters, active);
  const { data: counts = {} } = useParticipationCountsForEvents(events.map((e) => e.id));

  const pastNoParticipants = useMemo(
    () => events.filter((e) => isPast(new Date(e.date_marche)) && (counts[e.id] || 0) === 0),
    [events, counts]
  );

  const upcomingLowSignup = useMemo(
    () =>
      events.filter((e) => {
        if (isPast(new Date(e.date_marche))) return false;
        const c = counts[e.id] || 0;
        return c === 0;
      }),
    [events, counts]
  );

  const duplicates = useMemo(() => {
    const map = new Map<string, typeof events>();
    events.forEach((e) => {
      const key = `${(e.title || '').trim().toLowerCase()}|${(e.lieu || '').trim().toLowerCase()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.values()).filter((g) => g.length > 1);
  }, [events]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  const Item: React.FC<{ id: string; title: string; sub: string }> = ({ id, title, sub }) => (
    <button
      onClick={() => navigate(`/admin/marche-events/${id}`)}
      className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
    >
      <p className="text-sm font-medium text-foreground truncate">{title}</p>
      <p className="text-xs text-muted-foreground truncate">{sub}</p>
    </button>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">
            Recommandations automatiques basées sur les filtres actifs. Une couche IA viendra enrichir ces signaux
            ultérieurement.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Section
          icon={UserX}
          title="À venir sans inscription"
          description="Événements futurs sans participant. Pousser communication."
          count={upcomingLowSignup.length}
        >
          {upcomingLowSignup.slice(0, 6).map((e) => (
            <Item
              key={e.id}
              id={e.id}
              title={e.title}
              sub={`${format(new Date(e.date_marche), 'PPP', { locale: fr })} · ${e.lieu ?? '—'}`}
            />
          ))}
          {upcomingLowSignup.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Tous les événements à venir ont des inscrits 🎉</p>
          )}
        </Section>

        <Section
          icon={CalendarX}
          title="Passées sans participation"
          description="Événements passés sans validation. À investiguer ou archiver."
          count={pastNoParticipants.length}
        >
          {pastNoParticipants.slice(0, 6).map((e) => (
            <Item
              key={e.id}
              id={e.id}
              title={e.title}
              sub={`${format(new Date(e.date_marche), 'PPP', { locale: fr })} · ${e.lieu ?? '—'}`}
            />
          ))}
          {pastNoParticipants.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Aucun événement passé orphelin.</p>
          )}
        </Section>

        <Section
          icon={Copy}
          title="Doublons potentiels"
          description="Événements partageant titre + lieu identiques."
          count={duplicates.length}
        >
          {duplicates.slice(0, 6).map((group) => (
            <div key={group[0].id} className="p-2 rounded-md bg-muted/50">
              <p className="text-sm font-medium text-foreground">{group[0].title}</p>
              <p className="text-xs text-muted-foreground">
                {group.length} occurrences · {group[0].lieu ?? '—'}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {group.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => navigate(`/admin/marche-events/${e.id}`)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border hover:bg-primary/10"
                  >
                    {format(new Date(e.date_marche), 'dd/MM/yy')}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {duplicates.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Aucun doublon détecté.</p>
          )}
        </Section>
      </div>
    </div>
  );
};

export default EventsRecommendationsTab;
