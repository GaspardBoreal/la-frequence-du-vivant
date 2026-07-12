import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { ChevronDown, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CarteMdVEvent, SolVivantPoint } from '@/hooks/useCarteMdV';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import { useAuth } from '@/hooks/useAuth';


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TYPE_COLORS: Record<string, string> = {
  agroecologique: '#10b981',
  eco_poetique: '#a855f7',
  eco_tourisme: '#f59e0b',
};

const makeEventIcon = (type: string | null, size: number) => {
  const color = TYPE_COLORS[type ?? ''] ?? '#0d6b58';
  return new L.DivIcon({
    className: 'carte-mdv-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:${Math.max(10, size / 3)}px;font-weight:600;">🥾</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) map.setView(positions[0], 11);
    else map.fitBounds(L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1]))), {
      padding: [50, 50], maxZoom: 12,
    });
  }, [positions.length]); // eslint-disable-line
  return null;
};

interface Props {
  events: CarteMdVEvent[];
  solVivantPoints?: SolVivantPoint[];
  showSolVivant: boolean;
}

const MapView: React.FC<Props> = ({ events, solVivantPoints = [], showSolVivant }) => {
  const { user } = useAuth();
  const [legendOpen, setLegendOpen] = useState(true);
  const geoEvents = events.filter((e) => e.latitude != null && e.longitude != null);
  const missingCount = events.length - geoEvents.length;
  const positions: [number, number][] = geoEvents.map((e) => [Number(e.latitude), Number(e.longitude)]);

  const typeCounts = geoEvents.reduce<Record<string, number>>((acc, e) => {
    const k = e.event_type ?? 'autre';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const legendItems: { key: string; color: string; label: string; count: number }[] = [
    { key: 'agroecologique', color: '#10b981', label: 'Agroécologique', count: typeCounts.agroecologique ?? 0 },
    { key: 'eco_poetique', color: '#a855f7', label: 'Éco poétique', count: typeCounts.eco_poetique ?? 0 },
    { key: 'eco_tourisme', color: '#f59e0b', label: 'Éco tourisme', count: typeCounts.eco_tourisme ?? 0 },
  ].filter((it) => it.count > 0);


  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div className="px-4 py-2 text-xs bg-muted/40 border-b border-border flex items-center justify-between gap-2">
        <span>
          <strong>{geoEvents.length}</strong> événement{geoEvents.length > 1 ? 's' : ''} géolocalisé{geoEvents.length > 1 ? 's' : ''} sur {events.length}
        </span>
        {missingCount > 0 && (
          <span className="text-muted-foreground">
            {missingCount} sans coordonnées — visibles dans les autres vues
          </span>
        )}
      </div>
      <div className="h-[70vh] min-h-[500px]">
        <MapContainer center={[46.6, 2.5]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />


          {showSolVivant && solVivantPoints.map((p) => (
            <CircleMarker
              key={`sv-${p.id}`}
              center={[Number(p.latitude), Number(p.longitude)]}
              radius={5}
              pathOptions={{ color: '#84cc16', fillColor: '#84cc16', fillOpacity: 0.6, weight: 1 }}
            >
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <p className="font-semibold text-sm">{p.name}</p>
                  {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                  {p.street_address && <p className="text-xs text-muted-foreground">{p.street_address}</p>}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-primary hover:underline">Site web →</a>
                  )}
                  <p className="text-[10px] text-muted-foreground pt-1 border-t mt-1">
                    Source : Carte Sol Vivant (ODbL)
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {geoEvents.map((e) => {
            const meta = getMarcheEventTypeMeta(e.event_type);
            const size = Math.min(48, 24 + Math.floor((e.species_count ?? 0) / 5));
            const detailUrl = e.is_public && e.public_slug ? `/m/${e.public_slug}` : `/admin/marche-events/${e.id}`;
            const inscriptionUrl = user ? detailUrl : `/marches-du-vivant/connexion?next=${encodeURIComponent(detailUrl)}`;
            const isUpcoming = new Date(e.date_marche).getTime() > Date.now();
            return (
              <Marker key={e.id} position={[Number(e.latitude), Number(e.longitude)]} icon={makeEventIcon(e.event_type, size)}>
                <Popup maxWidth={280}>
                  <div className="space-y-2 min-w-[220px]">
                    {e.cover_image_url && (
                      <img src={e.cover_image_url} alt="" className="w-full h-24 object-cover rounded" />
                    )}
                    <p className="font-semibold text-sm leading-tight">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.date_marche), 'PPP', { locale: fr })}
                    </p>
                    {e.lieu && <p className="text-xs">📍 {e.lieu}</p>}
                    <div className="flex flex-wrap gap-1">
                      {meta && <Badge className={`text-[10px] ${meta.badgeClassName}`}>{meta.shortLabel}</Badge>}
                      {e.species_count > 0 && (
                        <Badge variant="outline" className="text-[10px]">🌿 {e.species_count} esp.</Badge>
                      )}
                    </div>
                    {isUpcoming ? (
                      <Button asChild size="sm" className="w-full mt-1">
                        <Link to={inscriptionUrl}>
                          {user ? "S'inscrire" : 'Créer mon compte pour rejoindre'}
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="w-full mt-1">
                        <Link to={detailUrl}>Découvrir</Link>
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      {showSolVivant && solVivantPoints.length > 0 && (
        <div className="px-4 py-2 text-xs bg-muted/40 border-t border-border flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-lime-500" />
          {solVivantPoints.length} partenaires{' '}
          <a href="https://cartesolvivant.gogocarto.fr" target="_blank" rel="noopener noreferrer"
             className="text-primary hover:underline">Carte Sol Vivant</a>
          {' '}affichés
        </div>
      )}
    </div>
  );
};

export default MapView;
