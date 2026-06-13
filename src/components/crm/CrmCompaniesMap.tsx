import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STAGE_MARKER_COLOR, type CrmCompany, type CrmCompanyStage } from '@/types/crmCompany';

const FitBounds: React.FC<{ points: Array<{ lat: number; lng: number }> }> = ({ points }) => {
  const map = useMap();
  const key = points.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
  React.useEffect(() => {
    if (points.length === 0) {
      map.setView([46.6, 2.5], 5);
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
};


function buildIcon(color: string, ring?: boolean) {
  const html = `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 ${ring ? '3px' : '1px'} ${color}80;"></div>`;
  return L.divIcon({ className: 'crm-marker', html, iconSize: [22, 22], iconAnchor: [11, 11] });
}

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  stage?: CrmCompanyStage;
  onClick?: () => void;
}

export const CrmCompaniesMap: React.FC<{
  companies: Array<CrmCompany | MapPoint>;
  height?: number | string;
  onSelect?: (id: string) => void;
}> = ({ companies, height = 480, onSelect }) => {
  const points: MapPoint[] = React.useMemo(() => {
    return companies
      .map((c: any) => {
        if (c.lat != null && c.lng != null) return c as MapPoint;
        if (c.latitude != null && c.longitude != null) {
          return {
            id: c.id,
            lat: c.latitude,
            lng: c.longitude,
            title: c.denomination ?? c.nom_complet ?? c.siren,
            subtitle: c.ville ?? undefined,
            stage: c.lifecycle_stage as CrmCompanyStage | undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as MapPoint[];
  }, [companies]);

  const center: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [46.6, 2.5];

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer center={[46.6, 2.5]} zoom={5} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />

        {points.map(p => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={buildIcon(p.stage ? STAGE_MARKER_COLOR[p.stage] : '#0ea5e9', !!p.stage)}
            eventHandlers={{ click: () => onSelect?.(p.id) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{p.title}</p>
                {p.subtitle && <p className="text-xs text-muted-foreground">{p.subtitle}</p>}
                {onSelect && (
                  <button className="mt-1 text-xs underline text-primary" onClick={() => onSelect(p.id)}>
                    Ouvrir la fiche
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
