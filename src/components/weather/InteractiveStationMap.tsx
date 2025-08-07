import React, { useEffect, useRef } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { correctStationCoordinates, hasStationCorrection } from '../../utils/weatherStationCorrections';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône personnalisée pour la station météorologique
const stationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="3"/>
      <circle cx="16" cy="16" r="6" fill="#ffffff"/>
      <circle cx="16" cy="16" r="3" fill="#dc2626"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface InteractiveStationMapProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  stationName: string;
}

const InteractiveStationMap: React.FC<InteractiveStationMapProps> = ({
  coordinates,
  stationName
}) => {
  // Debug des coordonnées reçues
  console.log('InteractiveStationMap - Coordonnées reçues:', coordinates);
  console.log('InteractiveStationMap - Station:', stationName);
  
  // Utilisation du service de correction des coordonnées
  const correctCoordinates = correctStationCoordinates(stationName, coordinates);
  const hasCorrectionApplied = hasStationCorrection(stationName);
    
  console.log('InteractiveStationMap - Coordonnées utilisées:', correctCoordinates);
  if (hasCorrectionApplied) {
    console.log('⚠️ Correction appliquée pour la station:', stationName);
  }

  // Fonction pour ouvrir Google Street View à cette position
  const openInStreetView = () => {
    const url = `https://www.google.com/maps/@${correctCoordinates.lat},${correctCoordinates.lng},21z/data=!3m1!1e3`;
    window.open(url, '_blank');
  };

  return (
    <div className="mt-4 h-64 bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden relative shadow-inner">
      <MapContainer
        center={[correctCoordinates.lat, correctCoordinates.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <Marker 
          position={[correctCoordinates.lat, correctCoordinates.lng]}
          icon={stationIcon}
        >
          <Popup>
            <div className="text-center p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <strong className="text-gray-800">Station Météorologique</strong>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-semibold text-gray-700">{stationName}</p>
                <p className="text-gray-600 text-xs">
                  📍 {correctCoordinates.lat.toFixed(4)}°, {correctCoordinates.lng.toFixed(4)}°
                </p>
                <p className="text-gray-500 text-xs">
                  🌡️ Données météorologiques en temps réel
                </p>
                <button
                  onClick={openInStreetView}
                  className="flex items-center gap-2 justify-center w-full mt-3 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <ExternalLink className="h-3 w-3" />
                  Voir dans Street View
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Info overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200 pointer-events-none">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-xs font-semibold text-gray-800">{stationName}</p>
            <p className="text-xs text-gray-600">
              {correctCoordinates.lat.toFixed(4)}°, {correctCoordinates.lng.toFixed(4)}°
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveStationMap;