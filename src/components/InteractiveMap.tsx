
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Thermometer, Building } from 'lucide-react';
import { RegionalTheme } from '../utils/regionalThemes';
import { LayerConfig, SearchResult, SelectedParcel } from '../pages/Index';
import { fetchParcelData } from '../utils/lexiconApi';

interface InteractiveMapProps {
  searchResult: SearchResult | null;
  layers: LayerConfig;
  theme: RegionalTheme;
  onParcelClick: (parcel: SelectedParcel) => void;
}

const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);

  return null;
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  searchResult, 
  layers, 
  theme, 
  onParcelClick 
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.0, 0.0]);
  const [mapData, setMapData] = useState<any>(null);

  // Fetch parcel data when search result changes
  const { data: parcelData, isLoading } = useQuery({
    queryKey: ['parcelData', searchResult?.coordinates],
    queryFn: () => searchResult 
      ? fetchParcelData(searchResult.coordinates[0], searchResult.coordinates[1])
      : Promise.resolve(null),
    enabled: !!searchResult
  });

  useEffect(() => {
    if (searchResult) {
      setMapCenter(searchResult.coordinates);
    }
  }, [searchResult]);

  useEffect(() => {
    if (parcelData) {
      setMapData(parcelData);
    }
  }, [parcelData]);

  const createCustomIcon = (type: string, color: string) => {
    return new DivIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          <span style="color: white; font-size: 12px;">${type === 'weather' ? '🌡️' : type === 'transaction' ? '💰' : '🌾'}</span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const handleParcelClick = (parcelData: any) => {
    if (searchResult) {
      onParcelClick({
        id: parcelData.cadastre?.id?.value || 'unknown',
        coordinates: searchResult.coordinates,
        data: parcelData
      });
    }
  };

  const renderParcelPolygon = () => {
    if (!mapData?.geolocation?.shape || !layers.parcelles) return null;

    const coordinates = mapData.geolocation.shape.coordinates[0][0];
    const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

    return (
      <Polygon
        positions={latLngs}
        pathOptions={{
          color: theme.colors.primary,
          fillColor: theme.colors.secondary,
          fillOpacity: 0.3,
          weight: 2
        }}
        eventHandlers={{
          click: () => handleParcelClick(mapData)
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-sm mb-1">
              {mapData.cadastre?.id?.value || 'Parcelle'}
            </h3>
            <p className="text-xs text-gray-600 mb-1">
              Surface: {mapData.cadastre?.area?.value || 'N/A'} {mapData.cadastre?.area?.unit || ''}
            </p>
            <p className="text-xs text-gray-600">
              Ville: {mapData.information?.city?.value || 'N/A'}
            </p>
            <button
              onClick={() => handleParcelClick(mapData)}
              className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Voir détails
            </button>
          </div>
        </Popup>
      </Polygon>
    );
  };

  const renderWeatherStation = () => {
    if (!mapData?.['last-year-weather-reports']?.station || !layers.weatherStations) return null;

    return (
      <Marker
        position={mapCenter}
        icon={createCustomIcon('weather', theme.colors.accent)}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-sm mb-1">Station Météo</h3>
            <p className="text-xs text-gray-600">
              {mapData['last-year-weather-reports'].station.value}
            </p>
          </div>
        </Popup>
      </Marker>
    );
  };

  const renderTransactionMarkers = () => {
    if (!mapData?.transactions?.rows || !layers.immediateTransactions) return null;

    return mapData.transactions.rows.slice(0, 3).map((transaction: any, index: number) => (
      <Marker
        key={index}
        position={[mapCenter[0] + (Math.random() - 0.5) * 0.001, mapCenter[1] + (Math.random() - 0.5) * 0.001]}
        icon={createCustomIcon('transaction', '#e74c3c')}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-sm mb-1">Transaction</h3>
            <p className="text-xs text-gray-600 mb-1">
              {transaction.address?.value || 'Adresse inconnue'}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              Type: {transaction['building-nature']?.value || 'N/A'}
            </p>
            <p className="text-xs font-bold text-green-600">
              {transaction.price?.value?.toLocaleString() || 'N/A'} {transaction.price?.unit || ''}
            </p>
            <p className="text-xs text-gray-500">
              {transaction.date?.value || 'Date inconnue'}
            </p>
          </div>
        </Popup>
      </Marker>
    ));
  };

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
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController center={mapCenter} />
        
        {/* Search result marker */}
        {searchResult && (
          <Marker
            position={searchResult.coordinates}
            icon={new Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">Point de recherche</h3>
                <p className="text-xs text-gray-600">{searchResult.address}</p>
                <p className="text-xs text-gray-500">
                  {searchResult.coordinates[0].toFixed(6)}, {searchResult.coordinates[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render map layers */}
        {renderParcelPolygon()}
        {renderWeatherStation()}
        {renderTransactionMarkers()}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
