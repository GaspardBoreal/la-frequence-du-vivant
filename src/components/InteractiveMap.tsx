
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { SearchResult, LayerConfig, SelectedParcel } from '../types';
import { fetchMarchesTechnoSensibles, MarcheTechnoSensible } from '../utils/googleSheetsApi';
import PoeticMarkerCard from './PoeticMarkerCard';

// Fix pour les marqueurs par défaut
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Composant pour gérer les événements de la carte
const MapEventHandler = ({ onMapReady }: { onMapReady: () => void }) => {
  const map = useMapEvents({
    whenReady: () => {
      console.log('🗺️ Carte prête');
      onMapReady();
    },
    moveend: () => {
      console.log('🗺️ Mouvement terminé');
    }
  });
  
  return null;
};

// Création d'icônes personnalisées pour les marqueurs poétiques
const createPoeticIcon = (theme: RegionalTheme) => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
        border: 2px solid white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        animation: pulse 2s infinite;
      ">
        <div style="
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">🌱</div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    className: 'poetic-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

interface InteractiveMapProps {
  searchResult: SearchResult | null;
  layers: LayerConfig;
  theme: RegionalTheme;
  onParcelClick: (parcel: SelectedParcel) => void;
  filteredMarchesData: MarcheTechnoSensible[];
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  searchResult, 
  layers, 
  theme, 
  onParcelClick,
  filteredMarchesData 
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.603354, 1.888334]);
  const [zoom, setZoom] = useState(6);
  const [mapReady, setMapReady] = useState(false);

  // Valider les coordonnées des données filtrées
  const validMarchesData = filteredMarchesData.filter(marche => {
    const isValid = marche.latitude && marche.longitude && 
                    marche.latitude >= -90 && marche.latitude <= 90 &&
                    marche.longitude >= -180 && marche.longitude <= 180;
    
    if (!isValid) {
      console.log(`❌ Marche invalide ignorée:`, marche);
    }
    
    return isValid;
  });

  console.log(`📍 ${validMarchesData.length} marches valides à afficher sur ${filteredMarchesData.length} total`);

  useEffect(() => {
    if (searchResult?.coordinates) {
      console.log('🎯 Centrage sur:', searchResult.coordinates);
      setMapCenter(searchResult.coordinates);
      setZoom(15);
    }
  }, [searchResult]);

  const poeticIcon = createPoeticIcon(theme);

  const handleMapReady = () => {
    console.log('🗺️ Carte prête pour affichage des marqueurs');
    setMapReady(true);
  };

  return (
    <div className="relative h-96 md:h-[500px] lg:h-[600px]">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        key={`${mapCenter[0]}-${mapCenter[1]}`}
        whenReady={() => console.log('🗺️ MapContainer prêt')}
      >
        <MapEventHandler onMapReady={handleMapReady} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {searchResult && (
          <Marker 
            position={searchResult.coordinates}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">Point de recherche</h3>
                <p className="text-xs text-gray-600">{searchResult.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordonnées: {searchResult.coordinates[0].toFixed(6)}, {searchResult.coordinates[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marqueurs des Marches TechnoSensibles - affichage seulement si la carte est prête */}
        {layers.marchesTechnoSensibles && mapReady && validMarchesData.map((marche, index) => {
          console.log(`📍 Affichage marqueur ${index + 1}:`, marche.ville, marche.latitude, marche.longitude);
          
          return (
            <Marker 
              key={`marche-${index}-${marche.ville}`}
              position={[marche.latitude, marche.longitude]}
              icon={poeticIcon}
            >
              <Popup 
                maxWidth={400}
                className="poetic-popup"
              >
                <div className="p-0 m-0">
                  <PoeticMarkerCard marche={marche} theme={theme} />
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
      
      {/* Indicateur du nombre de résultats avec style poétique */}
      {layers.marchesTechnoSensibles && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-purple-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {validMarchesData.length}
              </span> marche{validMarchesData.length !== 1 ? 's' : ''} révélée{validMarchesData.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
