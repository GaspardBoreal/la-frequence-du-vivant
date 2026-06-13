import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarRange, Search, MapPin, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MarcheDetailDrawer } from '@/components/crm/marches/MarcheDetailDrawer';
import { useEventCompanyCounts } from '@/hooks/useCrmCompanyEvents';

interface MarcheEvent {
  id: string;
  title: string;
  description: string | null;
  date_marche: string | null;
  lieu: string | null;
  event_type: string | null;
  is_public: boolean | null;
}

const CrmMarches: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['crm-marches-list'],
    queryFn: async (): Promise<MarcheEvent[]> => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('id, title, description, date_marche, lieu, event_type, is_public')
        .order('date_marche', { ascending: false });
      if (error) throw error;
      return (data || []) as MarcheEvent[];
    },
  });

  const filtered = React.useMemo(() => {
    if (!q.trim()) return events;
    const s = q.toLowerCase();
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes(s) ||
        e.lieu?.toLowerCase().includes(s) ||
        e.event_type?.toLowerCase().includes(s)
    );
  }, [events, q]);

  const eventIds = React.useMemo(() => filtered.map((e) => e.id), [filtered]);
  const { data: countsByEvent = {} } = useEventCompanyCounts(eventIds);

  const now = new Date();
  const upcoming = filtered.filter((e) => e.date_marche && new Date(e.date_marche) >= now);
  const past = filtered.filter((e) => !e.date_marche || new Date(e.date_marche) < now);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--crm-text))] tracking-tight">Marches</h1>
          <p className="text-sm crm-muted mt-1">
            Liste des événements et liens avec les entreprises CRM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un événement…"
              className="pl-9 w-[260px] bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))] placeholder:crm-muted"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin crm-muted" />
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <Section
              title="À venir"
              count={upcoming.length}
              events={upcoming}
              countsByEvent={countsByEvent}
              onSelect={setSelectedId}
            />
          )}
          <Section
            title="Passées"
            count={past.length}
            events={past}
            countsByEvent={countsByEvent}
            onSelect={setSelectedId}
            muted
          />
        </div>
      )}

      <MarcheDetailDrawer
        eventId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
};

const Section: React.FC<{
  title: string;
  count: number;
  events: MarcheEvent[];
  countsByEvent: Record<string, number>;
  onSelect: (id: string) => void;
  muted?: boolean;
}> = ({ title, count, events, countsByEvent, onSelect, muted }) => {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${muted ? 'crm-muted' : 'text-[hsl(var(--crm-text))]'}`}>
          {title}
        </h2>
        <span className="text-xs crm-muted">{count}</span>
      </div>
      <div className="rounded-xl crm-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[hsl(var(--crm-border))] hover:bg-transparent">
              <TableHead className="crm-muted text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="crm-muted text-xs uppercase tracking-wider">Titre</TableHead>
              <TableHead className="crm-muted text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="crm-muted text-xs uppercase tracking-wider">Lieu</TableHead>
              <TableHead className="crm-muted text-xs uppercase tracking-wider text-right">Entreprises liées</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow className="border-[hsl(var(--crm-border))]">
                <TableCell colSpan={5} className="text-center py-8 crm-muted text-sm">
                  Aucun événement
                </TableCell>
              </TableRow>
            )}
            {events.map((e) => (
              <TableRow
                key={e.id}
                onClick={() => onSelect(e.id)}
                className="border-[hsl(var(--crm-border))] cursor-pointer hover:bg-[hsl(var(--crm-surface-2))]/50 transition-colors"
              >
                <TableCell className="text-[hsl(var(--crm-text))] crm-num">
                  {e.date_marche
                    ? format(new Date(e.date_marche), 'd MMM yyyy', { locale: fr })
                    : '—'}
                </TableCell>
                <TableCell className="text-[hsl(var(--crm-text))] font-medium">{e.title}</TableCell>
                <TableCell className="crm-muted text-xs">
                  {e.event_type ? (
                    <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--crm-surface-2))]">
                      {e.event_type}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="crm-muted">
                  {e.lieu ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {e.lieu}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full crm-surface-elevated text-xs">
                    <span className="crm-num text-[hsl(var(--crm-accent))] font-semibold">
                      {countsByEvent[e.id] || 0}
                    </span>
                    <span className="crm-muted">entreprises</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default CrmMarches;
