import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, MapPin, Loader2, List, Map as MapIcon, History, CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  latitude: number | null;
  longitude: number | null;
}

const typeColor = (t?: string | null) => {
  if (!t) return '#94a3b8';
  if (t.includes('agro')) return '#16a34a';
  if (t.includes('poet') || t.includes('poét')) return '#a855f7';
  if (t.includes('touris')) return '#06b6d4';
  return '#0d6b58';
};

const icon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

export const MarchesListTab: React.FC = () => {
  const [sub, setSub] = React.useState<'a-venir' | 'passees' | 'carte'>('a-venir');
  const [q, setQ] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['crm-marches-list'],
    queryFn: async (): Promise<MarcheEvent[]> => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('id, title, description, date_marche, lieu, event_type, is_public, latitude, longitude')
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
  const geoEvents = filtered.filter((e) => e.latitude && e.longitude);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un événement…"
            className="pl-9 bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))] placeholder:crm-muted"
          />
        </div>
      </div>

      <Tabs value={sub} onValueChange={(v) => setSub(v as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="a-venir" className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            À venir <span className="text-xs opacity-60">({upcoming.length})</span>
          </TabsTrigger>
          <TabsTrigger value="passees" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Passées <span className="text-xs opacity-60">({past.length})</span>
          </TabsTrigger>
          <TabsTrigger value="carte" className="gap-1.5">
            <MapIcon className="h-3.5 w-3.5" />
            Carte <span className="text-xs opacity-60">({geoEvents.length})</span>
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin crm-muted" />
          </div>
        ) : (
          <>
            <TabsContent value="a-venir" className="mt-4">
              <EventsTable events={upcoming} countsByEvent={countsByEvent} onSelect={setSelectedId} emptyLabel="Aucune marche à venir" />
            </TabsContent>
            <TabsContent value="passees" className="mt-4">
              <EventsTable events={past} countsByEvent={countsByEvent} onSelect={setSelectedId} emptyLabel="Aucune marche passée" muted />
            </TabsContent>
            <TabsContent value="carte" className="mt-4">
              <div className="rounded-xl overflow-hidden crm-surface" style={{ height: 'calc(100vh - 360px)', minHeight: 420 }}>
                <MapContainer
                  center={[46.6, 2.5]}
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  {geoEvents.map((e) => (
                    <Marker
                      key={e.id}
                      position={[e.latitude!, e.longitude!]}
                      icon={icon(typeColor(e.event_type))}
                      eventHandlers={{ click: () => setSelectedId(e.id) }}
                    >
                      <Tooltip direction="top" offset={[0, -8]}>
                        <div className="text-xs">
                          <div className="font-semibold">{e.title}</div>
                          {e.date_marche && <div>{format(new Date(e.date_marche), 'd MMM yyyy', { locale: fr })}</div>}
                          {e.lieu && <div className="opacity-70">{e.lieu}</div>}
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs crm-muted flex-wrap">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} /> Agroécologique</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#a855f7' }} /> Éco-poétique</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#06b6d4' }} /> Éco-tourisme</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#94a3b8' }} /> Autre</span>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      <MarcheDetailDrawer eventId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
};

const EventsTable: React.FC<{
  events: MarcheEvent[];
  countsByEvent: Record<string, number>;
  onSelect: (id: string) => void;
  emptyLabel: string;
  muted?: boolean;
}> = ({ events, countsByEvent, onSelect, emptyLabel, muted }) => (
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
            <TableCell colSpan={5} className="text-center py-8 crm-muted text-sm">{emptyLabel}</TableCell>
          </TableRow>
        )}
        {events.map((e) => (
          <TableRow
            key={e.id}
            onClick={() => onSelect(e.id)}
            className={`border-[hsl(var(--crm-border))] cursor-pointer hover:bg-[hsl(var(--crm-surface-2))]/50 transition-colors ${muted ? 'opacity-90' : ''}`}
          >
            <TableCell className="text-[hsl(var(--crm-text))] crm-num">
              {e.date_marche ? format(new Date(e.date_marche), 'd MMM yyyy', { locale: fr }) : '—'}
            </TableCell>
            <TableCell className="text-[hsl(var(--crm-text))] font-medium">{e.title}</TableCell>
            <TableCell className="crm-muted text-xs">
              {e.event_type ? (
                <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--crm-surface-2))]">{e.event_type}</span>
              ) : '—'}
            </TableCell>
            <TableCell className="crm-muted">
              {e.lieu ? (
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />{e.lieu}</span>
              ) : '—'}
            </TableCell>
            <TableCell className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full crm-surface-elevated text-xs">
                <span className="crm-num text-[hsl(var(--crm-accent))] font-semibold">{countsByEvent[e.id] || 0}</span>
                <span className="crm-muted">ent.</span>
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default MarchesListTab;
