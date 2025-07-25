
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { LayerConfig, SearchResult, SelectedParcel } from '../pages/Index';
import { fetchParcelData } from '../utils/lexiconApi';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  searchResult: SearchResult | null;
  layers: LayerConfig;
  theme: RegionalTheme;
  onParcelClick: (parcel: SelectedParcel) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  searchResult, 
  layers, 
  theme, 
  onParcelClick 
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.603354, 1.888334]);
  const [zoom, setZoom] = useState(6);

  console.log('InteractiveMap render:', { searchResult, layers });

  const { data: parcelData, isLoading, error } = useQuery({
    queryKey: ['parcelData', searchResult?.coordinates],
    queryFn: () => {
      if (!searchResult) return Promise.resolve(null);
      console.log('Fetching parcel data for:', searchResult.coordinates);
      return fetchParcelData(searchResult.coordinates[0], searchResult.coordinates[1]);
    },
    enabled: !!searchResult,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  console.log('Parcel data:', parcelData);
  console.log('Loading state:', isLoading);
  console.log('Error:', error);

  useEffect(() => {
    if (searchResult?.coordinates) {
      console.log('Setting map center to:', searchResult.coordinates);
      setMapCenter(searchResult.coordinates);
      setZoom(15);
    }
  }, [searchResult]);

  const handleParcelClick = () => {
    if (searchResult && parcelData) {
      console.log('Parcel clicked:', { searchResult, parcelData });
      onParcelClick({
        id: parcelData.cadastre?.id?.value || 'unknown',
        coordinates: searchResult.coordinates,
        data: parcelData
      });
    }
  };

  // Process polygon coordinates
  const getPolygonPositions = () => {
    if (!parcelData?.geolocation?.shape?.coordinates) {
      console.log('No polygon coordinates found');
      return null;
    }
    
    try {
      const coords = parcelData.geolocation.shape.coordinates[0][0];
      console.log('Raw polygon coordinates:', coords);
      
      const positions = coords.map((coord: [number, number]) => [coord[1], coord[0]]);
      console.log('Processed polygon positions:', positions);
      
      return positions;
    } catch (error) {
      console.error('Error processing polygon coordinates:', error);
      return null;
    }
  };

  const polygonPositions = getPolygonPositions();

  return (
    <div className="relative h-96 md:h-[500px] lg:h-[600px]">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className="text-sm text-gray-600">Chargement des données...</span>
          </div>
        </div>
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        key={`${mapCenter[0]}-${mapCenter[1]}`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {searchResult && (
          <Marker position={searchResult.coordinates}>
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

        {polygonPositions && layers.parcelles && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: theme.colors.primary,
              fillColor: theme.colors.secondary,
              fillOpacity: 0.3,
              weight: 2
            }}
            eventHandlers={{
              click: handleParcelClick
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">
                  Parcelle {parcelData?.cadastre?.id?.value || 'inconnue'}
                </h3>
                <p className="text-xs text-gray-600 mb-1">
                  Section: {parcelData?.cadastre?.section?.value || 'N/A'}
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  Surface: {parcelData?.cadastre?.area?.value || 'N/A'} {parcelData?.cadastre?.area?.unit || ''}
                </p>
                <button
                  onClick={handleParcelClick}
                  className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Voir détails
                </button>
              </div>
            </Popup>
          </Polygon>
        )}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
