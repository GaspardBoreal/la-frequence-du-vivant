import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { SearchResult, LayerConfig, SelectedParcel } from '../types';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import PoeticMarkerCard from './PoeticMarkerCard';
import BioacousticTooltip from './BioacousticTooltip';

// Fix pour les marqueurs par défaut
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Composant pour gérer le zoom dynamique
const DynamicZoomController = ({ 
  validMarchesData, 
  searchResult 
}: { 
  validMarchesData: MarcheTechnoSensible[];
  searchResult: SearchResult | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Si on a un résultat de recherche, utiliser ces coordonnées
    if (searchResult?.coordinates) {
      console.log('🎯 Centrage sur résultat de recherche:', searchResult.coordinates);
      map.setView(searchResult.coordinates, 15);
      return;
    }

    // Si on a des données de marches filtrées, calculer les bounds
    if (validMarchesData && validMarchesData.length > 0) {
      console.log(`📊 Calcul des bounds pour ${validMarchesData.length} marches`);
      
      // Log détaillé pour BONZAC
      const bonzacData = validMarchesData.filter(marche => marche.ville === 'BONZAC');
      if (bonzacData.length > 0) {
        console.log('🏘️ Données BONZAC pour zoom:', bonzacData.map(m => ({
          ville: m.ville,
          lat: m.latitude,
          lng: m.longitude,
          isValid: m.latitude !== 0 && m.longitude !== 0
        })));
      }
      
      if (validMarchesData.length === 1) {
        // Un seul point : centrer avec zoom élevé
        const marche = validMarchesData[0];
        console.log('📍 Centrage sur marche unique:', marche.ville, marche.latitude, marche.longitude);
        map.setView([marche.latitude, marche.longitude], 12);
      } else {
        // Plusieurs points : calculer les bounds
        const latLngs = validMarchesData.map(marche => {
          console.log(`📍 Point pour bounds: ${marche.ville} [${marche.latitude}, ${marche.longitude}]`);
          return [marche.latitude, marche.longitude] as [number, number];
        });
        
        const bounds = L.latLngBounds(latLngs);
        
        console.log('📐 Bounds calculés:', bounds);
        
        // Ajouter un padding pour éviter que les marqueurs touchent les bords
        const paddingOptions = {
          paddingTopLeft: [20, 20] as [number, number],
          paddingBottomRight: [20, 20] as [number, number],
          maxZoom: 10 // Éviter un zoom trop élevé même pour des points proches
        };
        
        map.fitBounds(bounds, paddingOptions);
      }
    } else {
      // Aucun point ou pas de filtre : vue par défaut sur la France
      console.log('🗺️ Retour à la vue par défaut (France)');
      map.setView([46.603354, 1.888334], 6);
    }
  }, [map, validMarchesData, searchResult]);

  return null;
};

