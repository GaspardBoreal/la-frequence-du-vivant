import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { SearchResult, LayerConfig, SelectedParcel } from '../types';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import PoeticMarkerCard from './PoeticMarkerCard';
import { BioacousticTooltipSimple } from './BioacousticTooltipSimple';
import { useIsMobile } from '../hooks/use-mobile';

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
const MapEventHandler = ({ 
  onMapReady, 
  onMapClick 
}: { 
  onMapReady: () => void;
  onMapClick: () => void;
}) => {
  const map = useMapEvents({
    moveend: () => {
      console.log('🗺️ Mouvement terminé');
      onMapReady();
    },
    click: () => {
      onMapClick();
    }
  });
  
  useEffect(() => {
    console.log('🗺️ Carte prête via useEffect');
    onMapReady();
  }, [onMapReady]);
  
  return null;
};

// Création d'icônes personnalisées pour les marqueurs poétiques
const createPoeticIcon = (theme: RegionalTheme, isActive = false, isMobile = false) => {
  const size = isActive && isMobile ? 32 : 24;
  const scale = isActive && isMobile ? 'scale(1.2)' : 'scale(1)';
  const animation = isActive && isMobile ? 'pulse 1s infinite, glow 2s infinite' : 'pulse 2s infinite';
  
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
        border: ${isActive && isMobile ? '3px solid #fff' : '2px solid white'};
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${isActive && isMobile ? '0 6px 16px rgba(0,0,0,0.3), 0 0 20px rgba(168, 85, 247, 0.4)' : '0 4px 8px rgba(0,0,0,0.2)'};
        animation: ${animation};
        transform: ${scale};
        transition: all 0.3s ease;
      ">
        <div style="
          color: white;
          font-size: ${isMobile && isActive ? '16px' : '12px'};
          font-weight: bold;
        ">🌱</div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: ${scale}; }
          50% { transform: ${scale.replace('1', isActive && isMobile ? '1.3' : '1.1')}; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 6px 16px rgba(0,0,0,0.3), 0 0 20px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 6px 16px rgba(0,0,0,0.3), 0 0 30px rgba(168, 85, 247, 0.8); }
        }
      </style>
    `,
    className: `poetic-marker ${isActive && isMobile ? 'active-mobile' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

interface InteractiveMapProps {
  searchResult: SearchResult | null;
  layers: LayerConfig;
  theme: RegionalTheme;
  onParcelClick: (parcel: SelectedParcel) => void;
  filteredMarchesData: MarcheTechnoSensible[];
  tooltipMode?: 'bioacoustic' | 'default';
  onMobileMarkerClick?: (marche: MarcheTechnoSensible) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  searchResult, 
  layers, 
  theme, 
  onParcelClick,
  filteredMarchesData,
  tooltipMode = 'default',
  onMobileMarkerClick
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState<MarcheTechnoSensible | null>(null);
  const [mapContainerRef, setMapContainerRef] = useState<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Simple mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get map container reference for tooltip positioning
  useEffect(() => {
    const container = document.querySelector('.leaflet-container') as HTMLElement;
    setMapContainerRef(container);
  }, [mapReady]);

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

  // Clean up effect (no longer needed since no timers)
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleMapReady = () => {
    console.log('🗺️ Carte prête pour affichage des marqueurs');
    setMapReady(true);
  };

  // Calculer le centre et zoom par défaut
  const defaultCenter: [number, number] = [46.603354, 1.888334];
  const defaultZoom = 6;

  const handleMarkerClick = (marche: MarcheTechnoSensible, event?: any) => {
    if (isMobile && tooltipMode === 'bioacoustic' && onMobileMarkerClick) {
      // Mobile bioacoustic: open bottom sheet
      onMobileMarkerClick(marche);
    } else {
      // Desktop or direct navigation
      navigateToMarche(marche);
    }
  };

  const navigateToMarche = (marche: MarcheTechnoSensible) => {
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

  // Simple map click handler
  const handleMapClick = () => {
    // Clear any tooltips on map click
    if (hoveredMarker) {
      setHoveredMarker(null);
    }
  };

  const handleMarkerMouseEnter = (marche: MarcheTechnoSensible) => {
    // Only show tooltip on desktop for bioacoustic mode
    if (tooltipMode === 'bioacoustic' && !isMobile) {
      setHoveredMarker(marche);
    }
  };

  const handleMarkerMouseLeave = () => {
    if (tooltipMode === 'bioacoustic' && !isMobile) {
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
        <MapEventHandler onMapReady={handleMapReady} onMapClick={handleMapClick} />
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
            theme: marche.theme
          });
        }
        
        const markerIcon = createPoeticIcon(theme, false, isMobile);

          return (
            <Marker 
              key={markerKey}
              position={[marche.latitude, marche.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: (e) => handleMarkerClick(marche, e),
                 mouseover: !isMobile ? () => handleMarkerMouseEnter(marche) : undefined,
                 mouseout: !isMobile ? handleMarkerMouseLeave : undefined
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
      
      {/* Bioacoustic tooltip - Desktop hover only, anchored to marker */}
      {tooltipMode === 'bioacoustic' && !isMobile && hoveredMarker && (
        <BioacousticTooltipSimple
          marche={hoveredMarker}
          mapContainer={mapContainerRef}
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
