import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarcheEventsAll, type EventsFilters } from '@/hooks/useMarcheEventsQuery';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const eventIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="#10b981" stroke="#065f46" stroke-width="2"/><circle cx="16" cy="15" r="6" fill="#fff"/></svg>`),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1]))), {
        padding: [40, 40],
        maxZoom: 14,
      });
    }
  }, [positions, map]);
  return null;
};

const EventsMapTab: React.FC<{ filters: EventsFilters; active: boolean }> = ({ filters, active }) => {
  const { data: events = [], isLoading } = useMarcheEventsAll(filters, active);
  const valid = events.filter((e) => e.latitude != null && e.longitude != null);
  const positions: [number, number][] = valid.map((e) => [Number(e.latitude), Number(e.longitude)]);

  if (isLoading) {
    return <Card className="p-4"><div className="h-[500px] animate-pulse bg-muted rounded" /></Card>;
  }

  if (valid.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="font-medium">Aucun événement géolocalisé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Aucun des {events.length} événement(s) filtré(s) ne possède de coordonnées GPS.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
        {valid.length} événement(s) géolocalisé(s) sur {events.length}
      </div>
      <div className="h-[60vh] min-h-[400px]">
        <MapContainer center={[46.6, 2.5]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />
          {valid.map((e) => {
            const meta = getMarcheEventTypeMeta(e.event_type);
            return (
              <Marker key={e.id} position={[Number(e.latitude), Number(e.longitude)]} icon={eventIcon}>
                <Popup>
                  <div className="space-y-1 min-w-[180px]">
                    <p className="font-semibold text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.date_marche), 'PPP', { locale: fr })}
                    </p>
                    {e.lieu && <p className="text-xs">📍 {e.lieu}</p>}
                    {meta && <p className="text-xs">🏷️ {meta.shortLabel}</p>}
                    {e.exploration_name && <p className="text-xs">🧭 {e.exploration_name}</p>}
                    <a
                      href={`/admin/marche-events/${e.id}`}
                      className="text-xs text-primary underline mt-1 inline-block"
                    >
                      Ouvrir →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </Card>
  );
};

export default EventsMapTab;