// Composant pour gérer les événements de la carte
const MapEventHandler = ({ onMapReady }: { onMapReady: () => void }) => {
  const map = useMapEvents({
    moveend: () => {
      console.log('🗺️ Mouvement terminé');
      onMapReady();
    }
  });
  
  useEffect(() => {
    console.log('🗺️ Carte prête via useEffect');
    onMapReady();
  }, [onMapReady]);
  
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
  tooltipMode?: 'bioacoustic' | 'default';
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  searchResult, 
  layers, 
  theme, 
  onParcelClick,
  filteredMarchesData,
  tooltipMode = 'default'
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState<MarcheTechnoSensible | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Valider les coordonnées des données filtrées avec logs détaillés
  const validMarchesData = filteredMarchesData.filter(marche => {
    const latValid = marche.latitude && marche.latitude >= -90 && marche.latitude <= 90;
    const lngValid = marche.longitude && marche.longitude >= -180 && marche.longitude <= 180;
    const isValid = latValid && lngValid && marche.latitude !== 0 && marche.longitude !== 0;
    
    // Log spécial pour BONZAC
    if (marche.ville === 'BONZAC') {
      console.log(`🔍 Validation marqueur BONZAC:`, {
        ville: marche.ville,
        latitude: marche.latitude,
        longitude: marche.longitude,
        latValid,
        lngValid,
        isValid,
        adresse: marche.adresse
      });
    }
    
    if (!isValid) {
      console.log(`❌ Marche invalide ignorée:`, {
        ville: marche.ville,
        lat: marche.latitude,
        lng: marche.longitude,
        latValid,
        lngValid
      });
    }
    
    return isValid;
  });

  console.log(`📍 ${validMarchesData.length} marches valides à afficher sur ${filteredMarchesData.length} total`);
  
  // Log spécifique pour BONZAC
  const bonzacMarkers = validMarchesData.filter(m => m.ville === 'BONZAC');
  console.log(`🏘️ Marqueurs BONZAC valides à afficher:`, bonzacMarkers.length, bonzacMarkers);

  // Stable map key - ne pas recréer la carte à chaque changement de données
  useEffect(() => {
    console.log('🔄 Données filtrées changées - marqueurs mis à jour sans recréer la carte');
  }, [filteredMarchesData]);

  const poeticIcon = createPoeticIcon(theme);

  const handleMapReady = () => {
    console.log('🗺️ Carte prête pour affichage des marqueurs');
    setMapReady(true);
  };

  // Calculer le centre et zoom par défaut
  const defaultCenter: [number, number] = [46.603354, 1.888334];
  const defaultZoom = 6;

  const handleMarkerClick = (marche: MarcheTechnoSensible) => {
    const parcel: SelectedParcel = {
      id: `marche-${marche.ville}-${marche.nomMarche || marche.ville}`,
      type: 'marche',
      coordinates: [marche.latitude, marche.longitude],
      data: marche,
      name: marche.nomMarche || marche.ville,
      description: marche.descriptifCourt,
      location: marche.ville,
      imageUrls: marche.photos || []
    };
    
    onParcelClick(parcel);
  };

  const handleMarkerMouseEnter = (marche: MarcheTechnoSensible, event: any) => {
    if (tooltipMode === 'bioacoustic') {
      setHoveredMarker(marche);
      setMousePosition({ 
        x: event.originalEvent.clientX, 
        y: event.originalEvent.clientY 
      });
    }
  };

  const handleMarkerMouseLeave = () => {
    if (tooltipMode === 'bioacoustic') {
      setHoveredMarker(null);
    }
  };

  return (
    <div className="relative h-96 md:h-[500px] lg:h-[600px]">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        key={mapKey}
      >
        <MapEventHandler onMapReady={handleMapReady} />
        <DynamicZoomController 
          validMarchesData={validMarchesData} 
          searchResult={searchResult}
        />
        
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

        {/* Marqueurs des Marches TechnoSensibles */}
        {layers.marchesTechnoSensibles && validMarchesData.map((marche, index) => {
          const markerKey = `marche-${index}-${marche.ville}-${marche.latitude}-${marche.longitude}`;
          
          console.log(`📍 Affichage marqueur ${index + 1}:`, {
            ville: marche.ville,
            latitude: marche.latitude,
            longitude: marche.longitude,
            key: markerKey
          });
          
          // Log spécial pour BONZAC
          if (marche.ville === 'BONZAC') {
            console.log(`🏘️ Création marqueur BONZAC:`, {
              position: [marche.latitude, marche.longitude],
              theme: marche.theme,
              adresse: marche.adresse
            });
          }
          
          return (
            <Marker 
              key={markerKey}
              position={[marche.latitude, marche.longitude]}
              icon={poeticIcon}
              eventHandlers={{
                click: () => handleMarkerClick(marche),
                mouseover: (e) => handleMarkerMouseEnter(marche, e),
                mouseout: handleMarkerMouseLeave
              }}
            >
              {tooltipMode !== 'bioacoustic' && (
                <Popup 
                  maxWidth={400}
                  className="poetic-popup"
                >
                  <div className="p-0 m-0">
                    <PoeticMarkerCard marche={marche} theme={theme} />
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

      </MapContainer>
      
      {/* Bioacoustic tooltip - rendered outside map container for proper positioning */}
      {tooltipMode === 'bioacoustic' && hoveredMarker && (
        <BioacousticTooltip
          marche={hoveredMarker}
          position={mousePosition}
          visible={!!hoveredMarker}
        />
      )}
      
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
