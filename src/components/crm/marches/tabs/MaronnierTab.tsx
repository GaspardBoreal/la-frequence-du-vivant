import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Search, Calendar, MapPin, ExternalLink, Map as MapIcon, List as ListIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

interface MaronnierEvent {
  id: string;
  nom: string;
  date_debut: string;
  date_fin: string | null;
  lieu: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
  site_url: string | null;
  description: string | null;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  salon_b2b: { label: 'Salon B2B', color: '#0d6b58' },
  sommet: { label: 'Sommet / Congrès', color: '#dc2626' },
  festival: { label: 'Festival / Nature', color: '#a855f7' },
  b2c: { label: 'Grand public / B2C', color: '#06b6d4' },
};

const colorOf = (t: string) => TYPE_LABEL[t]?.color || '#94a3b8';
const labelOf = (t: string) => TYPE_LABEL[t]?.label || t;

const icon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

export const MaronnierTab: React.FC = () => {
  const [view, setView] = React.useState<'liste' | 'carte'>('liste');
  const [q, setQ] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [periode, setPeriode] = React.useState<'all' | 'a_venir' | '2026' | '2027'>('a_venir');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['crm-maronnier'],
    queryFn: async (): Promise<MaronnierEvent[]> => {
      const { data, error } = await supabase
        .from('crm_maronnier_events' as any)
        .select('*')
        .order('date_debut', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as MaronnierEvent[];
    },
  });

  const filtered = React.useMemo(() => {
    let r = events;
    const now = new Date();
    if (periode === 'a_venir') r = r.filter((e) => new Date(e.date_debut) >= now);
    else if (periode === '2026') r = r.filter((e) => e.date_debut.startsWith('2026'));
    else if (periode === '2027') r = r.filter((e) => e.date_debut.startsWith('2027'));
    if (typeFilter !== 'all') r = r.filter((e) => e.type === typeFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter(
        (e) =>
          e.nom.toLowerCase().includes(s) ||
          e.lieu?.toLowerCase().includes(s) ||
          e.region?.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s)
      );
    }
    return r;
  }, [events, q, typeFilter, periode]);

  const geoEvents = filtered.filter((e) => e.latitude && e.longitude);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un événement, lieu, région…"
            className="pl-9 bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="salon_b2b">Salon B2B</SelectItem>
            <SelectItem value="sommet">Sommet / Congrès</SelectItem>
            <SelectItem value="festival">Festival / Nature</SelectItem>
            <SelectItem value="b2c">Grand public / B2C</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periode} onValueChange={(v) => setPeriode(v as any)}>
          <SelectTrigger className="w-[160px] bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a_venir">À venir</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2027">2027</SelectItem>
            <SelectItem value="all">Tout</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs crm-muted ml-auto">{filtered.length} événement{filtered.length > 1 ? 's' : ''}</span>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid grid-cols-2 max-w-[280px]">
          <TabsTrigger value="liste" className="gap-1.5"><ListIcon className="h-3.5 w-3.5" /> Liste</TabsTrigger>
          <TabsTrigger value="carte" className="gap-1.5"><MapIcon className="h-3.5 w-3.5" /> Carte</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin crm-muted" /></div>
        ) : (
          <>
            <TabsContent value="liste" className="mt-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 crm-muted text-sm">Aucun événement</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((e) => (
                    <article key={e.id} className="rounded-xl crm-surface border border-[hsl(var(--crm-border))] p-4 space-y-3 hover:border-[hsl(var(--crm-accent))]/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold" style={{ background: colorOf(e.type) + '22', color: colorOf(e.type) }}>{labelOf(e.type)}</span>
                        <span className="text-xs crm-muted">{format(new Date(e.date_debut), 'd MMM yyyy', { locale: fr })}</span>
                      </div>
                      <h3 className="font-semibold text-[hsl(var(--crm-text))] leading-tight">{e.nom}</h3>
                      <div className="space-y-1 text-xs crm-muted">
                        {e.lieu && <div className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.lieu}{e.region ? ` · ${e.region}` : ''}</div>}
                        {e.date_fin && e.date_fin !== e.date_debut && (
                          <div className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Jusqu'au {format(new Date(e.date_fin), 'd MMM yyyy', { locale: fr })}</div>
                        )}
                      </div>
                      {e.description && <p className="text-xs text-[hsl(var(--crm-text))]/80 line-clamp-3">{e.description}</p>}
                      {e.site_url && (
                        <Button asChild variant="outline" size="sm" className="w-full h-7 text-xs">
                          <a href={e.site_url} target="_blank" rel="noopener noreferrer">
                            Site officiel <ExternalLink className="h-3 w-3 ml-1.5" />
                          </a>
                        </Button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="carte" className="mt-4">
              <div className="rounded-xl overflow-hidden crm-surface" style={{ height: 'calc(100vh - 400px)', minHeight: 420 }}>
                <MapContainer center={[46.6, 2.5]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  {geoEvents.map((e) => (
                    <Marker key={e.id} position={[e.latitude!, e.longitude!]} icon={icon(colorOf(e.type))}>
                      <Tooltip direction="top" offset={[0, -8]}>
                        <div className="text-xs">
                          <div className="font-semibold">{e.nom}</div>
                          <div>{format(new Date(e.date_debut), 'd MMM yyyy', { locale: fr })}</div>
                          {e.lieu && <div className="opacity-70">{e.lieu}</div>}
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs crm-muted flex-wrap">
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: v.color }} /> {v.label}</span>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default MaronnierTab;
