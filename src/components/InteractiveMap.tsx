
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { LayerConfig, SearchResult, SelectedParcel } from '../pages/Index';
import { fetchParcelData, fetchNearbyParcels } from '../utils/lexiconApi';

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
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [nearbyParcels, setNearbyParcels] = useState<any[]>([]);

  console.log('InteractiveMap render:', { searchResult, layers });

  const { data: parcelData, isLoading, error } = useQuery({
    queryKey: ['parcelData', searchResult?.coordinates],
    queryFn: () => {
      if (!searchResult) return Promise.resolve(null);
      console.log('Fetching parcel data for:', searchResult.coordinates);
      return fetchParcelData(searchResult.coordinates[0], searchResult.coordinates[1]);
    },
    enabled: shouldFetchData && !!searchResult,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  const { data: nearbyParcelsData, isLoading: isLoadingNearby, error: nearbyError } = useQuery({
    queryKey: ['nearbyParcels', searchResult?.coordinates, layers.radius, layers.stepM],
    queryFn: () => {
      if (!searchResult) return Promise.resolve(null);
      console.log('Fetching nearby parcels for:', searchResult.coordinates, 'radius:', layers.radius, 'step:', layers.stepM);
      return fetchNearbyParcels(
        searchResult.coordinates[0], 
        searchResult.coordinates[1],
        layers.radius,
        layers.stepM
      );
    },
    enabled: !!searchResult,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  console.log('Parcel data:', parcelData);
  console.log('Loading state:', isLoading);
  console.log('Error:', error);
  console.log('Nearby parcels data:', nearbyParcelsData);
  console.log('Loading nearby state:', isLoadingNearby);
  console.log('Nearby error:', nearbyError);

  useEffect(() => {
    if (searchResult?.coordinates) {
      console.log('Setting map center to:', searchResult.coordinates);
      setMapCenter(searchResult.coordinates);
      setZoom(15);
      // Automatically fetch data for coordinate searches
      setShouldFetchData(true);
    }
  }, [searchResult]);

  useEffect(() => {
    if (nearbyParcelsData?.parcels) {
      setNearbyParcels(nearbyParcelsData.parcels);
    }
  }, [nearbyParcelsData]);

  const handleMarkerClick = () => {
    if (searchResult && !shouldFetchData) {
      console.log('Marker clicked, starting data fetch');
      setShouldFetchData(true);
    }
  };

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
          <Marker 
            position={searchResult.coordinates}
            eventHandlers={{
              click: handleMarkerClick
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">Point de recherche</h3>
                <p className="text-xs text-gray-600">{searchResult.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordonnées: {searchResult.coordinates[0].toFixed(6)}, {searchResult.coordinates[1].toFixed(6)}
                </p>
                
                {!shouldFetchData && (
                  <button
                    onClick={handleMarkerClick}
                    className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Charger les données parcelle
                  </button>
                )}
                
                {shouldFetchData && isLoading && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="animate-pulse text-red-500">❤️</div>
                    <span className="text-xs text-gray-600">
                      Récupération des données parcelle...
                    </span>
                  </div>
                )}
                
                {isLoadingNearby && (
                  <div className="mt-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-600">
                      Recherche des parcelles à proximité...
                    </span>
                  </div>
                )}
                
                {shouldFetchData && error && (
                  <div className="mt-2 text-xs text-red-600">
                    Erreur lors du chargement des données
                  </div>
                )}
                
                {nearbyError && (
                  <div className="mt-2 text-xs text-red-600">
                    Erreur lors de la recherche des parcelles proches
                  </div>
                )}
                
                {shouldFetchData && parcelData && (
                  <div className="mt-2 text-xs text-green-600">
                    Données chargées ! Cliquez sur la parcelle pour voir les détails.
                  </div>
                )}
                
                {nearbyParcelsData && (
                  <div className="mt-2 text-xs text-green-600">
                    {nearbyParcelsData.parcels?.length || 0} parcelles trouvées à proximité
                  </div>
                )}
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
                <p className="text-xs text-gray-600 mb-2">
                  Surface: {parcelData?.cadastre?.area?.value || 'N/A'} {parcelData?.cadastre?.area?.unit || ''}
                </p>
                <button
                  onClick={handleParcelClick}
                  className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Voir tous les détails
                </button>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Nearby Parcels */}
        {nearbyParcels.map((parcel, index) => {
          const getNearbyPolygonPositions = () => {
            if (!parcel?.geolocation?.shape?.coordinates) {
              return null;
            }
            
            try {
              const coords = parcel.geolocation.shape.coordinates[0][0];
              return coords.map((coord: [number, number]) => [coord[1], coord[0]]);
            } catch (error) {
              console.error('Error processing nearby parcel coordinates:', error);
              return null;
            }
          };

          const nearbyPositions = getNearbyPolygonPositions();
          
          if (!nearbyPositions || !layers.parcelles) return null;

          return (
            <Polygon
              key={`nearby-${index}`}
              positions={nearbyPositions}
              pathOptions={{
                color: theme.colors.accent,
                fillColor: theme.colors.accent,
                fillOpacity: 0.2,
                weight: 1,
                dashArray: '5, 5'
              }}
              eventHandlers={{
                click: () => {
                  if (searchResult) {
                    onParcelClick({
                      id: parcel.cadastre?.id?.value || `nearby-${index}`,
                      coordinates: searchResult.coordinates,
                      data: parcel
                    });
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-sm mb-1">
                    Parcelle proche {parcel.cadastre?.id?.value || 'inconnue'}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">
                    Section: {parcel.cadastre?.section?.value || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    Surface: {parcel.cadastre?.area?.value || 'N/A'} {parcel.cadastre?.area?.unit || ''}
                  </p>
                  <button
                    onClick={() => {
                      if (searchResult) {
                        onParcelClick({
                          id: parcel.cadastre?.id?.value || `nearby-${index}`,
                          coordinates: searchResult.coordinates,
                          data: parcel
                        });
                      }
                    }}
                    className="mt-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Voir les détails
                  </button>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
