import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ExternalLink } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const marcheIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="#22c55e" stroke="#166534" stroke-width="2"/>
      <circle cx="16" cy="15" r="7" fill="#ffffff"/>
      <circle cx="16" cy="15" r="4" fill="#22c55e"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

interface FitBoundsProps {
  positions: [number, number][];
}

const FitBounds: React.FC<FitBoundsProps> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);
  return null;
};

interface MarcheMapViewProps {
  marches: MarcheTechnoSensible[];
}

const MarcheMapView: React.FC<MarcheMapViewProps> = ({ marches }) => {
  const validMarches = marches.filter(
    m => m.latitude && m.longitude && m.latitude !== 0 && m.longitude !== 0
  );

  const positions: [number, number][] = validMarches.map(m => [m.latitude, m.longitude]);

  if (validMarches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <MapPin className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Aucune marche avec coordonnées GPS</p>
        <p className="text-sm">Les marches filtrées n'ont pas de coordonnées géographiques renseignées.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {validMarches.length} marche{validMarches.length > 1 ? 's' : ''} localisée{validMarches.length > 1 ? 's' : ''} sur {marches.length} au total
        </p>
      </div>
      <div className="h-[600px] rounded-xl overflow-hidden border-2 border-border shadow-lg">
        <MapContainer
          center={[46.6, 2.5]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FitBounds positions={positions} />
          {validMarches.map(marche => (
            <Marker
              key={marche.id}
              position={[marche.latitude, marche.longitude]}
              icon={marcheIcon}
            >
              <Popup>
                <div className="min-w-[220px] p-1">
                  <h3 className="font-bold text-gray-800 text-sm mb-1">
                    {marche.nomMarche || marche.ville}
                  </h3>
                  {marche.nomMarche && (
                    <p className="text-xs text-gray-600 mb-1">📍 {marche.ville}{marche.departement ? ` (${marche.departement})` : ''}</p>
                  )}
                  {marche.date && (
                    <p className="text-xs text-gray-500 mb-2">📅 {marche.date}</p>
                  )}
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                    <a
                      href={`https://www.google.com/maps?q=${marche.latitude},${marche.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Maps
                    </a>
                    <a
                      href={`https://earth.google.com/web/@${marche.latitude},${marche.longitude},500a,1000d,35y,0h,0t,0r`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded hover:bg-green-100 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Earth
                    </a>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${marche.latitude}&mlon=${marche.longitude}#map=15/${marche.latitude}/${marche.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded hover:bg-orange-100 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      OSM
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MarcheMapView;
