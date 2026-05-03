import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Move } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import CadastreLayer from './CadastreLayer';
import GpsEditOverlay from './GpsEditOverlay';
import { useCanCurateAudio } from '@/hooks/useCanCurateAudio';

// Fix Leaflet default markers (idempotent)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CadastreMapStandaloneProps {
  latitude: number;
  longitude: number;
  pointId: string;
  className?: string;
  showCadastreOverlay?: boolean;
}

function CadastreTileOverlay() {
  const map = useMap();
  React.useEffect(() => {
    const overlay = L.tileLayer('https://cadastre.data.gouv.fr/map/{z}/{x}/{y}.png', {
      attribution: '&copy; Etalab — Cadastre',
      opacity: 0.55,
      maxZoom: 20,
    });
    overlay.addTo(map);
    return () => { map.removeLayer(overlay); };
  }, [map]);
  return null;
}

const CadastreMapStandalone: React.FC<CadastreMapStandaloneProps> = ({
  latitude,
  longitude,
  pointId,
  className = 'w-full h-[500px]',
  showCadastreOverlay = true,
}) => {
  const { data: canEditGps = false } = useCanCurateAudio();
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{ lat: number; lng: number; geometry: any; data: any } | null>(null);

  return (
    <div className={`${className} relative rounded-xl overflow-hidden border border-gray-200 shadow-lg`}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={17}
        className="w-full h-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        {showCadastreOverlay && <CadastreTileOverlay />}
        <CadastreLayer
          points={[{ id: pointId, lat: latitude, lng: longitude }]}
          previewGeometry={preview?.geometry}
          previewData={preview?.data}
        />
        {!editing && <Marker position={[latitude, longitude]} />}
        {editing && canEditGps && (
          <GpsEditOverlay
            initialLat={latitude}
            initialLng={longitude}
            onClose={() => { setEditing(false); setPreview(null); }}
            onPreview={setPreview}
          />
        )}
      </MapContainer>

      {canEditGps && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium shadow-lg"
        >
          <Move className="w-3.5 h-3.5" />
          Repositionner
        </button>
      )}

      <div className="absolute top-3 right-3 z-[999] bg-white/85 backdrop-blur rounded-md px-2.5 py-1 text-[11px] text-gray-700 shadow flex items-center gap-1.5">
        <MapPin className="w-3 h-3 text-emerald-600" /> Carte cadastrale LEXICON
      </div>
    </div>
  );
};

export default CadastreMapStandalone;
