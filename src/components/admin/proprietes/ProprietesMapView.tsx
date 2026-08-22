import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Marker, Popup, useMap } from 'react-leaflet';
import { MapPinOff, ExternalLink, RadioTower } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import SafeMapContainer from '@/components/maps/SafeMapContainer';
import { DynamicTileLayer, MapStyleToggle, type MapStyle } from '@/components/maps';
import { Badge } from '@/components/ui/badge';
import type { ProprieteListRow } from './types';
import { formatSurface } from './types';

const makeIcon = (archived: boolean) =>
  L.divIcon({
    className: 'propriete-marker',
    html: `<div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: ${archived ? '#9ca3af' : 'linear-gradient(135deg,#10b981,#059669)'};
      border: 2.5px solid rgba(255,255,255,0.9);
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });

const iconActive = makeIcon(false);
const iconArchived = makeIcon(true);

/** Ajuste le zoom sur les résultats filtrés. */
const FitToRows: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points.map(([la, ln]) => L.latLng(la, ln))), { padding: [40, 40] });
  }, [points, map]);
  return null;
};

interface Props {
  rows: ProprieteListRow[];
  sondesCount: Record<string, number>;
}

const ProprietesMapView: React.FC<Props> = ({ rows, sondesCount }) => {
  const [mapStyle, setMapStyle] = useState<MapStyle>('geopoetic');

  const located = useMemo(
    () => rows.filter((r) => r.latitude != null && r.longitude != null),
    [rows],
  );
  const unlocated = useMemo(
    () => rows.filter((r) => r.latitude == null || r.longitude == null),
    [rows],
  );
  const points = useMemo(
    () => located.map((r) => [r.latitude as number, r.longitude as number] as [number, number]),
    [located],
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-border">
        <SafeMapContainer
          center={[46.6, 2.4]}
          zoom={5}
          className="h-[420px] w-full sm:h-[560px]"
          scrollWheelZoom
        >
          <DynamicTileLayer mapStyle={mapStyle} />
          <FitToRows points={points} />
          {located.map((p) => (
            <Marker
              key={p.id}
              position={[p.latitude as number, p.longitude as number]}
              icon={p.is_active ? iconActive : iconArchived}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1">
                  <div className="font-semibold text-sm">{p.nom}</div>
                  <div className="text-xs text-gray-600">
                    {[p.code_postal, p.ville].filter(Boolean).join(' ') || 'Lieu non renseigné'}
                    {p.surface_hectares != null && ` · ${formatSurface(p.surface_hectares)}`}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {p.is_active ? 'Active' : 'Archivée'}
                    </Badge>
                    {(sondesCount[p.id] ?? 0) > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        <RadioTower className="mr-1 h-3 w-3" />
                        {sondesCount[p.id]} sonde{sondesCount[p.id] > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <Link
                    to={`/admin/proprietes/${p.id}`}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 underline"
                  >
                    Ouvrir la fiche <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </SafeMapContainer>
        <MapStyleToggle mapStyle={mapStyle} onChange={setMapStyle} compact position="top-right" />
      </div>

      {unlocated.length > 0 && (
        <aside className="w-full shrink-0 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3 lg:w-72">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPinOff className="h-4 w-4 text-amber-500" />
            À localiser ({unlocated.length})
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ces propriétés n'ont pas de coordonnées GPS — ouvrez leur fiche pour les positionner.
          </p>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto lg:max-h-[480px]">
            {unlocated.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/admin/proprietes/${p.id}`}
                  className="block rounded-md px-2 py-1.5 text-xs hover:bg-background/60"
                >
                  <span className="font-medium">{p.nom}</span>
                  <span className="block text-muted-foreground">
                    {[p.code_postal, p.ville].filter(Boolean).join(' ') || '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
};

export default ProprietesMapView;
